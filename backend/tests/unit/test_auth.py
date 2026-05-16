"""Tests for the Clerk JWT auth middleware.

The middleware only enforces auth in production; in dev/test all
requests pass through.  Token *verification* is done by route-level
dependencies — the middleware only checks token presence.
"""

from __future__ import annotations


class TestAuthConfig:
    def test_public_paths(self) -> None:
        from app.api.middleware.auth import PUBLIC_PATHS

        assert "/health" in PUBLIC_PATHS
        assert "/docs" in PUBLIC_PATHS
        assert "/metrics" in PUBLIC_PATHS
        assert "/openapi.json" in PUBLIC_PATHS
        assert "/redoc" in PUBLIC_PATHS

    def test_no_private_paths_in_public(self) -> None:
        from app.api.middleware.auth import PUBLIC_PATHS

        assert "/api/v1/sessions" not in PUBLIC_PATHS
        assert "/api/v1/rectify" not in PUBLIC_PATHS

    def test_health_endpoints_covered(self) -> None:
        from app.api.middleware.auth import PUBLIC_PATHS

        for path in ("/health", "/health/ready", "/health/live"):
            assert path in PUBLIC_PATHS
