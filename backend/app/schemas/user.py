from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional


class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = Field(None, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=150)
    gym_name: Optional[str] = Field("My Gym", max_length=100)
    gym_phone: Optional[str] = Field(None, max_length=30)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, hyphens, and underscores")
        return v.lower()


class UserLogin(BaseModel):
    """Schema for user login (accepts username or email)."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response (never includes password)."""
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gym_name: Optional[str] = "My Gym"
    gym_address: Optional[str] = None
    gym_phone: Optional[str] = None
    upi_id: Optional[str] = None
    role: str
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GymProfileUpdate(BaseModel):
    """Schema for updating gym profile details."""
    gym_name: Optional[str] = None
    gym_address: Optional[str] = None
    gym_phone: Optional[str] = None
    upi_id: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Schema for Google authentication."""
    credential: Optional[str] = None  # Google ID Token
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: Optional[str] = None


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PlatformUserItem(BaseModel):
    """Schema for platform owner user management view."""
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gym_name: Optional[str] = "My Gym"
    gym_address: Optional[str] = None
    gym_phone: Optional[str] = None
    upi_id: Optional[str] = None
    role: str = "admin"
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    members_count: int = 0
    total_collections: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class PlatformOverview(BaseModel):
    """Platform-wide aggregate statistics for the super admin."""
    total_gyms: int = 0
    active_gyms: int = 0
    suspended_gyms: int = 0
    total_platform_athletes: int = 0
    total_platform_collections: Decimal = Decimal("0")


class UserStatusUpdate(BaseModel):
    """Schema to activate or suspend access for a gym user."""
    is_active: bool
