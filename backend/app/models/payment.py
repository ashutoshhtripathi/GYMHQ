from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    """Payment model — matches existing payments table."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String, nullable=True)  # cash, upi, card, bank_transfer
    payment_date = Column(Date, nullable=False, index=True)
    fee_month = Column(String, nullable=True, index=True)  # e.g. "2026-10"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    member = relationship("Member", back_populates="payments")
