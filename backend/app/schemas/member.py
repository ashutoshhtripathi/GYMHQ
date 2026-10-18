from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


class MemberCreate(BaseModel):
    """Schema for creating a new member."""
    name: str = Field(..., min_length=1, max_length=200, description="Member full name")
    phone: str = Field(..., min_length=10, max_length=25, description="Unique phone number")
    plan: Optional[str] = Field(None, max_length=50, description="Membership plan label")
    status: str = Field("active", description="Member status")
    joining_date: Optional[date] = None
    membership_start: Optional[date] = None
    membership_end: Optional[date] = None
    monthly_fee: Optional[Decimal] = Field(None, ge=0, description="Custom monthly fee")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Phone must contain only digits, +, spaces, or hyphens")
        if len(cleaned) < 10:
            raise ValueError("Phone must be at least 10 digits")
        return cleaned

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"active", "inactive", "expired", "frozen"}
        if v.lower() not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v.lower()


class MemberUpdate(BaseModel):
    """Schema for updating a member — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=10, max_length=25)
    plan: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None
    joining_date: Optional[date] = None
    membership_start: Optional[date] = None
    membership_end: Optional[date] = None
    monthly_fee: Optional[Decimal] = Field(None, ge=0)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not cleaned.replace("+", "").isdigit():
            raise ValueError("Phone must contain only digits, +, spaces, or hyphens")
        return cleaned

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"active", "inactive", "expired", "frozen"}
        if v.lower() not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v.lower()


class MemberResponse(BaseModel):
    """Schema for member in list responses."""
    id: int
    name: str
    phone: str
    plan: Optional[str] = None
    status: str
    joining_date: Optional[date] = None
    membership_start: Optional[date] = None
    membership_end: Optional[date] = None
    monthly_fee: Optional[Decimal] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MemberListResponse(BaseModel):
    """Paginated list of members."""
    members: list[MemberResponse]
    total: int
    page: int
    page_size: int


class MemberDetailResponse(MemberResponse):
    """Extended member response with attendance and payment history."""
    attendance_count: int = 0
    total_paid: Decimal = Decimal("0")
    outstanding_balance: Decimal = Decimal("0")

    model_config = {"from_attributes": True}
