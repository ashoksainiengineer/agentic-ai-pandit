"""Sunrise computation endpoint."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from ephemeris.engine import get_engine
from ephemeris.models import EphemerisServiceSunriseRequest, EphemerisServiceSunriseResponse

router = APIRouter(tags=["sunrise"])


@router.post("/v1/sunrise", response_model=EphemerisServiceSunriseResponse)
async def sunrise(request: EphemerisServiceSunriseRequest) -> EphemerisServiceSunriseResponse:
    engine = get_engine()
    start_dt = datetime.fromisoformat(request.start_timestamp_utc.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(request.end_timestamp_utc.replace("Z", "+00:00"))

    sunrise_dt = engine.compute_sunrise(
        start_dt=start_dt,
        end_dt=end_dt,
        latitude=request.location.latitude,
        longitude=request.location.longitude,
    )

    return EphemerisServiceSunriseResponse(
        sunrise_timestamp_utc=sunrise_dt.isoformat() if sunrise_dt else None,
    )
