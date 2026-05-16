from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-pandit-agentic", "version": "0.1.0"}


@router.get("/health/ready")
async def health_ready() -> dict[str, str]:
    # TODO: Add readiness checks (DB ping, Redis ping, ephemeris ping)
    return {"status": "ready"}


@router.get("/health/live")
async def health_live() -> dict[str, str]:
    return {"status": "alive"}
