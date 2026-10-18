from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal
from typing import Optional
from app.database import get_db
from app.auth import get_current_active_user_optional
from app.models.user import User
from app.models.member import Member
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.schemas.member import (
    MemberCreate, MemberUpdate, MemberResponse, MemberListResponse, MemberDetailResponse,
)

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("", response_model=MemberListResponse)
def list_members(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """List members strictly scoped to the authenticated gym owner."""
    query = db.query(Member).filter(Member.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Member.name.ilike(search_term),
                Member.phone.ilike(search_term),
            )
        )

    if status_filter:
        query = query.filter(Member.status == status_filter.lower())

    total = query.count()
    members = (
        query.order_by(Member.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return MemberListResponse(
        members=[MemberResponse.model_validate(m) for m in members],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{member_id}", response_model=MemberDetailResponse)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Get a single member with details for the current gym owner."""
    member = db.query(Member).filter(Member.id == member_id, Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    attendance_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.member_id == member_id)
        .scalar() or 0
    )

    total_paid = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.member_id == member_id)
        .scalar()
    )

    # Calculate outstanding: monthly_fee * months active - total_paid
    monthly_fee = member.monthly_fee or Decimal("0")
    outstanding = max(Decimal("0"), monthly_fee - total_paid) if monthly_fee > 0 else Decimal("0")

    response = MemberDetailResponse.model_validate(member)
    response.attendance_count = attendance_count
    response.total_paid = Decimal(str(total_paid))
    response.outstanding_balance = outstanding
    return response


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Create a new member scoped to current gym owner. Phone must be unique within this gym."""
    existing = db.query(Member).filter(
        Member.phone == data.phone,
        Member.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A member with phone {data.phone} already exists in your gym",
        )

    member = Member(
        user_id=current_user.id,
        name=data.name,
        phone=data.phone,
        plan=data.plan,
        status=data.status,
        joining_date=data.joining_date,
        membership_start=data.membership_start,
        membership_end=data.membership_end,
        monthly_fee=data.monthly_fee,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Update a member's details."""
    member = db.query(Member).filter(Member.id == member_id, Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    update_data = data.model_dump(exclude_unset=True)

    # Check phone uniqueness within this gym if phone is being changed
    if "phone" in update_data and update_data["phone"] != member.phone:
        existing = db.query(Member).filter(
            Member.phone == update_data["phone"],
            Member.id != member_id,
            Member.user_id == current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A member with phone {update_data['phone']} already exists in your gym",
            )

    for key, value in update_data.items():
        setattr(member, key, value)

    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)


@router.patch("/{member_id}/deactivate", response_model=MemberResponse)
def deactivate_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Deactivate a member (soft delete)."""
    member = db.query(Member).filter(Member.id == member_id, Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    member.status = "inactive"
    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)


@router.patch("/{member_id}/activate", response_model=MemberResponse)
def activate_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Reactivate an inactive member."""
    member = db.query(Member).filter(Member.id == member_id, Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    member.status = "active"
    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)


@router.patch("/{member_id}/renew", response_model=MemberResponse)
def renew_membership(
    member_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """
    Renew a member's membership. Updates membership dates and plan label.
    Does NOT overwrite historical payment records.
    """
    member = db.query(Member).filter(Member.id == member_id, Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    update_data = data.model_dump(exclude_unset=True)

    # Only allow updating membership-related fields during renewal
    allowed_fields = {"membership_start", "membership_end", "plan", "monthly_fee", "status"}
    for key in list(update_data.keys()):
        if key not in allowed_fields:
            del update_data[key]

    if "membership_start" not in update_data or "membership_end" not in update_data:
        raise HTTPException(
            status_code=400,
            detail="Both membership_start and membership_end are required for renewal",
        )

    for key, value in update_data.items():
        setattr(member, key, value)

    # Ensure status is active after renewal
    member.status = update_data.get("status", "active")

    db.commit()
    db.refresh(member)
    return MemberResponse.model_validate(member)
