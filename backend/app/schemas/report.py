from pydantic import BaseModel
from decimal import Decimal
from typing import Optional


class MemberFeeDetail(BaseModel):
    """Per-member fee detail for monthly report."""
    member_id: int
    member_name: str
    phone: str
    plan: Optional[str] = None
    status: str
    monthly_fee: Decimal
    expected_amount: Decimal
    paid_amount: Decimal
    remaining_balance: Decimal
    payment_status: str  # "paid", "partial", "unpaid"


class MonthlyFeeReport(BaseModel):
    """
    Monthly fee report.

    Policy:
    - expected_fees: Sum of monthly_fee for all members who were active (status='active')
      AND whose membership period (membership_start to membership_end) overlaps with
      the selected month. Members joining or leaving mid-month are charged the full
      monthly_fee (no prorating).
    - total_paid: Sum of payments where fee_month matches the selected month.
    - outstanding_dues: expected_fees - total_paid (minimum 0).
    - Members with status 'inactive' or 'expired' are excluded from expected fees
      unless their membership period explicitly covers the selected month.
    """
    month: str  # YYYY-MM
    expected_fees: Decimal
    total_paid: Decimal
    outstanding_dues: Decimal
    member_details: list[MemberFeeDetail] = []


class AttendanceReportEntry(BaseModel):
    """Single entry in attendance report."""
    member_id: int
    member_name: str
    phone: str
    attendance_date: str
    checked_in_at: Optional[str] = None


class AttendanceReport(BaseModel):
    """Attendance report response."""
    records: list[AttendanceReportEntry] = []
    total: int = 0
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class ExpiryReportEntry(BaseModel):
    """Membership expiry report entry."""
    member_id: int
    member_name: str
    phone: str
    plan: Optional[str] = None
    membership_end: Optional[str] = None
    status: str
    monthly_fee: Optional[Decimal] = None


class ExpiryReport(BaseModel):
    """Membership expiry report."""
    entries: list[ExpiryReportEntry] = []
    total: int = 0


class CollectionReport(BaseModel):
    """Monthly collection report."""
    month: str
    total_collected: Decimal
    payment_count: int
    by_method: dict[str, Decimal] = {}


class DuesEntry(BaseModel):
    """Member with outstanding dues."""
    member_id: int
    member_name: str
    phone: str
    outstanding_amount: Decimal
    membership_end: Optional[str] = None
    status: str
    reminder_message: str
