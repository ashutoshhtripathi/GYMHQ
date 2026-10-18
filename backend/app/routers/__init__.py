from app.routers.auth import router as auth_router
from app.routers.members import router as members_router
from app.routers.attendance import router as attendance_router
from app.routers.payments import router as payments_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "members_router",
    "attendance_router",
    "payments_router",
    "dashboard_router",
    "reports_router",
]
