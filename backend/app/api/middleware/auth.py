"""Auth middleware — optional Clerk JWT verification for every request.

In development/test mode all requests are allowed through with a
``test_user_001`` identity.  In production the middleware checks for a
valid ``Authorization: Bearer <token>`` header on every non-health path.
"""

from __future__ import annotations

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings

log = structlog.get_logger()

# Paths that do not require authentication
PUBLIC_PATHS = {
    "/health",
    "/health/ready",
    "/health/live",
    "/metrics",
    "/docs",
    "/openapi.json",
    "/redoc",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        settings = get_settings()

        # Skip auth for public paths and non-production environments
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        if not settings.is_production:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")

        if auth_header is None or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "unauthorized",
                        "detail": "Missing or invalid Authorization header",
                    }
                },
            )

        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "unauthorized",
                        "detail": "Empty token",
                    }
                },
            )

        # Token is verified by the ``get_current_user`` dependency in each
        # route — middleware only checks *presence* to return 401 early.
        return await call_next(request)
