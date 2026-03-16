import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.models.entities import User

settings = get_settings()
security = HTTPBearer(auto_error=False)


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or base64.b64encode(os.urandom(16)).decode('utf-8')
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 390000)
    return f"{salt}${base64.b64encode(digest).decode('utf-8')}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split('$', 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, f"{salt}${hashed}")


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'exp': now + timedelta(minutes=settings.jwt_expire_minutes),
        'iat': now,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm='HS256')


def authenticate_user(session: Session, email: str, password: str) -> User | None:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail='Autenticazione richiesta')
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=['HS256'])
        user_id = int(payload['sub'])
    except Exception as exc:
        raise HTTPException(status_code=401, detail='Token non valido o scaduto') from exc

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail='Utente non trovato')
    return user
