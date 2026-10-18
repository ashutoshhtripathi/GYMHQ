from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from app.database import get_db
from app.auth import get_current_active_user_optional
from app.models.user import User
from app.models.member import Member
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.schemas.dashboard import (
    DashboardResponse, DashboardStats, RecentPayment,
    ExpiringMembership, RecentAttendance, MonthlyTrendPoint,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    month: Optional[str] = Query(None, description="Month for collection in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """
    Get dashboard data with real database aggregations strictly scoped to the authenticated gym owner.
    """
    today = date.today()

    if month is None:
        month = f"{today.year}-{today.month:02d}"

    # Parse month for date range
    try:
        year, mon = map(int, month.split("-"))
        month_start = date(year, mon, 1)
        if mon == 12:
            month_end = date(year + 1, 1, 1)
        else:
            month_end = date(year, mon + 1, 1)
    except (ValueError, IndexError):
        year, mon = today.year, today.month
        month_start = date(year, mon, 1)
        month_end = date(year, mon + 1, 1) if mon < 12 else date(year + 1, 1, 1)

    # Stats strictly for current gym owner
    total_members = db.query(func.count(Member.id)).filter(Member.user_id == current_user.id).scalar() or 0
    active_members = (
        db.query(func.count(Member.id))
        .filter(Member.status == "active", Member.user_id == current_user.id)
        .scalar() or 0
    )
    expired_memberships = (
        db.query(func.count(Member.id))
        .filter(
            Member.user_id == current_user.id,
            Member.membership_end < today,
            Member.status.in_(["active", "expired"]),
        )
        .scalar() or 0
    )

    # Members with pending dues for selected month
    pending_dues_count = 0
    active_with_fee = (
        db.query(Member)
        .filter(
            Member.user_id == current_user.id,
            Member.status == "active",
            Member.monthly_fee.isnot(None),
            Member.monthly_fee > 0,
        )
        .all()
    )
    for member in active_with_fee:
        paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.member_id == member.id,
                Payment.fee_month == month,
            )
            .scalar()
        )
        if paid < (member.monthly_fee or 0):
            pending_dues_count += 1

    stats = DashboardStats(
        total_members=total_members,
        active_members=active_members,
        expired_memberships=expired_memberships,
        pending_dues_count=pending_dues_count,
    )

    # Current month collection: based on payment_date in the selected month for this gym
    current_month_collection = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Member, Payment.member_id == Member.id)
        .filter(
            Member.user_id == current_user.id,
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .scalar()
    )

    # Recent payments (last 10)
    recent_payments_raw = (
        db.query(Payment, Member.name)
        .join(Member, Payment.member_id == Member.id)
        .filter(Member.user_id == current_user.id)
        .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
        .limit(10)
        .all()
    )
    recent_payments = [
        RecentPayment(
            id=p.id,
            member_name=name,
            amount=p.amount,
            payment_method=p.payment_method,
            payment_date=p.payment_date,
            fee_month=p.fee_month,
        )
        for p, name in recent_payments_raw
    ]

    # Expiring memberships (next 30 days + already expired)
    thirty_days_from_now = today + timedelta(days=30)
    expiring_raw = (
        db.query(Member)
        .filter(
            Member.user_id == current_user.id,
            Member.membership_end.isnot(None),
            Member.membership_end <= thirty_days_from_now,
            Member.status.in_(["active", "expired"]),
        )
        .order_by(Member.membership_end.asc())
        .limit(15)
        .all()
    )
    expiring_memberships = [
        ExpiringMembership(
            member_id=m.id,
            member_name=m.name,
            phone=m.phone,
            membership_end=m.membership_end,
            plan=m.plan,
            days_remaining=(m.membership_end - today).days,
        )
        for m in expiring_raw
    ]

    # Recent attendance (last 10)
    recent_att_raw = (
        db.query(Attendance, Member.name)
        .join(Member, Attendance.member_id == Member.id)
        .filter(Member.user_id == current_user.id)
        .order_by(Attendance.attendance_date.desc(), Attendance.checked_in_at.desc())
        .limit(10)
        .all()
    )
    recent_attendance = [
        RecentAttendance(
            member_id=a.member_id,
            member_name=name,
            attendance_date=a.attendance_date,
        )
        for a, name in recent_att_raw
    ]

    # Today's attendance count for this gym
    today_attendance_count = (
        db.query(func.count(Attendance.id))
        .join(Member, Attendance.member_id == Member.id)
        .filter(Member.user_id == current_user.id, Attendance.attendance_date == today)
        .scalar() or 0
    )

    # 6-Month Historical Monthly Trend (Rolling 6 months up to selected month for this gym)
    monthly_graph = []
    for i in range(5, -1, -1):
        total_months = year * 12 + (mon - 1) - i
        target_year = total_months // 12
        target_mon = (total_months % 12) + 1

        m_start = date(target_year, target_mon, 1)
        if target_mon == 12:
            m_end = date(target_year + 1, 1, 1)
        else:
            m_end = date(target_year, target_mon + 1, 1)

        m_coll = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Member, Payment.member_id == Member.id)
            .filter(
                Member.user_id == current_user.id,
                Payment.payment_date >= m_start,
                Payment.payment_date < m_end,
            )
            .scalar()
        ) or 0

        m_members = (
            db.query(func.count(Member.id))
            .filter(
                Member.user_id == current_user.id,
                Member.joining_date >= m_start,
                Member.joining_date < m_end,
            )
            .scalar()
        ) or 0

        m_att = (
            db.query(func.count(Attendance.id))
            .join(Member, Attendance.member_id == Member.id)
            .filter(
                Member.user_id == current_user.id,
                Attendance.attendance_date >= m_start,
                Attendance.attendance_date < m_end,
            )
            .scalar()
        ) or 0

        monthly_graph.append(
            MonthlyTrendPoint(
                month=f"{target_year}-{target_mon:02d}",
                month_label=m_start.strftime("%B %Y"),
                short_label=m_start.strftime("%b"),
                collection=Decimal(str(m_coll)),
                new_members=m_members,
                attendance_count=m_att,
            )
        )

    return DashboardResponse(
        stats=stats,
        current_month_collection=Decimal(str(current_month_collection)),
        selected_month=month,
        recent_payments=recent_payments,
        expiring_memberships=expiring_memberships,
        recent_attendance=recent_attendance,
        today_attendance_count=today_attendance_count,
        monthly_graph=monthly_graph,
    )
