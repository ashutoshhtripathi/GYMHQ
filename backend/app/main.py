from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    auth_router, members_router, attendance_router,
    payments_router, dashboard_router, reports_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables that don't exist yet (safe — does NOT drop existing tables)."""
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("✅ GYMHQ API started successfully")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    yield


app = FastAPI(
    title="GYMHQ — Gym Management API",
    description="Complete gym management SaaS backend for member, attendance, payment, and reporting operations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(members_router)
app.include_router(attendance_router)
app.include_router(payments_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check with database connectivity test."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "app": "GYMHQ",
        "version": "1.0.0",
    }
