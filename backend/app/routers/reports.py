from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal
from typing import Optional
import csv
import io
from app.database import get_db
from app.auth import get_current_active_user_optional
from app.models.user import User
from app.models.member import Member
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.schemas.report import (
    MonthlyFeeReport, MemberFeeDetail, AttendanceReport, AttendanceReportEntry,
    ExpiryReport, ExpiryReportEntry, CollectionReport, DuesEntry,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _parse_month(month_str: str):
    """Parse YYYY-MM string into (year, month, start_date, end_date)."""
    try:
        year, mon = map(int, month_str.split("-"))
        start = date(year, mon, 1)
        end = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)
        return year, mon, start, end
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")


def _member_overlaps_month(member, month_start, month_end):
    """Check if a member's membership period overlaps with the given month."""
    ms = member.membership_start
    me = member.membership_end

    if ms and me:
        return ms < month_end and me >= month_start
    elif ms:
        return ms < month_end
    else:
        return member.status == "active"


@router.get("/monthly-fees", response_model=MonthlyFeeReport)
def monthly_fee_report(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Monthly fee report showing expected vs paid per member for current gym."""
    _, _, month_start, month_end = _parse_month(month)

    members = (
        db.query(Member)
        .filter(
            Member.user_id == current_user.id,
            Member.status != "inactive",
            Member.monthly_fee.isnot(None),
            Member.monthly_fee > 0,
        )
        .all()
    )

    total_expected = Decimal("0")
    total_paid = Decimal("0")
    member_details = []

    for member in members:
        if not _member_overlaps_month(member, month_start, month_end):
            continue

        fee = member.monthly_fee or Decimal("0")
        total_expected += fee

        paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.member_id == member.id,
                Payment.fee_month == month,
            )
            .scalar()
        )
        paid = Decimal(str(paid))
        total_paid += paid

        remaining = max(Decimal("0"), fee - paid)
        if paid >= fee:
            pmt_status = "paid"
        elif paid > 0:
            pmt_status = "partial"
        else:
            pmt_status = "unpaid"

        member_details.append(MemberFeeDetail(
            member_id=member.id,
            member_name=member.name,
            phone=member.phone,
            plan=member.plan,
            status=member.status,
            monthly_fee=fee,
            expected_amount=fee,
            paid_amount=paid,
            remaining_balance=remaining,
            payment_status=pmt_status,
        ))

    status_order = {"unpaid": 0, "partial": 1, "paid": 2}
    member_details.sort(key=lambda x: status_order.get(x.payment_status, 3))

    return MonthlyFeeReport(
        month=month,
        expected_fees=total_expected,
        total_paid=total_paid,
        outstanding_dues=max(Decimal("0"), total_expected - total_paid),
        member_details=member_details,
    )


@router.get("/attendance", response_model=AttendanceReport)
def attendance_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    member_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Attendance report with date and member filters for current gym."""
    query = (
        db.query(Attendance, Member.name, Member.phone)
        .join(Member, Attendance.member_id == Member.id)
        .filter(Member.user_id == current_user.id)
    )

    if date_from:
        query = query.filter(Attendance.attendance_date >= date_from)
    if date_to:
        query = query.filter(Attendance.attendance_date <= date_to)
    if member_id:
        query = query.filter(Attendance.member_id == member_id)

    results = query.order_by(Attendance.attendance_date.desc()).all()

    records = [
        AttendanceReportEntry(
            member_id=att.member_id,
            member_name=name,
            phone=phone,
            attendance_date=str(att.attendance_date),
            checked_in_at=str(att.checked_in_at) if att.checked_in_at else None,
        )
        for att, name, phone in results
    ]

    return AttendanceReport(
        records=records,
        total=len(records),
        date_from=str(date_from) if date_from else None,
        date_to=str(date_to) if date_to else None,
    )


@router.get("/expiry", response_model=ExpiryReport)
def expiry_report(
    status_filter: Optional[str] = Query(None, alias="status"),
    days_ahead: int = Query(30, description="Show expiries within N days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Membership expiry report for current gym."""
    today = date.today()
    from datetime import timedelta
    cutoff = today + timedelta(days=days_ahead)

    query = db.query(Member).filter(
        Member.user_id == current_user.id,
        Member.membership_end.isnot(None),
        Member.membership_end <= cutoff,
    )

    if status_filter:
        query = query.filter(Member.status == status_filter)

    results = query.order_by(Member.membership_end.asc()).all()

    entries = [
        ExpiryReportEntry(
            member_id=m.id,
            member_name=m.name,
            phone=m.phone,
            plan=m.plan,
            membership_end=str(m.membership_end) if m.membership_end else None,
            status=m.status,
            monthly_fee=m.monthly_fee,
        )
        for m in results
    ]

    return ExpiryReport(entries=entries, total=len(entries))


@router.get("/collection", response_model=CollectionReport)
def collection_report(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Monthly actual collection report for current gym."""
    _, _, month_start, month_end = _parse_month(month)

    total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Member, Payment.member_id == Member.id)
        .filter(
            Member.user_id == current_user.id,
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .scalar()
    )

    count = (
        db.query(func.count(Payment.id))
        .join(Member, Payment.member_id == Member.id)
        .filter(
            Member.user_id == current_user.id,
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .scalar() or 0
    )

    method_data = (
        db.query(Payment.payment_method, func.sum(Payment.amount))
        .join(Member, Payment.member_id == Member.id)
        .filter(
            Member.user_id == current_user.id,
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .group_by(Payment.payment_method)
        .all()
    )

    by_method = {m or "unknown": Decimal(str(a)) for m, a in method_data}

    return CollectionReport(
        month=month,
        total_collected=Decimal(str(total)),
        payment_count=count,
        by_method=by_method,
    )


@router.get("/dues")
def dues_report(
    month: Optional[str] = Query(None, description="Fee month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Members with outstanding dues in current gym."""
    today = date.today()
    if month is None:
        month = f"{today.year}-{today.month:02d}"

    _, _, month_start, month_end = _parse_month(month)

    members = (
        db.query(Member)
        .filter(
            Member.user_id == current_user.id,
            Member.status.in_(["active", "expired"]),
            Member.monthly_fee.isnot(None),
            Member.monthly_fee > 0,
        )
        .all()
    )

    dues_list = []
    for member in members:
        if not _member_overlaps_month(member, month_start, month_end):
            continue

        fee = member.monthly_fee or Decimal("0")
        paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.member_id == member.id,
                Payment.fee_month == month,
            )
            .scalar()
        )
        paid = Decimal(str(paid))
        outstanding = fee - paid

        if outstanding > 0:
            reminder = (
                f"Hi {member.name}, this is a friendly reminder from GYMHQ. "
                f"Your outstanding balance for {month} is ₹{outstanding:,.2f}. "
                f"Please clear your dues at your earliest convenience. Thank you!"
            )
            dues_list.append(DuesEntry(
                member_id=member.id,
                member_name=member.name,
                phone=member.phone,
                outstanding_amount=outstanding,
                membership_end=str(member.membership_end) if member.membership_end else None,
                status=member.status,
                reminder_message=reminder,
            ))

    dues_list.sort(key=lambda x: x.outstanding_amount, reverse=True)
    return {"month": month, "total_dues": sum(d.outstanding_amount for d in dues_list), "members": dues_list}


@router.get("/export/monthly-fees")
def export_monthly_fees_csv(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Export monthly fee report as CSV for current gym."""
    report = monthly_fee_report(month=month, db=db, current_user=current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Member ID", "Name", "Phone", "Plan", "Status",
                      "Monthly Fee", "Expected", "Paid", "Remaining", "Payment Status"])

    for d in report.member_details:
        writer.writerow([
            d.member_id, d.member_name, d.phone, d.plan or "", d.status,
            d.monthly_fee, d.expected_amount, d.paid_amount,
            d.remaining_balance, d.payment_status,
        ])

    writer.writerow([])
    writer.writerow(["Total Expected", report.expected_fees])
    writer.writerow(["Total Paid", report.total_paid])
    writer.writerow(["Outstanding Dues", report.outstanding_dues])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="fee_report_{month}.csv"'},
    )


@router.get("/export/attendance")
def export_attendance_csv(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Export attendance report as CSV for current gym."""
    report = attendance_report(date_from=date_from, date_to=date_to, db=db, current_user=current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Member ID", "Name", "Phone", "Date", "Checked In At"])

    for r in report.records:
        writer.writerow([r.member_id, r.member_name, r.phone, r.attendance_date, r.checked_in_at or ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="attendance_report.csv"'},
    )


@router.get("/export/collection")
def export_collection_csv(
    month: str = Query(..., description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user_optional),
):
    """Export collection report as CSV for current gym."""
    report = collection_report(month=month, db=db, current_user=current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Month", "Total Collected", "Payment Count"])
    writer.writerow([report.month, report.total_collected, report.payment_count])
    writer.writerow([])
    writer.writerow(["Payment Method", "Amount"])
    for method, amount in report.by_method.items():
        writer.writerow([method, amount])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="collection_{month}.csv"'},
    )
