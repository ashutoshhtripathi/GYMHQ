from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import date
from decimal import Decimal
from typing import Optional
from app.database import get_db
from app.models.payment import Payment
from app.models.member import Member
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentListResponse

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("", response_model=PaymentListResponse)
def list_payments(
    search: Optional[str] = Query(None, description="Search by member name or phone"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    fee_month: Optional[str] = Query(None, description="Filter by fee month"),
    member_id: Optional[int] = Query(None, description="Filter by member"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List payments with search and filters."""
    query = (
        db.query(Payment, Member.name, Member.phone)
        .join(Member, Payment.member_id == Member.id)
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Member.name.ilike(search_term),
                Member.phone.ilike(search_term),
            )
        )

    if payment_method:
        query = query.filter(Payment.payment_method == payment_method.lower())
    if date_from:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to:
        query = query.filter(Payment.payment_date <= date_to)
    if fee_month:
        query = query.filter(Payment.fee_month == fee_month)
    if member_id:
        query = query.filter(Payment.member_id == member_id)

    total = query.count()
    results = (
        query.order_by(Payment.payment_date.desc(), Payment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    payments = []
    for pmt, member_name, member_phone in results:
        payments.append(PaymentResponse(
            id=pmt.id,
            member_id=pmt.member_id,
            member_name=member_name,
            member_phone=member_phone,
            amount=pmt.amount,
            payment_method=pmt.payment_method,
            payment_date=pmt.payment_date,
            fee_month=pmt.fee_month,
            created_at=pmt.created_at,
        ))

    return PaymentListResponse(
        payments=payments,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    """Record a payment. Supports partial payments and multiple payments for the same fee month."""
    # Verify member exists
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Validate amount
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    payment = Payment(
        member_id=data.member_id,
        amount=data.amount,
        payment_method=data.payment_method,
        payment_date=data.payment_date,
        fee_month=data.fee_month,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return PaymentResponse(
        id=payment.id,
        member_id=payment.member_id,
        member_name=member.name,
        member_phone=member.phone,
        amount=payment.amount,
        payment_method=payment.payment_method,
        payment_date=payment.payment_date,
        fee_month=payment.fee_month,
        created_at=payment.created_at,
    )


@router.get("/collection")
def get_collection(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
):
    """
    Get actual money collected during a calendar month.
    
    This is based on payment_date (when money was received), NOT fee_month
    (which month the payment applies to). This distinction is critical.
    """
    if month is None:
        today = date.today()
        month = f"{today.year}-{today.month:02d}"

    # Parse month to get date range
    try:
        year, mon = map(int, month.split("-"))
        month_start = date(year, mon, 1)
        if mon == 12:
            month_end = date(year + 1, 1, 1)
        else:
            month_end = date(year, mon + 1, 1)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    # Sum all payments with payment_date in the selected calendar month
    total = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .scalar()
    )

    # Count payments
    count = (
        db.query(func.count(Payment.id))
        .filter(
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .scalar() or 0
    )

    # Breakdown by method
    method_breakdown = (
        db.query(Payment.payment_method, func.sum(Payment.amount))
        .filter(
            Payment.payment_date >= month_start,
            Payment.payment_date < month_end,
        )
        .group_by(Payment.payment_method)
        .all()
    )

    by_method = {method or "unknown": float(amount) for method, amount in method_breakdown}

    return {
        "month": month,
        "total_collected": float(total),
        "payment_count": count,
        "by_method": by_method,
    }


@router.get("/member/{member_id}", response_model=PaymentListResponse)
def member_payments(
    member_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get payment history for a specific member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    query = db.query(Payment).filter(Payment.member_id == member_id)
    total = query.count()
    results = (
        query.order_by(Payment.payment_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaymentListResponse(
        payments=[
            PaymentResponse(
                id=p.id,
                member_id=p.member_id,
                member_name=member.name,
                member_phone=member.phone,
                amount=p.amount,
                payment_method=p.payment_method,
                payment_date=p.payment_date,
                fee_month=p.fee_month,
                created_at=p.created_at,
            )
            for p in results
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
