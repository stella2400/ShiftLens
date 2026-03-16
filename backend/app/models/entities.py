from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    full_name: str = Field(index=True)
    employee_code: str = Field(index=True, unique=True)
    ward_name: Optional[str] = Field(default=None, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Upload(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    original_filename: str
    stored_path: str
    processing_status: str = Field(default="completed")
    month_label: str
    source_note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ShiftEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    upload_id: int = Field(index=True)
    shift_date: date = Field(index=True)
    shift_code: str = Field(index=True)
    shift_label: str
    notes: Optional[str] = None
