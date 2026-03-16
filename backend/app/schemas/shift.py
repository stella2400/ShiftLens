from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


VALID_SHIFT_CODES = {"M", "P", "N", "S", "R", "ASS"}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    employee_code: str
    ward_name: Optional[str] = None

    @field_validator("employee_code")
    @classmethod
    def normalize_employee_code(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("La matricola è obbligatoria")
        return cleaned


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    employee_code: str
    ward_name: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class ShiftRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shift_date: date
    shift_code: str
    shift_label: str
    notes: Optional[str] = None


class ShiftUpdateRequest(BaseModel):
    shift_code: str
    notes: Optional[str] = None

    @field_validator("shift_code")
    @classmethod
    def normalize_shift_code(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if cleaned not in VALID_SHIFT_CODES:
            raise ValueError("Codice turno non valido")
        return cleaned


class UploadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    month_label: str
    original_filename: str
    processing_status: str
    source_note: Optional[str] = None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_days: int
    work_days: int
    rest_days: int
    night_shifts: int
    morning_shifts: int
    afternoon_shifts: int
    smonto_days: int


class DashboardResponse(BaseModel):
    user: UserRead
    summary: DashboardSummary
    shifts: list[ShiftRead]
    uploads: list[UploadRead]
