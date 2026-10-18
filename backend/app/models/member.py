from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Member(Base):
    """Gym member model — matches existing members table schema."""
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    plan = Column(String, nullable=True)  # Duration label: Monthly, Quarterly, Annual, etc.
    status = Column(String, default="active", nullable=False, index=True)
    joining_date = Column(Date, nullable=True)
    membership_start = Column(Date, nullable=True)
    membership_end = Column(Date, nullable=True)
    monthly_fee = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attendances = relationship("Attendance", back_populates="member", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="member", cascade="all, delete-orphan")
