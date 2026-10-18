from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from datetime import date
from typing import Optional
from app.database import get_db
from app.models.attendance import Attendance
from app.models.member import Member
from app.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceListResponse

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("", response_model=AttendanceListResponse)
def list_attendance(
    search: Optional[str] = Query(None, description="Search by member name or phone"),
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    member_id: Optional[int] = Query(None, description="Filter by member"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List attendance records with search and date filters."""
    query = (
        db.query(Attendance, Member.name, Member.phone)
        .join(Member, Attendance.member_id == Member.id)
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Member.name.ilike(search_term),
                Member.phone.ilike(search_term),
            )
        )

    if date_from:
        query = query.filter(Attendance.attendance_date >= date_from)
    if date_to:
        query = query.filter(Attendance.attendance_date <= date_to)
    if member_id:
        query = query.filter(Attendance.member_id == member_id)

    total = query.count()
    results = (
        query.order_by(Attendance.attendance_date.desc(), Attendance.checked_in_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    records = []
    for att, member_name, member_phone in results:
        records.append(AttendanceResponse(
            id=att.id,
            member_id=att.member_id,
            member_name=member_name,
            member_phone=member_phone,
            attendance_date=att.attendance_date,
            checked_in_at=att.checked_in_at,
        ))

    return AttendanceListResponse(
        records=records,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/today/count")
def today_attendance_count(db: Session = Depends(get_db)):
    """Get today's attendance count."""
    today = date.today()
    count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.attendance_date == today)
        .scalar() or 0
    )
    return {"date": str(today), "count": count}


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(data: AttendanceCreate, db: Session = Depends(get_db)):
    """Mark a member present for a date. Prevents duplicates."""
    # Verify member exists
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Check for duplicate
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.member_id == data.member_id,
            Attendance.attendance_date == data.attendance_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{member.name} is already marked present for {data.attendance_date}",
        )

    attendance = Attendance(
        member_id=data.member_id,
        attendance_date=data.attendance_date,
    )

    try:
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate attendance record",
        )

    return AttendanceResponse(
        id=attendance.id,
        member_id=attendance.member_id,
        member_name=member.name,
        member_phone=member.phone,
        attendance_date=attendance.attendance_date,
        checked_in_at=attendance.checked_in_at,
    )


@router.get("/member/{member_id}", response_model=AttendanceListResponse)
def member_attendance(
    member_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get attendance history for a specific member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    query = db.query(Attendance).filter(Attendance.member_id == member_id)

    if date_from:
        query = query.filter(Attendance.attendance_date >= date_from)
    if date_to:
        query = query.filter(Attendance.attendance_date <= date_to)

    total = query.count()
    records = (
        query.order_by(Attendance.attendance_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AttendanceListResponse(
        records=[
            AttendanceResponse(
                id=a.id,
                member_id=a.member_id,
                member_name=member.name,
                member_phone=member.phone,
                attendance_date=a.attendance_date,
                checked_in_at=a.checked_in_at,
            )
            for a in records
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
