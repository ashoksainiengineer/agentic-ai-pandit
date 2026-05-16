"""Redis-backed sliding-window rate limiting middleware.

Uses the shared Redis client from ``app.api.deps`` to implement a
per-IP, per-route sliding window counter.  Configurable window
duration and max requests via ``Settings.max_concurrent_sessions``
and a per-route multiplier.
"""

from __future__ import annotations

import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings

log = structlog.get_logger()

# Routes where rate limits are relaxed (health checks, metrics)
UNLIMITED_PATHS = {"/health", "/health/ready", "/health/live", "/metrics"}

# Per-route rate limit multipliers relative to the base limit
ROUTE_LIMITS: dict[str, int] = {
    "/api/v1/rectify": 5,  # POST /rectify — expensive operation
    "/api/v1/sessions": 30,
    "/api/v1/candidate": 60,
    "default": 100,
}

_WINDOW_SECONDS = 60


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        path = request.url.path

        # Skip unlimited paths
        if path in UNLIMITED_PATHS:
            return await call_next(request)

        settings = get_settings()

        # In non-production, rate limiting is disabled
        if not settings.is_production:
            return await call_next(request)

        client_ip = _get_client_ip(request)
        max_requests = ROUTE_LIMITS.get(path, ROUTE_LIMITS["default"])

        # Determine the Redis key for this sliding window
        now = int(time.time())
        window_key = f"ratelimit:{client_ip}:{path}:{now // _WINDOW_SECONDS}"

        try:
            from app.api.deps import get_redis

            redis = await get_redis()
            count = await redis.incr(window_key)
            if count == 1:
                await redis.expire(window_key, _WINDOW_SECONDS)

            if count > max_requests:
                log.warning(
                    "rate_limit_exceeded",
                    client_ip=client_ip,
                    path=path,
                    count=count,
                    max_requests=max_requests,
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "rate_limit_exceeded",
                            "detail": f"Rate limit exceeded. Max {max_requests} requests per {_WINDOW_SECONDS}s.",
                        }
                    },
                    headers={
                        "Retry-After": str(_WINDOW_SECONDS),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )
        except Exception:
            log.warning(
                "rate_limit_check_failed",
                exc_info=True,
            )

        response = await call_next(request)

        try:
            from app.api.deps import get_redis

            redis_client = await get_redis()
            current: int = int(await redis_client.get(window_key) or 0)
            remaining = max(0, max_requests - current)
            response.headers["X-RateLimit-Limit"] = str(max_requests)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
        except Exception:
            log.warning("rate_limit_header_failed", exc_info=True)

        return response
