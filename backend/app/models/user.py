from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Numeric, Text, func
from app.database import Base


class User(Base):
    """Application user for authentication, multi-tenancy, and SaaS subscription control."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    gym_name = Column(String, default="My Gym", nullable=True)
    gym_address = Column(String, nullable=True)
    gym_phone = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)
    role = Column(String, default="admin", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Platform SaaS Billing & Access Control Fields
    subscription_fee = Column(Numeric(10, 2), default=999.00, nullable=True)
    subscription_plan = Column(String, default="Standard Monthly", nullable=True)
    subscription_status = Column(String, default="active", nullable=False)  # active, expiring_soon, overdue, suspended
    subscription_start = Column(Date, nullable=True)
    subscription_end = Column(Date, nullable=True)
    admin_notes = Column(Text, nullable=True)
