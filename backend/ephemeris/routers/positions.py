"""Planetary position endpoints — single and batch chart computation."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from ephemeris.engine import get_engine
from ephemeris.models import (
    EphemerisServiceBatchRequest,
    EphemerisServiceBatchResponse,
    EphemerisServiceChartResponse,
    EphemerisServiceHouses,
    EphemerisServicePlanetPosition,
)

router = APIRouter(prefix="/v1", tags=["positions"])


def _compute_chart(
    timestamp_utc: str,
    latitude: float,
    longitude: float,
    ayanamsha_mode: str = "lahiri",
    house_system: str = "placidus",
) -> EphemerisServiceChartResponse:
    engine = get_engine()
    dt = datetime.fromisoformat(timestamp_utc.replace("Z", "+00:00"))

    planets_raw = engine.planetary_positions(dt)
    houses_raw = engine.compute_houses(dt, latitude, longitude, house_system)
    ayanamsha = engine.compute_ayanamsha(dt)
    jd_ut, jd_tt = engine.julian_dates(dt)

    planets = []
    for name in ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu"]:
        if name in planets_raw:
            p = planets_raw[name]
            sidereal_lon = (p["tropical_longitude"] - ayanamsha) % 360
            planets.append(EphemerisServicePlanetPosition(
                body=p["body"],
                tropical_longitude=p["tropical_longitude"],
                tropical_latitude=p["tropical_latitude"],
                sidereal_longitude=round(sidereal_lon, 10),
                distance_au=p["distance_au"],
                longitude_speed=p["longitude_speed"],
                latitude_speed=p["latitude_speed"],
                retrograde=p["retrograde"],
                magnitude=p["magnitude"],
            ))

    # Sidereal houses
    asc_sidereal = (houses_raw["ascendant_tropical"] - ayanamsha) % 360
    cusps_sidereal = [(c - ayanamsha) % 360 for c in houses_raw["house_cusps_tropical"]]

    houses = EphemerisServiceHouses(
        ascendant_tropical=houses_raw["ascendant_tropical"],
        mc_tropical=houses_raw["mc_tropical"],
        house_cusps_tropical=houses_raw["house_cusps_tropical"],
        ascendant_sidereal=round(asc_sidereal, 10),
        house_cusps_sidereal=[round(c, 10) for c in cusps_sidereal],
    )

    return EphemerisServiceChartResponse(
        timestamp_utc=timestamp_utc,
        julian_day_ut=round(jd_ut, 6),
        julian_day_tt=round(jd_tt, 6),
        ayanamsha=ayanamsha,
        planets=planets,
        houses=houses,
    )


@router.post("/v1/positions/batch", response_model=EphemerisServiceBatchResponse)
async def batch_positions(request: EphemerisServiceBatchRequest) -> EphemerisServiceBatchResponse:
    if not request.timestamps_utc:
        raise HTTPException(status_code=400, detail="timestamps_utc must not be empty")
    if len(request.timestamps_utc) > 500:
        raise HTTPException(status_code=400, detail="max 500 timestamps per request")

    charts = []
    for ts in request.timestamps_utc:
        chart = _compute_chart(
            timestamp_utc=ts,
            latitude=request.location.latitude,
            longitude=request.location.longitude,
            ayanamsha_mode=request.ayanamsha_mode,
            house_system=request.house_system,
        )
        charts.append(chart)

    return EphemerisServiceBatchResponse(charts=charts)


# Also mount at the exact path the client expects
@router.post("/positions/batch", response_model=EphemerisServiceBatchResponse, include_in_schema=False)
async def batch_positions_alt(request: EphemerisServiceBatchRequest) -> EphemerisServiceBatchResponse:
    return await batch_positions(request)
