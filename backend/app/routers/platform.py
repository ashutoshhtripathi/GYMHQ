from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal
from datetime import date, timedelta
from typing import Optional, List
from app.database import get_db
from app.auth import require_super_admin
from app.models.user import User
from app.models.member import Member
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.schemas.user import (
    PlatformUserItem, PlatformOverview, UserStatusUpdate,
    UserResponse, GymSubscriptionUpdate,
)

router = APIRouter(prefix="/api/platform", tags=["Platform Super Admin"])


@router.get("/overview", response_model=PlatformOverview)
def get_platform_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get high-level platform SaaS metrics, recurring revenue, and subscription counts.
    Strictly restricted to Platform Super Admins.
    """
    today = date.today()
    seven_days_ahead = today + timedelta(days=7)

    # Exclude root super_admins from client metrics if preferred, or include all client gyms
    gym_filter = User.role != "super_admin"

    total_gyms = db.query(func.count(User.id)).filter(gym_filter).scalar() or 0
    active_gyms = db.query(func.count(User.id)).filter(gym_filter, User.is_active == True).scalar() or 0
    suspended_gyms = db.query(func.count(User.id)).filter(gym_filter, User.is_active == False).scalar() or 0

    # Gyms expiring in next 7 days
    expiring_gyms_count = (
        db.query(func.count(User.id))
        .filter(
            gym_filter,
            User.is_active == True,
            User.subscription_end.isnot(None),
            User.subscription_end >= today,
            User.subscription_end <= seven_days_ahead,
        )
        .scalar() or 0
    )

    # Overdue gyms
    overdue_gyms_count = (
        db.query(func.count(User.id))
        .filter(
            gym_filter,
            User.subscription_end.isnot(None),
            User.subscription_end < today,
        )
        .scalar() or 0
    )

    # Platform Monthly Recurring Revenue (MRR) - Total fees we take from all active gyms
    mrr = (
        db.query(func.coalesce(func.sum(User.subscription_fee), 0))
        .filter(gym_filter, User.is_active == True)
        .scalar() or Decimal("0")
    )

    # Pending subscription fees from gyms with overdue or expiring accounts
    pending_revenue = (
        db.query(func.coalesce(func.sum(User.subscription_fee), 0))
        .filter(
            gym_filter,
            User.subscription_end.isnot(None),
            User.subscription_end <= seven_days_ahead,
        )
        .scalar() or Decimal("0")
    )

    total_platform_athletes = db.query(func.count(Member.id)).scalar() or 0
    total_platform_collections = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or Decimal("0")

    return PlatformOverview(
        total_gyms=total_gyms,
        active_gyms=active_gyms,
        suspended_gyms=suspended_gyms,
        expiring_gyms_count=expiring_gyms_count,
        overdue_gyms_count=overdue_gyms_count,
        monthly_recurring_revenue=Decimal(str(mrr)),
        pending_subscription_revenue=Decimal(str(pending_revenue)),
        total_platform_athletes=total_platform_athletes,
        total_platform_collections=Decimal(str(total_platform_collections)),
    )


@router.get("/users", response_model=List[PlatformUserItem])
def get_platform_users(
    search: Optional[str] = Query(None, description="Search by username, full name, email, or gym name"),
    status: Optional[str] = Query(None, description="Filter: 'active', 'suspended', 'expiring_soon', 'overdue'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    List all registered gym owners with SaaS subscription dates, days remaining, and athlete counts.
    """
    today = date.today()
    seven_days = today + timedelta(days=7)

    query = db.query(User).filter(User.role != "super_admin")

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.username).like(s),
                func.lower(User.email).like(s),
                func.lower(User.full_name).like(s),
                func.lower(User.gym_name).like(s),
            )
        )

    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "suspended":
        query = query.filter(User.is_active == False)
    elif status == "expiring_soon":
        query = query.filter(
            User.is_active == True,
            User.subscription_end.isnot(None),
            User.subscription_end >= today,
            User.subscription_end <= seven_days,
        )
    elif status == "overdue":
        query = query.filter(
            User.subscription_end.isnot(None),
            User.subscription_end < today,
        )

    users = query.order_by(User.id.desc()).all()

    result = []
    for u in users:
        # Calculate isolated metrics per gym owner
        m_count = db.query(func.count(Member.id)).filter(Member.user_id == u.id).scalar() or 0
        c_amt = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Member, Payment.member_id == Member.id)
            .filter(Member.user_id == u.id)
            .scalar() or Decimal("0")
        )

        sub_end = u.subscription_end or (today + timedelta(days=30))
        days_rem = (sub_end - today).days
        is_over = days_rem < 0

        # Dynamic computed status for display
        if not u.is_active:
            sub_status = "suspended"
        elif is_over:
            sub_status = "overdue"
        elif days_rem <= 7:
            sub_status = "expiring_soon"
        else:
            sub_status = "active"

        result.append(
            PlatformUserItem(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                gym_name=u.gym_name or "My Gym",
                gym_address=u.gym_address,
                gym_phone=u.gym_phone,
                upi_id=u.upi_id,
                role=u.role or "admin",
                is_active=u.is_active,
                created_at=u.created_at,
                last_login_at=u.last_login_at,
                members_count=m_count,
                total_collections=Decimal(str(c_amt)),
                subscription_fee=u.subscription_fee or Decimal("999.00"),
                subscription_plan=u.subscription_plan or "Standard Monthly",
                subscription_status=sub_status,
                subscription_start=u.subscription_start,
                subscription_end=sub_end,
                days_remaining=days_rem,
                is_overdue=is_over,
                admin_notes=u.admin_notes,
            )
        )

    return result


