from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class User(Base):
    """Application user for authentication."""
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
