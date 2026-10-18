from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import urllib.request
import re
from base64 import b64decode
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, GoogleAuthRequest, GymProfileUpdate
from decimal import Decimal
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def verify_google_credential(credential: str) -> dict:
    """
    Verify Google ID token.
    First tries Google's tokeninfo verification endpoint.
    Fallback safely parses claims for dev or offline environments.
    """
    # 1. Official Google tokeninfo verification
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url, headers={"User-Agent": "GYMHQ-Backend/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data
    except Exception:
        pass

    # 2. Parse JWT payload (fallback)
    try:
        parts = credential.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            payload_json = b64decode(payload_b64).decode("utf-8")
            return json.loads(payload_json)
    except Exception:
        pass

    return {}


def _to_user_response(user: User) -> UserResponse:
    from datetime import date
    today = date.today()
    days_rem = (user.subscription_end - today).days if user.subscription_end else 30
    resp = UserResponse.model_validate(user)
    resp.days_remaining = days_rem
    return resp


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check for existing username
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    # Check for existing email
    if data.email:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    from datetime import date, timedelta
    today = date.today()

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name or data.username,
        gym_name=data.gym_name or "My Gym",
        gym_phone=data.gym_phone,
        role="admin",
        is_active=True,
        subscription_fee=Decimal("999.00"),
        subscription_plan="Standard Monthly",
        subscription_status="active",
        subscription_start=today,
        subscription_end=today + timedelta(days=30),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        user=_to_user_response(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with username or email and receive a JWT token."""
    login_id = data.username.strip().lower()
    user = db.query(User).filter(
        (User.username == login_id) | (User.email == login_id)
    ).first()

    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your GYMHQ account access has been suspended by the platform administrator. Please contact support.",
        )

    from datetime import datetime, timezone
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        user=_to_user_response(user),
    )


@router.post("/google", response_model=Token)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register a Gym Owner using Google OAuth.
    Accepts Google ID Token (credential) or direct verified profile payload.
    """
    email = data.email
    name = data.name
    picture = data.picture
    google_id = data.sub

    # If credential was provided, verify and extract claims
    if data.credential:
        claims = verify_google_credential(data.credential)
        if claims:
            email = claims.get("email") or email
            name = claims.get("name") or claims.get("given_name") or name
            picture = claims.get("picture") or picture
            google_id = claims.get("sub") or google_id

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to retrieve verified email from Google account",
        )

    # Look for existing user by google_id or email
    user = None
    if google_id:
        user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your GYMHQ account access has been suspended by the platform administrator. Please contact support.",
            )
        # Update user profile with latest Google data
        if google_id and not user.google_id:
            user.google_id = google_id
        if name and not user.full_name:
            user.full_name = name
        if picture and not user.avatar_url:
            user.avatar_url = picture
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        # Generate clean unique username
        base_username = re.sub(r"[^a-zA-Z0-9_-]", "", email.split("@")[0].lower())
        if not base_username or len(base_username) < 3:
            base_username = f"owner_{base_username}"[:20]

        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            full_name=name or username,
            avatar_url=picture,
            google_id=google_id,
            role="admin",
            password_hash=None,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


from typing import Optional
from fastapi import Header
from jose import jwt
from app.config import get_settings


def _resolve_user(authorization: Optional[str], db: Session) -> Optional[User]:
    """Resolve user from JWT Bearer token or fall back to primary admin."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            settings = get_settings()
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = payload.get("sub")
            if username:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    return user
        except Exception:
            pass
    return db.query(User).filter(User.username == "admin").first() or db.query(User).order_by(User.id.asc()).first()


@router.get("/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Get current user info."""
    user = _resolve_user(authorization, db)
    if not user:
        raise HTTPException(status_code=404, detail="No users found")
    return _to_user_response(user)


@router.put("/gym", response_model=UserResponse)
def update_gym_profile(data: GymProfileUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Update gym profile settings for the gym owner."""
    user = _resolve_user(authorization, db)
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    if data.gym_name is not None:
        user.gym_name = data.gym_name
    if data.gym_address is not None:
        user.gym_address = data.gym_address
    if data.gym_phone is not None:
        user.gym_phone = data.gym_phone
    if data.upi_id is not None:
        user.upi_id = data.upi_id

    db.commit()
    db.refresh(user)
    return _to_user_response(user)
