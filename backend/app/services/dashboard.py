from collections import Counter
from sqlmodel import Session, select

from app.models.entities import ShiftEntry, Upload, User
from app.schemas.shift import DashboardResponse, DashboardSummary, ShiftRead, UploadRead, UserRead


def build_dashboard(session: Session, user_id: int) -> DashboardResponse | None:
    user = session.get(User, user_id)
    if not user:
        return None

    shifts = session.exec(select(ShiftEntry).where(ShiftEntry.user_id == user_id).order_by(ShiftEntry.shift_date.asc())).all()
    uploads = session.exec(select(Upload).where(Upload.user_id == user_id).order_by(Upload.created_at.desc())).all()
    counts = Counter(item.shift_code for item in shifts)

    summary = DashboardSummary(
        total_days=len(shifts),
        work_days=sum(1 for item in shifts if item.shift_code in {"M", "P", "N"}),
        rest_days=counts.get("R", 0),
        night_shifts=counts.get("N", 0),
        morning_shifts=counts.get("M", 0),
        afternoon_shifts=counts.get("P", 0),
        smonto_days=counts.get("S", 0),
    )
    return DashboardResponse(
        user=UserRead.model_validate(user),
        summary=summary,
        shifts=[ShiftRead.model_validate(item) for item in shifts],
        uploads=[UploadRead.model_validate(item) for item in uploads],
    )
