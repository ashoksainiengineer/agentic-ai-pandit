"""Tools 4-6: Dasha Systems — Vimshottari, Yogini, Kalachakra.

Each tool is registered as a ``ToolSpec`` + async handler in the
central ``ToolRegistry``.  All three depend on the EphemerisClient
for Moon longitude at birth then run pure-Python date arithmetic.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.definitions.ephemeris_tools import _get_nakshatra, _sidereal_longitude
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── Constants (ported from vedic-astrology-engine.ts) ─────

DASHA_YEARS: dict[str, float] = {
    "Ketu": 7,
    "Venus": 20,
    "Sun": 6,
    "Moon": 10,
    "Mars": 7,
    "Rahu": 18,
    "Jupiter": 16,
    "Saturn": 19,
    "Mercury": 17,
}

TOTAL_DASHA_YEARS: float = 120.0

NAKSHATRA_LORDS: list[str] = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
]

DASHA_SEQUENCE: list[str] = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
]

NAKSHATRA_SPAN = 360.0 / 27.0
DAYS_PER_YEAR = 365.25

# ── Yogini Dasha constants ───────────────────────────────

YOGINI_SEQUENCE: list[dict[str, Any]] = [
    {"name": "Mangala", "planet": "Moon", "years": 1},
    {"name": "Pingala", "planet": "Sun", "years": 2},
    {"name": "Dhanya", "planet": "Jupiter", "years": 3},
    {"name": "Bhramari", "planet": "Mars", "years": 4},
    {"name": "Bhadrika", "planet": "Mercury", "years": 5},
    {"name": "Ulka", "planet": "Saturn", "years": 6},
    {"name": "Siddha", "planet": "Venus", "years": 7},
    {"name": "Sankata", "planet": "Rahu", "years": 8},
]

NAKSHATRA_TO_YOGINI: dict[int, int] = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 6,
    15: 7,
    16: 0,
    17: 1,
    18: 2,
    19: 3,
    20: 4,
    21: 5,
    22: 6,
    23: 7,
    24: 0,
    25: 1,
    26: 2,
}

# ── Kalachakra Dasha constants ───────────────────────────

ZODIAC_SIGNS_KC: list[str] = [
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

SIGN_LORDS_KC: dict[str, str] = {
    "Aries": "Mars",
    "Taurus": "Venus",
    "Gemini": "Mercury",
    "Cancer": "Moon",
    "Leo": "Sun",
    "Virgo": "Mercury",
    "Libra": "Venus",
    "Scorpio": "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn",
    "Aquarius": "Saturn",
    "Pisces": "Jupiter",
}

KALACHAKRA_GROUPS: list[dict[str, Any]] = [
    {"name": "Ashvini", "nakshatras": [0, 9, 18], "type": "Savya", "startSignIdx": 0},
    {
        "name": "Bharani",
        "nakshatras": [1, 10, 19],
        "type": "Apisavya",
        "startSignIdx": 11,
    },
    {"name": "Krittika", "nakshatras": [2, 11, 20], "type": "Savya", "startSignIdx": 3},
    {
        "name": "Rohini",
        "nakshatras": [3, 12, 21],
        "type": "Apisavya",
        "startSignIdx": 8,
    },
    {
        "name": "Mrigashira",
        "nakshatras": [4, 13, 22],
        "type": "Savya",
        "startSignIdx": 1,
    },
    {"name": "Ardra", "nakshatras": [5, 14, 23], "type": "Apisavya", "startSignIdx": 6},
    {
        "name": "Punarvasu",
        "nakshatras": [6, 15, 24],
        "type": "Savya",
        "startSignIdx": 5,
    },
    {
        "name": "Pushya",
        "nakshatras": [7, 16, 25],
        "type": "Apisavya",
        "startSignIdx": 10,
    },
    {"name": "Ashlesha", "nakshatras": [8, 17, 26], "type": "Mixed", "startSignIdx": 7},
]

KALACHAKRA_DURATIONS: dict[str, list[float]] = {
    "Savya": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    "Apisavya": [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
    "Mixed": [12, 13, 14, 15, 16, 17, 18, 7, 8, 9, 10, 11],
}


# ── Helpers ──────────────────────────────────────────────


def _add_years(dt: datetime, years: float) -> datetime:
    """Add *years* (floating-point) to *dt*."""
    total_seconds = years * DAYS_PER_YEAR * 24 * 3600
    return dt + timedelta(seconds=total_seconds)


def _get_moon_longitude_from_chart(
    chart: Any,
) -> float:
    """Extract sidereal Moon longitude from an ephemeris chart response."""
    for p in chart.planets:
        if p.body == "moon":
            return _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
    msg = "Ephemeris response missing Moon position"
    raise ValueError(msg)


def _snake_to_camel(s: str) -> str:
    """Convert snake_case to camelCase for API output consistency."""
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


# ──────────────────────────────────────────────────────────────
# Tool 4: get_vimshottari_dasha
# ──────────────────────────────────────────────────────────────


@dataclass
class _DashaPeriod:
    """Internal node in the recursive dasha tree."""

    lord: str
    start_date: datetime
    end_date: datetime
    duration_years: float
    sub_periods: list[_DashaPeriod]


class VimshottariDashaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp (birth time)")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    max_levels: int = Field(
        default=3,
        ge=2,
        le=5,
        description="Dasha depth (2=Antar, 3=Pratyantar, 4=Sukshma, 5=Prana)",
    )


class DashaEntryOut(BaseModel):
    maha: str
    antar: str = "-"
    pratyantar: str = "-"
    sukshma: str = "-"
    prana: str = "-"
    start_end: str = ""


class VimshottariDashaOutput(BaseModel):
    moon_nakshatra: str
    birth_lord: str
    balance_years: float
    periods: list[DashaEntryOut]


def _calculate_sub_dashas(
    parent_lord: str,
    full_start: datetime,
    full_end: datetime,
    max_level: int,
    clip_start: datetime,
    clip_end: datetime,
    current_level: int = 2,
) -> list[_DashaPeriod]:
    """Recursively compute sub-periods (antar→pratyantar→sukshma→prana)."""
    if current_level > max_level:
        return []

    total_duration_ms = (full_end - full_start).total_seconds() * 1000
    sub_periods: list[_DashaPeriod] = []
    current_sub_start = full_start
    start_idx = DASHA_SEQUENCE.index(parent_lord)

    for i in range(9):
        lord = DASHA_SEQUENCE[(start_idx + i) % 9]
        proportion = DASHA_YEARS[lord] / TOTAL_DASHA_YEARS
        sub_duration_ms = total_duration_ms * proportion
        current_sub_end = current_sub_start + timedelta(milliseconds=sub_duration_ms)

        if current_sub_start < clip_end and current_sub_end > clip_start:
            eff_start = max(current_sub_start, clip_start)
            eff_end = min(current_sub_end, clip_end)
            duration_y = (eff_end - eff_start).total_seconds() / (
                DAYS_PER_YEAR * 24 * 3600
            )

            sub_periods.append(
                _DashaPeriod(
                    lord=lord,
                    start_date=eff_start,
                    end_date=eff_end,
                    duration_years=duration_y,
                    sub_periods=_calculate_sub_dashas(
                        lord,
                        current_sub_start,
                        current_sub_end,
                        max_level,
                        eff_start,
                        eff_end,
                        current_level + 1,
                    ),
                )
            )

        current_sub_start = current_sub_end

    return sub_periods


def _flatten_dasha(
    periods: list[_DashaPeriod],
    maha_lord: str | None = None,
    antar_lord: str | None = None,
    pratyantar_lord: str | None = None,
    level: int = 1,
) -> list[DashaEntryOut]:
    """Flatten the recursive dasha tree into flat output entries."""
    result: list[DashaEntryOut] = []

    for period in periods:
        if level == 1:
            for sub in period.sub_periods:
                result.extend(
                    _flatten_dasha(
                        [sub],
                        maha_lord=period.lord,
                        antar_lord=sub.lord,
                        level=2,
                    )
                )
        elif level == 2:
            if period.sub_periods:
                for sub in period.sub_periods:
                    result.extend(
                        _flatten_dasha(
                            [sub],
                            maha_lord=maha_lord,
                            antar_lord=period.lord,
                            pratyantar_lord=sub.lord,
                            level=3,
                        )
                    )
            else:
                result.append(
                    DashaEntryOut(
                        maha=maha_lord or "",
                        antar=period.lord,
                        pratyantar="-",
                        sukshma="-",
                        prana="-",
                        start_end=_format_date_range(
                            period.start_date, period.end_date
                        ),
                    )
                )
        elif level == 3:
            if period.sub_periods:
                for sub in period.sub_periods:
                    result.extend(
                        _flatten_dasha(
                            [sub],
                            maha_lord=maha_lord,
                            antar_lord=antar_lord,
                            pratyantar_lord=period.lord,
                            level=4,
                        )
                    )
            else:
                result.append(
                    DashaEntryOut(
                        maha=maha_lord or "",
                        antar=antar_lord or "",
                        pratyantar=period.lord,
                        sukshma="-",
                        prana="-",
                        start_end=_format_date_range(
                            period.start_date, period.end_date
                        ),
                    )
                )
        elif level == 4:
            if period.sub_periods:
                for sub in period.sub_periods:
                    result.append(
                        DashaEntryOut(
                            maha=maha_lord or "",
                            antar=antar_lord or "",
                            pratyantar=pratyantar_lord or "",
                            sukshma=period.lord,
                            prana=sub.lord,
                            start_end=_format_date_range(sub.start_date, sub.end_date),
                        )
                    )
            else:
                result.append(
                    DashaEntryOut(
                        maha=maha_lord or "",
                        antar=antar_lord or "",
                        pratyantar=pratyantar_lord or "",
                        sukshma=period.lord,
                        prana="-",
                        start_end=_format_date_range(
                            period.start_date, period.end_date
                        ),
                    )
                )

    return result


def _format_date_range(start: datetime, end: datetime) -> str:
    return f"{start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}"


def _calculate_vimshottari(
    moon_longitude: float,
    birth_date: datetime,
    max_level: int,
) -> tuple[str, str, float, list[DashaEntryOut]]:
    """Core Vimshottari algorithm: balance + periods + sub-periods."""
    moon_long = moon_longitude % 360
    nakshatra_idx = int(moon_long / NAKSHATRA_SPAN)
    birth_lord = NAKSHATRA_LORDS[nakshatra_idx % 27]
    pos_in_nak = (moon_long % NAKSHATRA_SPAN) / NAKSHATRA_SPAN
    birth_dasha_years = DASHA_YEARS[birth_lord]
    elapsed_years = pos_in_nak * birth_dasha_years
    remaining_years = birth_dasha_years - elapsed_years

    # Get nakshatra name for output
    nakshatra_name, _, _ = _get_nakshatra(moon_long)

    periods: list[_DashaPeriod] = []
    current_date = birth_date
    dasha_idx = DASHA_SEQUENCE.index(birth_lord)

    full_start = _add_years(current_date, -elapsed_years)
    first_end = _add_years(current_date, remaining_years)
    full_end = _add_years(full_start, birth_dasha_years)

    periods.append(
        _DashaPeriod(
            lord=birth_lord,
            start_date=current_date,
            end_date=first_end,
            duration_years=remaining_years,
            sub_periods=_calculate_sub_dashas(
                birth_lord,
                full_start,
                full_end,
                max_level,
                current_date,
                first_end,
            ),
        )
    )
    current_date = first_end
    dasha_idx = (dasha_idx + 1) % 9

    for _ in range(9):
        lord = DASHA_SEQUENCE[dasha_idx]
        if lord == birth_lord:
            dasha_idx = (dasha_idx + 1) % 9
            continue
        years = DASHA_YEARS[lord]
        end_date = _add_years(current_date, years)
        periods.append(
            _DashaPeriod(
                lord=lord,
                start_date=current_date,
                end_date=end_date,
                duration_years=years,
                sub_periods=_calculate_sub_dashas(
                    lord,
                    current_date,
                    end_date,
                    max_level,
                    current_date,
                    end_date,
                ),
            )
        )
        current_date = end_date
        dasha_idx = (dasha_idx + 1) % 9

    flat = _flatten_dasha(periods)
    return nakshatra_name, birth_lord, remaining_years, flat


async def tool_get_vimshottari_dasha(
    input_data: VimshottariDashaInput,
) -> VimshottariDashaOutput:
    """Tool 4: Calculate Vimshottari Dasha (Maha→Antar→Pratyantar→Sukshma→Prana)."""
    birth_date = datetime.fromisoformat(input_data.timestamp_utc.replace("Z", "+00:00"))

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

    moon_lon = _get_moon_longitude_from_chart(chart)
    nak_name, birth_lord, balance, flat = _calculate_vimshottari(
        moon_lon,
        birth_date,
        input_data.max_levels,
    )

    return VimshottariDashaOutput(
        moon_nakshatra=nak_name,
        birth_lord=birth_lord,
        balance_years=round(balance, 4),
        periods=flat,
    )


VIMSHOTTARI_DASHA_SPEC = ToolSpec(
    name="get_vimshottari_dasha",
    description="Vimshottari Mahadasha with recursive sub-periods (up to 5 levels)",
    input_schema=VimshottariDashaInput,
    output_schema=VimshottariDashaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 5: get_yogini_dasha
# ──────────────────────────────────────────────────────────────


class YoginiDashaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    num_cycles: int = Field(
        default=3, ge=1, le=5, description="Number of 36-year cycles"
    )


class YoginiDashaEntryOut(BaseModel):
    name: str
    planet: str
    start_date: str
    end_date: str
    duration_years: float


class YoginiDashaOutput(BaseModel):
    moon_nakshatra: str
    starting_yogini: str
    periods: list[YoginiDashaEntryOut]


def _calculate_yogini_dasha(
    moon_longitude: float,
    birth_date: datetime,
    num_cycles: int,
) -> tuple[str, str, list[YoginiDashaEntryOut]]:
    """Core Yogini Dasha: uses NAKSHATRA_TO_YOGINI mapping."""
    normalized = moon_longitude % 360
    nakshatra_idx = int(normalized / NAKSHATRA_SPAN)
    pos_in_nak = (normalized % NAKSHATRA_SPAN) / NAKSHATRA_SPAN

    start_yogini_idx = NAKSHATRA_TO_YOGINI.get(nakshatra_idx, 0)
    start_yogini = YOGINI_SEQUENCE[start_yogini_idx]

    elapsed = pos_in_nak * start_yogini["years"]
    remaining = start_yogini["years"] - elapsed

    nak_name, _, _ = _get_nakshatra(normalized)
    periods: list[YoginiDashaEntryOut] = []
    current_date = birth_date
    yogini_idx = start_yogini_idx

    first_end = _add_years(current_date, remaining)
    periods.append(
        YoginiDashaEntryOut(
            name=start_yogini["name"],
            planet=start_yogini["planet"],
            start_date=current_date.strftime("%Y-%m-%d"),
            end_date=first_end.strftime("%Y-%m-%d"),
            duration_years=round(remaining, 4),
        )
    )
    current_date = first_end
    yogini_idx = (yogini_idx + 1) % 8

    for _cycle in range(num_cycles):
        for _i in range(8):
            yogini = YOGINI_SEQUENCE[yogini_idx]
            end_date = _add_years(current_date, yogini["years"])
            periods.append(
                YoginiDashaEntryOut(
                    name=yogini["name"],
                    planet=yogini["planet"],
                    start_date=current_date.strftime("%Y-%m-%d"),
                    end_date=end_date.strftime("%Y-%m-%d"),
                    duration_years=float(yogini["years"]),
                )
            )
            current_date = end_date
            yogini_idx = (yogini_idx + 1) % 8

    return nak_name, start_yogini["name"], periods


async def tool_get_yogini_dasha(
    input_data: YoginiDashaInput,
) -> YoginiDashaOutput:
    """Tool 5: Calculate Yogini Dasha — 8-Yogini 36-year cycle."""
    birth_date = datetime.fromisoformat(input_data.timestamp_utc.replace("Z", "+00:00"))

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

    moon_lon = _get_moon_longitude_from_chart(chart)
    nak_name, start_name, periods = _calculate_yogini_dasha(
        moon_lon,
        birth_date,
        input_data.num_cycles,
    )

    return YoginiDashaOutput(
        moon_nakshatra=nak_name,
        starting_yogini=start_name,
        periods=periods,
    )


YOGINI_DASHA_SPEC = ToolSpec(
    name="get_yogini_dasha",
    description="Yogini Dasha — 8 Yoginis in a 36-year cycle",
    input_schema=YoginiDashaInput,
    output_schema=YoginiDashaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 6: get_kalachakra_dasha
# ──────────────────────────────────────────────────────────────


class KalachakraDashaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class KalachakraDashaEntryOut(BaseModel):
    sign: str
    lord: str
    start_date: str
    end_date: str
    duration_years: float
    kalachakra_type: str


class KalachakraDashaOutput(BaseModel):
    moon_nakshatra: str
    kalachakra_type: str
    periods: list[KalachakraDashaEntryOut]


def _get_kalachakra_group(nakshatra_idx: int) -> dict[str, Any] | None:
    for group in KALACHAKRA_GROUPS:
        if nakshatra_idx in group["nakshatras"]:
            return group
    return None


def _calculate_kalachakra_dasha(
    moon_longitude: float,
    birth_date: datetime,
) -> tuple[str, str, list[KalachakraDashaEntryOut]]:
    """Core Kalachakra Dasha: sign-based periods with Savya/Apisavya/Mixed progression."""
    normalized = moon_longitude % 360
    nakshatra_idx = int(normalized / NAKSHATRA_SPAN)
    pos_in_nak = (normalized % NAKSHATRA_SPAN) / NAKSHATRA_SPAN

    nak_name, _, _ = _get_nakshatra(normalized)
    group = _get_kalachakra_group(nakshatra_idx)
    if group is None:
        msg = f"No Kalachakra group for nakshatra index {nakshatra_idx}"
        raise ValueError(msg)

    kc_type: str = group["type"]
    durations = KALACHAKRA_DURATIONS[kc_type]
    start_sign_idx: int = group["startSignIdx"]

    periods: list[KalachakraDashaEntryOut] = []
    current_date = birth_date

    first_dur = durations[0]
    remaining = first_dur * (1 - pos_in_nak)
    first_end = _add_years(current_date, remaining)
    periods.append(
        KalachakraDashaEntryOut(
            sign=ZODIAC_SIGNS_KC[start_sign_idx],
            lord=SIGN_LORDS_KC[ZODIAC_SIGNS_KC[start_sign_idx]],
            start_date=current_date.strftime("%Y-%m-%d"),
            end_date=first_end.strftime("%Y-%m-%d"),
            duration_years=round(remaining, 4),
            kalachakra_type=kc_type,
        )
    )
    current_date = first_end

    sign_idx = (
        (start_sign_idx + 1) % 12 if kc_type == "Savya" else (start_sign_idx + 11) % 12
    )

    for i in range(1, 12):
        dur = durations[i]
        end_date = _add_years(current_date, dur)
        sign = ZODIAC_SIGNS_KC[sign_idx]
        periods.append(
            KalachakraDashaEntryOut(
                sign=sign,
                lord=SIGN_LORDS_KC[sign],
                start_date=current_date.strftime("%Y-%m-%d"),
                end_date=end_date.strftime("%Y-%m-%d"),
                duration_years=dur,
                kalachakra_type=kc_type,
            )
        )
        current_date = end_date
        sign_idx = (sign_idx + 1) % 12 if kc_type == "Savya" else (sign_idx + 11) % 12

    return nak_name, kc_type, periods


async def tool_get_kalachakra_dasha(
    input_data: KalachakraDashaInput,
) -> KalachakraDashaOutput:
    """Tool 6: Calculate Kalachakra Dasha — sign-based periods by nakshatra group."""
    birth_date = datetime.fromisoformat(input_data.timestamp_utc.replace("Z", "+00:00"))

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

    moon_lon = _get_moon_longitude_from_chart(chart)
    nak_name, kc_type, periods = _calculate_kalachakra_dasha(moon_lon, birth_date)

    return KalachakraDashaOutput(
        moon_nakshatra=nak_name,
        kalachakra_type=kc_type,
        periods=periods,
    )


KALACHAKRA_DASHA_SPEC = ToolSpec(
    name="get_kalachakra_dasha",
    description="Kalachakra Dasha — Savya/Apisavya/Mixed sign-based periods (12 rasi cycle)",
    input_schema=KalachakraDashaInput,
    output_schema=KalachakraDashaOutput,
    cache_ttl_seconds=300,
)
