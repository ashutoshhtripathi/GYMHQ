from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from typing import Optional


class DashboardStats(BaseModel):
    """Core dashboard statistics."""
    total_members: int = 0
    active_members: int = 0
    expired_memberships: int = 0
    pending_dues_count: int = 0


class RecentPayment(BaseModel):
    """Recent payment for dashboard display."""
    id: int
    member_name: str
    amount: Decimal
    payment_method: Optional[str] = None
    payment_date: date
    fee_month: Optional[str] = None


class ExpiringMembership(BaseModel):
    """Upcoming membership expiry."""
    member_id: int
    member_name: str
    phone: str
    membership_end: date
    plan: Optional[str] = None
    days_remaining: int


class RecentAttendance(BaseModel):
    """Recent attendance entry."""
    member_id: int
    member_name: str
    attendance_date: date


class MonthlyTrendPoint(BaseModel):
    """Monthly performance metrics for gym revenue, enrollment and check-ins."""
    month: str  # YYYY-MM
    month_label: str  # e.g. "October 2026"
    short_label: str  # e.g. "Oct"
    collection: Decimal = Decimal("0")
    new_members: int = 0
    attendance_count: int = 0


class DashboardResponse(BaseModel):
    """Complete dashboard data."""
    stats: DashboardStats
    current_month_collection: Decimal = Decimal("0")
    selected_month: str  # YYYY-MM
    recent_payments: list[RecentPayment] = []
    expiring_memberships: list[ExpiringMembership] = []
    recent_attendance: list[RecentAttendance] = []
    today_attendance_count: int = 0
    monthly_graph: list[MonthlyTrendPoint] = []
