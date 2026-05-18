"""Health check endpoint for the ephemeris service."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter

from ephemeris.engine import get_engine
from ephemeris.models import EphemerisServiceHealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=EphemerisServiceHealthResponse)
async def health() -> EphemerisServiceHealthResponse:
    engine = get_engine()
    info = engine.health()
    return EphemerisServiceHealthResponse(
        service=info["service"],
        status=info["status"],
        ready=info["ready"],
        kernel_loaded=info["kernel_loaded"],
        kernel_file=info["kernel_file"],
        timestamp=datetime.now(UTC).isoformat(),
        version="0.1.0",
    )
