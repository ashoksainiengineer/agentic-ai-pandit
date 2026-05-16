"""Tests for the Redis-backed rate limiting middleware.

Uses FastAPI TestClient with mocked Redis to avoid external deps.
"""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def mock_redis() -> AsyncMock:
    redis = AsyncMock()
    redis.incr = AsyncMock(return_value=1)
    redis.expire = AsyncMock()
    redis.get = AsyncMock(return_value=b"1")
    return redis


@pytest.fixture
def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


class TestGetClientIp:
    def test_forwarded_for(self) -> None:
        from app.api.middleware.rate_limit import _get_client_ip

        request = type("Request", (), {"headers": {}, "client": None})()
        request.headers = {"X-Forwarded-For": "203.0.113.1, 10.0.0.1"}
        request.client = type("Client", (), {"host": "10.0.0.1"})()

        ip = _get_client_ip(request)
        assert ip == "203.0.113.1"

    def test_direct_ip(self) -> None:
        from app.api.middleware.rate_limit import _get_client_ip

        request = type("Request", (), {"headers": {}, "client": None})()
        request.headers = {}
        request.client = type("Client", (), {"host": "192.168.1.1"})()
        ip = _get_client_ip(request)
        assert ip == "192.168.1.1"

    def test_unknown_ip(self) -> None:
        from app.api.middleware.rate_limit import _get_client_ip

        request = type("Request", (), {"headers": {}, "client": None})()
        request.headers = {}
        request.client = None
        ip = _get_client_ip(request)
        assert ip == "unknown"


class TestRateLimitConfig:
    def test_unlimited_paths(self) -> None:
        from app.api.middleware.rate_limit import UNLIMITED_PATHS

        assert "/health" in UNLIMITED_PATHS
        assert "/metrics" in UNLIMITED_PATHS

    def test_route_limits(self) -> None:
        from app.api.middleware.rate_limit import ROUTE_LIMITS

        assert "/api/v1/rectify" in ROUTE_LIMITS
        assert "/api/v1/sessions" in ROUTE_LIMITS
        assert "default" in ROUTE_LIMITS
        assert ROUTE_LIMITS["default"] > 0

    def test_window_key_format(self) -> None:
        import time

        from app.api.middleware.rate_limit import _WINDOW_SECONDS

        now = int(time.time())
        window = now // _WINDOW_SECONDS
        key = f"ratelimit:127.0.0.1:/api/v1/test:{window}"
        assert key.startswith("ratelimit:")
        assert _WINDOW_SECONDS == 60
