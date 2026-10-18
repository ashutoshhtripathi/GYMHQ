from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal
from typing import Optional, List
from app.database import get_db
from app.auth import require_super_admin
from app.models.user import User
from app.models.member import Member
from app.models.payment import Payment
from app.schemas.user import PlatformUserItem, PlatformOverview, UserStatusUpdate, UserResponse

router = APIRouter(prefix="/api/platform", tags=["Platform Super Admin"])


@router.get("/overview", response_model=PlatformOverview)
def get_platform_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Get high-level platform SaaS metrics for the platform owner."""
    total_gyms = db.query(func.count(User.id)).scalar() or 0
    active_gyms = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    suspended_gyms = db.query(func.count(User.id)).filter(User.is_active == False).scalar() or 0
    total_platform_athletes = db.query(func.count(Member.id)).scalar() or 0
    total_platform_collections = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or Decimal("0")

    return PlatformOverview(
        total_gyms=total_gyms,
        active_gyms=active_gyms,
        suspended_gyms=suspended_gyms,
        total_platform_athletes=total_platform_athletes,
        total_platform_collections=Decimal(str(total_platform_collections)),
    )


@router.get("/users", response_model=List[PlatformUserItem])
def get_platform_users(
    search: Optional[str] = Query(None, description="Search by username, full name, email, or gym name"),
    status: Optional[str] = Query(None, description="Filter by status: 'active' or 'suspended'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """List all registered gym owners using the platform with live operational stats."""
    query = db.query(User)

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

    users = query.order_by(User.id.asc()).all()

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


@router.delete("/users/{user_id}")
def delete_platform_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Remove a gym owner or spam account from the platform."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.username in ["admin", "owner"] or user.role == "super_admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete platform master super administrator account.",
        )

    db.delete(user)
    db.commit()
    return {"message": f"User account '{user.username}' successfully deleted from GYMHQ."}
