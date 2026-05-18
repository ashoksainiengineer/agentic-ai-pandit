"""Ephemeris microservice — FastAPI app serving Skyfield DE440 computations.

Run standalone::

    uvicorn ephemeris.main:app --host 0.0.0.0 --port 8001

Or via Docker Compose (see ``docker-compose.yml``).
"""

from __future__ import annotations

import structlog
from fastapi import FastAPI

from ephemeris.routers import health as health_router
from ephemeris.routers import positions as positions_router
from ephemeris.routers import sunrise as sunrise_router

log = structlog.get_logger()

app = FastAPI(
    title="AI-Pandit Ephemeris Service",
    description="JPL DE440 planetary positions via Skyfield — for BTR astrological computations",
    version="0.1.0",
    docs_url="/docs",
)

app.include_router(health_router.router)
app.include_router(positions_router.router)
app.include_router(sunrise_router.router)


@app.on_event("startup")
async def warm_engine() -> None:
    from ephemeris.engine import get_engine

    engine = get_engine()
    _ = engine.health()
    log.info("ephemeris_service_started")