@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Toggle access on/off for a gym owner. If set to is_active=False, the user is barred from logging in."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if (user.username in ["admin", "owner"] or user.role == "super_admin") and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot suspend platform master super administrator account.",
        )

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}/subscription", response_model=PlatformUserItem)
def update_gym_subscription(
    user_id: int,
    data: GymSubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Update SaaS subscription pricing, extend duration, reactivate access, or update notes for a gym.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Gym account not found")

    today = date.today()

    if data.subscription_fee is not None:
        user.subscription_fee = data.subscription_fee
    if data.subscription_plan is not None:
        user.subscription_plan = data.subscription_plan
    if data.admin_notes is not None:
        user.admin_notes = data.admin_notes

    # Extending subscription duration
    if data.extend_days is not None and data.extend_days > 0:
        # Extend from either existing future end date or from today
        base_date = user.subscription_end if (user.subscription_end and user.subscription_end > today) else today
        user.subscription_end = base_date + timedelta(days=data.extend_days)
        # Extending automatically reactivates the gym's access!
        user.is_active = True
        user.subscription_status = "active"
    elif data.subscription_end is not None:
        user.subscription_end = data.subscription_end

    if data.subscription_start is not None:
        user.subscription_start = data.subscription_start

    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    # Re-calculate days remaining
    sub_end = user.subscription_end or (today + timedelta(days=30))
    days_rem = (sub_end - today).days
    is_over = days_rem < 0

    m_count = db.query(func.count(Member.id)).filter(Member.user_id == user.id).scalar() or 0
    c_amt = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Member, Payment.member_id == Member.id)
        .filter(Member.user_id == user.id)
        .scalar() or Decimal("0")
    )

    return PlatformUserItem(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        gym_name=user.gym_name or "My Gym",
        gym_address=user.gym_address,
        gym_phone=user.gym_phone,
        upi_id=user.upi_id,
        role=user.role or "admin",
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        members_count=m_count,
        total_collections=Decimal(str(c_amt)),
        subscription_fee=user.subscription_fee or Decimal("999.00"),
        subscription_plan=user.subscription_plan or "Standard Monthly",
        subscription_status="active" if user.is_active and not is_over else ("overdue" if is_over else "suspended"),
        subscription_start=user.subscription_start,
        subscription_end=sub_end,
        days_remaining=days_rem,
        is_overdue=is_over,
        admin_notes=user.admin_notes,
    )


@router.delete("/users/{user_id}")
def delete_platform_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Remove a gym owner and all associated members/records from GYMHQ."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.username in ["admin", "owner"] or user.role == "super_admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete platform master super administrator account.",
        )

    # Clean up all child data belonging to this gym
    members = db.query(Member).filter(Member.user_id == user.id).all()
    member_ids = [m.id for m in members]

    if member_ids:
        # Delete payments for these members
        db.query(Payment).filter(Payment.member_id.in_(member_ids)).delete(synchronize_session=False)
        # Delete attendance for these members
        db.query(Attendance).filter(Attendance.member_id.in_(member_ids)).delete(synchronize_session=False)
        # Delete members
        db.query(Member).filter(Member.id.in_(member_ids)).delete(synchronize_session=False)

    gym_title = user.gym_name or user.username
    db.delete(user)
    db.commit()
    return {"message": f"Gym '{gym_title}' and all its records have been successfully deleted from GYMHQ."}
