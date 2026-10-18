from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Member(Base):
    """Gym member model — isolated per gym owner (user_id)."""
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    plan = Column(String, nullable=True)  # Duration label: Monthly, Quarterly, Annual, etc.
    status = Column(String, default="active", nullable=False, index=True)
    joining_date = Column(Date, nullable=True)
    membership_start = Column(Date, nullable=True)
    membership_end = Column(Date, nullable=True)
    monthly_fee = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "phone", name="uq_members_user_phone"),
    )

    # Relationships
    user = relationship("User", back_populates="members")
    attendances = relationship("Attendance", back_populates="member", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="member", cascade="all, delete-orphan")
