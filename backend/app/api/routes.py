from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.models.entities import ShiftEntry, User
from app.schemas.shift import (
    AuthResponse,
    DashboardResponse,
    LoginRequest,
    RegisterRequest,
    ShiftRead,
    ShiftUpdateRequest,
    UserRead,
)
from app.services.auth import authenticate_user, create_access_token, get_current_user, hash_password
from app.services.dashboard import build_dashboard
from app.services.parser import ShiftParserService
from app.utils.shift_codes import SHIFT_LABELS

router = APIRouter()
settings = get_settings()
parser_service = ShiftParserService()


@router.get('/health')
def healthcheck():
    return {'status': 'ok', 'app': settings.app_name, 'ai_provider': 'huggingface', 'model': settings.hf_model}


@router.post('/auth/register', response_model=AuthResponse)
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    existing_email = session.exec(select(User).where(User.email == payload.email)).first()
    if existing_email:
        raise HTTPException(status_code=400, detail='Esiste già un account con questa email')
    existing_code = session.exec(select(User).where(User.employee_code == payload.employee_code)).first()
    if existing_code:
        raise HTTPException(status_code=400, detail='Esiste già un account con questa matricola')

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        employee_code=payload.employee_code,
        ward_name=payload.ward_name,
        hashed_password=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return AuthResponse(access_token=create_access_token(user), user=UserRead.model_validate(user))


@router.post('/auth/login', response_model=AuthResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = authenticate_user(session, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail='Credenziali non valide')
    return AuthResponse(access_token=create_access_token(user), user=UserRead.model_validate(user))


@router.get('/auth/me', response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get('/dashboard/me', response_model=DashboardResponse)
def get_my_dashboard(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    dashboard = build_dashboard(session, current_user.id)
    if not dashboard:
        raise HTTPException(status_code=404, detail='Utente non trovato')
    return dashboard


@router.post('/ingest/me')
async def ingest_shift_image(
    image: UploadFile = File(...),
    note: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    suffix = Path(image.filename or 'upload.jpg').suffix or '.jpg'
    dest = Path(settings.uploads_dir) / f'{uuid4()}{suffix}'
    dest.write_bytes(await image.read())

    try:
        upload = parser_service.parse_and_store(session, current_user, str(dest), image.filename or dest.name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Errore estrazione turni: {exc}') from exc

    return {
        'message': 'Turni elaborati con successo',
        'upload_id': upload.id,
        'month_label': upload.month_label,
        'note': note,
        'source_note': upload.source_note,
    }


@router.put('/shifts/{shift_id}', response_model=ShiftRead)
def update_shift(
    shift_id: int,
    payload: ShiftUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    shift = session.get(ShiftEntry, shift_id)
    if not shift or shift.user_id != current_user.id:
        raise HTTPException(status_code=404, detail='Turno non trovato')

    shift.shift_code = payload.shift_code
    shift.shift_label = 'Assenza / Da verificare' if payload.shift_code == 'ASS' else SHIFT_LABELS.get(payload.shift_code, payload.shift_code)
    shift.notes = payload.notes
    session.add(shift)
    session.commit()
    session.refresh(shift)
    return ShiftRead.model_validate(shift)
