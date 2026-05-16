"""Tool 13: Special Points — Arudha Lagna, Hora Lagna, Ghati Lagna,
Bhrigu Bindu, Kunda Lagna.

Registered as a ``ToolSpec`` + async handler in the central
``ToolRegistry``.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.definitions.ephemeris_tools import (
    SIGN_LORDS,
    ZODIAC_SIGNS,
    _get_nakshatra,
    _get_sign,
    _get_sign_degree,
    _sidereal_longitude,
)
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── shared helpers ──────────────────────────────────────────


def _sign_index(sign: str) -> int:
    return ZODIAC_SIGNS.index(sign)


def _calculate_arudha_lagna(
    lagna_longitude: float,
    planet_positions: dict[str, float],
) -> float:
    """Calculate Arudha Lagna (AL) from sidereal lagna and planet positions."""
    lagna_sign_idx = int(lagna_longitude / 30) % 12
    lagna_sign = ZODIAC_SIGNS[lagna_sign_idx]
    lagna_lord = SIGN_LORDS[lagna_sign]
    lord_lon = planet_positions.get(lagna_lord, 0.0)
    lord_sign_idx = int(lord_lon / 30) % 12

    offset = (lord_sign_idx - lagna_sign_idx) % 12
    al_sign_idx = (lord_sign_idx + offset) % 12

    # Exception: if AL falls in Lagna or 7th, move to next trine
    if al_sign_idx == lagna_sign_idx or al_sign_idx == (lagna_sign_idx + 6) % 12:
        al_sign_idx = (al_sign_idx + 4) % 12

    return al_sign_idx * 30 + (lagna_longitude % 30)


def _calculate_hora_lagna(lagna_longitude: float, hours_since_sunrise: float) -> float:
    return (lagna_longitude + hours_since_sunrise * 15.0) % 360.0


def _calculate_ghati_lagna(lagna_longitude: float, minutes_since_sunrise: float) -> float:
    return (lagna_longitude + minutes_since_sunrise * 1.25) % 360.0


def _calculate_bhrigu_bindu(moon_longitude: float, rahu_longitude: float) -> float:
    return ((moon_longitude + rahu_longitude) / 2.0) % 360.0


def _calculate_kunda_lagna(hora_lagna_longitude: float) -> float:
    hl_sign_idx = int(hora_lagna_longitude / 30) % 12
    kl_sign_idx = (hl_sign_idx + 3) % 12
    return kl_sign_idx * 30 + (hora_lagna_longitude % 30)


def _approximate_sunrise_utc(birth_dt: datetime, longitude: float) -> datetime:
    sunrise_local = datetime(birth_dt.year, birth_dt.month, birth_dt.day, 6, 0, 0)
    longitude_hours = longitude / 15.0
    sunrise_utc = sunrise_local - timedelta(hours=longitude_hours)
    if birth_dt < sunrise_utc:
        sunrise_utc -= timedelta(days=1)
    return sunrise_utc


# ──────────────────────────────────────────────────────────────
# Tool 13: get_special_points
# ──────────────────────────────────────────────────────────────


class SpecialPointsInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class SpecialPointOut(BaseModel):
    name: str
    sign: str
    degree: float
    longitude: float
    nakshatra: str
    nakshatra_pada: int


class SpecialPointsOutput(BaseModel):
    timestamp_utc: str
    special_points: list[SpecialPointOut]


async def tool_get_special_points(input_data: SpecialPointsInput) -> SpecialPointsOutput:
    client = EphemerisClient()
    try:
        request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.latitude,
                longitude=input_data.longitude,
            ),
            ayanamsha_mode=input_data.ayanamsha_mode,
            house_system=input_data.house_system,
            timestamp_utc=input_data.timestamp_utc,
        )
        chart = await client.fetch_chart(request)
    finally:
        await client.close()

    asc_sidereal = _sidereal_longitude(
        chart.houses.ascendant_tropical, chart.ayanamsha
    )
    planet_positions: dict[str, float] = {}
    for p in chart.planets:
        planet_positions[p.body] = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)

    moon_lon = planet_positions.get("moon", 0.0)
    rahu_lon = planet_positions.get("rahu", 0.0)

    birth_dt = datetime.fromisoformat(
        input_data.timestamp_utc.replace("Z", "+00:00")
    ).replace(tzinfo=None)
    sunrise_utc = _approximate_sunrise_utc(birth_dt, input_data.longitude)
    hours_since_sunrise = (birth_dt - sunrise_utc).total_seconds() / 3600.0
    minutes_since_sunrise = hours_since_sunrise * 60.0

    al_lon = _calculate_arudha_lagna(asc_sidereal, planet_positions)
    hl_lon = _calculate_hora_lagna(asc_sidereal, hours_since_sunrise)
    gl_lon = _calculate_ghati_lagna(asc_sidereal, minutes_since_sunrise)
    bb_lon = _calculate_bhrigu_bindu(moon_lon, rahu_lon)
    kl_lon = _calculate_kunda_lagna(hl_lon)

    points: list[SpecialPointOut] = []
    for name, lon in [
        ("Arudha Lagna", al_lon),
        ("Hora Lagna", hl_lon),
        ("Ghati Lagna", gl_lon),
        ("Bhrigu Bindu", bb_lon),
        ("Kunda Lagna", kl_lon),
    ]:
        sign = _get_sign(lon)
        degree = _get_sign_degree(lon)
        nak, pada, _ = _get_nakshatra(lon)
        points.append(
            SpecialPointOut(
                name=name,
                sign=sign,
                degree=round(degree, 6),
                longitude=round(lon, 6),
                nakshatra=nak,
                nakshatra_pada=pada,
            )
        )

    return SpecialPointsOutput(
        timestamp_utc=chart.timestamp_utc,
        special_points=points,
    )


SPECIAL_POINTS_SPEC = ToolSpec(
    name="get_special_points",
    description="Calculate BTR-specific sensitive points: Arudha Lagna, Hora Lagna, Ghati Lagna, Bhrigu Bindu, Kunda Lagna",
    input_schema=SpecialPointsInput,
    output_schema=SpecialPointsOutput,
    cache_ttl_seconds=300,
)
