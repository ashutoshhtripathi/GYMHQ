from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class AttendanceCreate(BaseModel):
    """Schema for marking attendance."""
    member_id: int = Field(..., gt=0)
    attendance_date: date = Field(..., description="Date of attendance")


class AttendanceResponse(BaseModel):
    """Schema for attendance record response."""
    id: int
    member_id: int
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    attendance_date: date
    checked_in_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AttendanceListResponse(BaseModel):
    """Paginated attendance list."""
    records: list[AttendanceResponse]
    total: int
    page: int
    page_size: int
