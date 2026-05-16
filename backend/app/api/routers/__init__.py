from app.api.routers.admin import router as admin_router
from app.api.routers.candidate import router as candidate_router
from app.api.routers.health import router as health_router
from app.api.routers.rectify import router as rectify_router
from app.api.routers.sessions import router as sessions_router

__all__ = [
    "admin_router",
    "candidate_router",
    "health_router",
    "rectify_router",
    "sessions_router",
]
