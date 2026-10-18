from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


class PaymentCreate(BaseModel):
    """Schema for recording a payment."""
    member_id: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    payment_method: str = Field(..., description="Payment method")
    payment_date: date = Field(..., description="Date payment was received")
    fee_month: str = Field(..., description="Month this payment applies to, e.g. 2026-10")

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        allowed = {"cash", "upi", "card", "bank_transfer"}
        if v.lower() not in allowed:
            raise ValueError(f"Payment method must be one of: {', '.join(allowed)}")
        return v.lower()

    @field_validator("fee_month")
    @classmethod
    def validate_fee_month(cls, v: str) -> str:
        import re
        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("fee_month must be in YYYY-MM format, e.g. 2026-10")
        return v


class PaymentResponse(BaseModel):
    """Schema for payment record response."""
    id: int
    member_id: int
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    amount: Decimal
    payment_method: Optional[str] = None
    payment_date: date
    fee_month: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    """Paginated payment list."""
    payments: list[PaymentResponse]
    total: int
    page: int
    page_size: int
