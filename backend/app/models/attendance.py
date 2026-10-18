from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Attendance(Base):
    """Attendance model — matches existing attendance table with unique constraint."""
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint: one attendance record per member per day
    __table_args__ = (
        UniqueConstraint("member_id", "attendance_date", name="uq_member_attendance_date"),
    )

    # Relationships
    member = relationship("Member", back_populates="attendances")
