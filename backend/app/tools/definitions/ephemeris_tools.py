"""Tools 1-3: Core Ephemeris — planetary snapshot, sign/nakshatra, panchanga.

Each tool is registered as a ``ToolSpec`` + async handler function
in the central ``ToolRegistry``.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceChartResponse,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── shared helpers ──────────────────────────────────────────

PLANET_NAMES = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "rahu",
    "ketu",
]

ZODIAC_SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

NAKSHATRA_NAMES = [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati",
]

NAKSHATRA_LORDS = [
    "ketu",
    "venus",
    "sun",
    "moon",
    "mars",
    "rahu",
    "jupiter",
    "saturn",
    "mercury",
    "ketu",
    "venus",
    "sun",
    "moon",
    "mars",
    "rahu",
    "jupiter",
    "saturn",
    "mercury",
    "ketu",
    "venus",
    "sun",
    "moon",
    "mars",
    "rahu",
    "jupiter",
    "saturn",
    "mercury",
]

SIGN_LORDS: dict[str, str] = {
    "Aries": "mars",
    "Taurus": "venus",
    "Gemini": "mercury",
    "Cancer": "moon",
    "Leo": "sun",
    "Virgo": "mercury",
    "Libra": "venus",
    "Scorpio": "mars",
    "Sagittarius": "jupiter",
    "Capricorn": "saturn",
    "Aquarius": "saturn",
    "Pisces": "jupiter",
}


def _sidereal_longitude(tropical: float, ayanamsha: float) -> float:
    """Subtract ayanamsha from tropical longitude, normalise to 0–360."""
    return (tropical - ayanamsha) % 360.0


def _get_sign(longitude: float) -> str:
    return ZODIAC_SIGNS[int(longitude / 30) % 12]


def _get_sign_degree(longitude: float) -> float:
    return longitude % 30


def _get_nakshatra(longitude: float) -> tuple[str, int, str]:
    """Return (nakshatra_name, pada (1-4), lord)."""
    idx = int(longitude / 13.3333333) % 27
    pada = int((longitude % 13.3333333) / 3.3333333) + 1
    return NAKSHATRA_NAMES[idx], pada, NAKSHATRA_LORDS[idx]


def _get_nakshatra_pada(longitude: float) -> int:
    _, pada, _ = _get_nakshatra(longitude)
    return pada


# ── Panchanga calculation ──────────────────────────────────


TITHI_NAMES = [
    "Prathama",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashti",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
    "Prathama",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashti",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Amavasya",
]

KARANA_NAMES = [
    "Kimstughna",
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garija",
    "Vanija",
    "Visti",
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garija",
    "Vanija",
    "Visti",
    "Shakuni",
    "Chatushpada",
    "Naga",
    "Kimstughna",
]


def _calculate_panchanga(
    sun_longitude: float,
    moon_longitude: float,
    weekday: int,
) -> dict[str, Any]:
    """Calculate Panchanga (tithi, vara, nakshatra, yoga, karana).

    Args:
        sun_longitude: Sidereal longitude of Sun.
        moon_longitude: Sidereal longitude of Moon.
        weekday: Day of week (0=Sunday, 1=Monday, ...).

    Returns dict with keys tithi, vara, nakshatra, yoga, karana.
    """
    # Tithi
    theta = (moon_longitude - sun_longitude) % 360
    tithi_idx = int(theta / 12)
    tithi_name = TITHI_NAMES[tithi_idx]

    # Vara (weekday)
    vara_names_list = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]
    vara = vara_names_list[weekday % 7]

    # Nakshatra
    nakshatra_name, pada, _ = _get_nakshatra(moon_longitude)

    # Yoga
    yoga_val = (sun_longitude + moon_longitude) % 360
    yoga_idx = int(yoga_val / 13.3333333) % 27
    yoga_names_list = [
        "Vishkumbha",
        "Priti",
        "Ayushman",
        "Saubhagya",
        "Shobhana",
        "Atiganda",
        "Sukarma",
        "Dhriti",
        "Shula",
        "Ganda",
        "Vriddhi",
        "Dhruva",
        "Vyaghata",
        "Harshana",
        "Vajra",
        "Siddhi",
        "Vyatipata",
        "Variyana",
        "Parigha",
        "Shiva",
        "Siddha",
        "Sadhya",
        "Shubha",
        "Shukla",
        "Brahma",
        "Indra",
        "Vaidhriti",
    ]
    yoga = yoga_names_list[yoga_idx]

    # Karana
    karana_idx = int(theta / 6) % 11
    karana = KARANA_NAMES[karana_idx]

    return {
        "tithi": tithi_name,
        "vara": vara,
        "nakshatra": nakshatra_name,
        "nakshatra_pada": pada,
        "yoga": yoga,
        "karana": karana,
    }


# ──────────────────────────────────────────────────────────────
# Tool 1: get_planetary_snapshot
# ──────────────────────────────────────────────────────────────


class PlanetarySnapshotInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class PlanetInfo(BaseModel):
    name: str
    sign: str
    degree: float
    longitude: float
    nakshatra: str
    nakshatra_pada: int
    lord: str
    retrograde: bool
    house: int = 0


class AscendantInfo(BaseModel):
    sign: str
    degree: float
    longitude: float
    nakshatra: str
    nakshatra_pada: int = 0


class HouseInfo(BaseModel):
    house_number: int
    sign: str
    lord: str


class PlanetarySnapshotOutput(BaseModel):
    timestamp_utc: str
    ayanamsha: float
    planets: list[PlanetInfo]
    ascendant: AscendantInfo
    houses: list[HouseInfo]


def _chart_to_snapshot(chart: EphemerisServiceChartResponse) -> PlanetarySnapshotOutput:
    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
    asc_nakshatra, asc_pada, _ = _get_nakshatra(asc_sidereal)

    planets = []
    for p in chart.planets:
        sidereal_lon = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
        sign = _get_sign(sidereal_lon)
        nakshatra_name, pada, lord = _get_nakshatra(sidereal_lon)
        degree = _get_sign_degree(sidereal_lon)
        house = int(sidereal_lon / 30) + 1
        planets.append(
            PlanetInfo(
                name=p.body,
                sign=sign,
                degree=round(degree, 6),
                longitude=round(sidereal_lon, 6),
                nakshatra=nakshatra_name,
                nakshatra_pada=pada,
                lord=lord,
                retrograde=p.retrograde,
                house=house,
            )
        )

    houses = []
    if chart.houses.house_cusps_sidereal:
        for i, cusp in enumerate(chart.houses.house_cusps_sidereal):
            sign = _get_sign(cusp)
            lord = SIGN_LORDS.get(sign, "")
            houses.append(HouseInfo(house_number=i + 1, sign=sign, lord=lord))
    elif chart.houses.house_cusps_tropical:
        for i, cusp in enumerate(chart.houses.house_cusps_tropical):
            sidereal_cusp = _sidereal_longitude(cusp, chart.ayanamsha)
            sign = _get_sign(sidereal_cusp)
            lord = SIGN_LORDS.get(sign, "")
            houses.append(HouseInfo(house_number=i + 1, sign=sign, lord=lord))

    return PlanetarySnapshotOutput(
        timestamp_utc=chart.timestamp_utc,
        ayanamsha=chart.ayanamsha,
        planets=planets,
        ascendant=AscendantInfo(
            sign=_get_sign(asc_sidereal),
            degree=round(_get_sign_degree(asc_sidereal), 6),
            longitude=round(asc_sidereal, 6),
            nakshatra=asc_nakshatra,
            nakshatra_pada=asc_pada,
        ),
        houses=houses,
    )


async def tool_get_planetary_snapshot(
    input_data: PlanetarySnapshotInput,
) -> PlanetarySnapshotOutput:
    """Tool 1: Fetch and interpret a full planetary snapshot from ephemeris service."""
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
        return _chart_to_snapshot(chart)
    finally:
        await client.close()


PLANETARY_SNAPSHOT_SPEC = ToolSpec(
    name="get_planetary_snapshot",
    description="Fetch 9 planets + ascendant + houses for a given timestamp and location",
    input_schema=PlanetarySnapshotInput,
    output_schema=PlanetarySnapshotOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 2: get_sign_and_nakshatra
# ──────────────────────────────────────────────────────────────


class SignNakshatraInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class ZodiacDetail(BaseModel):
    sign: str
    degree: float
    longitude: float


class NakshatraDetail(BaseModel):
    name: str
    pada: int
    lord: str
    longitude: float


class SignNakshatraOutput(BaseModel):
    timestamp_utc: str
    ascendant: ZodiacDetail
    moon: NakshatraDetail
    planets: dict[str, ZodiacDetail]
    nakshatras: dict[str, NakshatraDetail]


async def tool_get_sign_and_nakshatra(
    input_data: SignNakshatraInput,
) -> SignNakshatraOutput:
    """Tool 2: Get zodiac sign, nakshatra, and nakshatra pada for every planet."""
    client = EphemerisClient()
    try:
        request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.latitude,
                longitude=input_data.longitude,
            ),
            timestamp_utc=input_data.timestamp_utc,
        )
        chart = await client.fetch_chart(request)
    finally:
        await client.close()

    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)

    planets: dict[str, ZodiacDetail] = {}
    nakshatras: dict[str, NakshatraDetail] = {}

    for p in chart.planets:
        sidereal_lon = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
        sign = _get_sign(sidereal_lon)
        degree = _get_sign_degree(sidereal_lon)
        n_name, n_pada, n_lord = _get_nakshatra(sidereal_lon)

        planets[p.body] = ZodiacDetail(
            sign=sign, degree=round(degree, 6), longitude=round(sidereal_lon, 6)
        )
        nakshatras[p.body] = NakshatraDetail(
            name=n_name, pada=n_pada, lord=n_lord, longitude=round(sidereal_lon, 6)
        )

    asc_nakshatra, asc_pada, asc_lord = _get_nakshatra(asc_sidereal)
    moon_nakshatra = nakshatras.get(
        "moon", NakshatraDetail(name="", pada=0, lord="", longitude=0)
    )

    return SignNakshatraOutput(
        timestamp_utc=chart.timestamp_utc,
        ascendant=ZodiacDetail(
            sign=_get_sign(asc_sidereal),
            degree=round(_get_sign_degree(asc_sidereal), 6),
            longitude=round(asc_sidereal, 6),
        ),
        moon=moon_nakshatra,
        planets=planets,
        nakshatras=nakshatras,
    )


SIGN_NAKSHATRA_SPEC = ToolSpec(
    name="get_sign_and_nakshatra",
    description="Get zodiac sign, nakshatra, and nakshatra pada for every planet and ascendant",
    input_schema=SignNakshatraInput,
    output_schema=SignNakshatraOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 3: get_panchanga
# ──────────────────────────────────────────────────────────────


class PanchangaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PanchangaOutput(BaseModel):
    timestamp_utc: str
    tithi: str
    vara: str
    nakshatra: str
    nakshatra_pada: int
    yoga: str
    karana: str


async def tool_get_panchanga(input_data: PanchangaInput) -> PanchangaOutput:
    """Tool 3: Calculate Panchanga (tithi, vara, nakshatra, yoga, karana)."""
    client = EphemerisClient()
    try:
        request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.latitude,
                longitude=input_data.longitude,
            ),
            timestamp_utc=input_data.timestamp_utc,
        )
        chart = await client.fetch_chart(request)
    finally:
        await client.close()

    sun_lon: float | None = None
    moon_lon: float | None = None
    for p in chart.planets:
        s_lon = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
        if p.body == "sun":
            sun_lon = s_lon
        elif p.body == "moon":
            moon_lon = s_lon

    if sun_lon is None or moon_lon is None:
        raise ValueError("Ephemeris response missing sun or moon position")

    # Determine weekday from timestamp_utc
    from datetime import datetime

    dt = datetime.fromisoformat(input_data.timestamp_utc.replace("Z", "+00:00"))
    weekday = dt.weekday()
    # Python weekday: Monday=0, Sunday=6.  Vedic: Sunday=0.
    weekday_vedic = (weekday + 1) % 7

    panchanga = _calculate_panchanga(sun_lon, moon_lon, weekday_vedic)

    return PanchangaOutput(
        timestamp_utc=chart.timestamp_utc,
        tithi=panchanga["tithi"],
        vara=panchanga["vara"],
        nakshatra=panchanga["nakshatra"],
        nakshatra_pada=panchanga["nakshatra_pada"],
        yoga=panchanga["yoga"],
        karana=panchanga["karana"],
    )


PANCHANGA_SPEC = ToolSpec(
    name="get_panchanga",
    description="Calculate Panchanga (tithi, vara, nakshatra, yoga, karana) for a given timestamp",
    input_schema=PanchangaInput,
    output_schema=PanchangaOutput,
    cache_ttl_seconds=300,
)
