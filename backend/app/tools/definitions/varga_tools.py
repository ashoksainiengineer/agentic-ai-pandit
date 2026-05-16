"""Tools 7-9: Divisional Charts (Varga) — D1-D150, boundary safety, transition sweep.

Each tool is registered as a ``ToolSpec`` + async handler function
in the central ``ToolRegistry``.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.definitions.ephemeris_tools import (
    ZODIAC_SIGNS,
    _get_nakshatra,
    _get_sign,
    _get_sign_degree,
    _sidereal_longitude,
)
from app.tools.definitions.forensic_tools import (
    _get_nadi_canonical,
)
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceChartResponse,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── shared helpers ──────────────────────────────────────────

PLANET_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu"]

# Varga division counts
VARGA_DIVISIONS: dict[str, int] = {
    "D1": 1,
    "D2": 2,
    "D7": 7,
    "D9": 9,
    "D10": 10,
    "D12": 12,
    "D24": 24,
    "D30": 30,
    "D40": 40,
    "D45": 45,
    "D60": 60,
    "D150": 150,
}

# Starting sign indices for modality-based vargas (movable/fixed/dual)
# D2 uses odd/even, D9 uses elements, D150 uses special formula
VARGA_START_SIGNS: dict[str, list[int]] = {
    "D7": [0, 4, 8],    # Aries, Leo, Sagittarius
    "D10": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D12": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D24": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D30": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D40": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D45": [0, 4, 8],   # Aries, Leo, Sagittarius
    "D60": [0, 4, 8],   # Aries, Leo, Sagittarius
}

# D9 element-based starting signs (fire/earth/air/water)
D9_START_SIGNS = [0, 9, 6, 3]  # Aries, Capricorn, Libra, Cancer

# Typical planetary speeds in degrees per day (approximate)
PLANET_SPEEDS_DEG_PER_DAY: dict[str, float] = {
    "sun": 1.0,
    "moon": 13.2,
    "mercury": 1.5,
    "venus": 1.0,
    "mars": 0.5,
    "jupiter": 0.08,
    "saturn": 0.03,
    "rahu": 0.05,  # retrograde average
    "ketu": 0.05,  # retrograde average
}

# Ascendant rate: ~1 degree per 4 minutes = 15 deg/hour = 360 deg/day
ASCENDANT_SPEED_DEG_PER_DAY = 360.0

# Nakshatra span in degrees
NAKSHATRA_SPAN_DEG = 360.0 / 27.0


def _calculate_d2_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30) % 12
    deg_in_sign = longitude % 30
    division = int(deg_in_sign / 15)
    if sign_idx % 2 == 0:  # odd signs (0, 2, 4, 6, 8, 10)
        return ZODIAC_SIGNS[[4, 3][division]]
    # even signs (1, 3, 5, 7, 9, 11)
    return ZODIAC_SIGNS[[3, 4][division]]


def _calculate_d9_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30) % 12
    deg_in_sign = longitude % 30
    element = sign_idx % 4
    navamsha_num = int(deg_in_sign / 3.3333333)
    d9_sign_idx = (D9_START_SIGNS[element] + navamsha_num) % 12
    return ZODIAC_SIGNS[d9_sign_idx]


def _calculate_modality_varga_sign(longitude: float, varga_name: str) -> str:
    n = VARGA_DIVISIONS[varga_name]
    sign_idx = int(longitude / 30) % 12
    deg_in_sign = longitude % 30
    division_size = 30.0 / n
    division_num = int(deg_in_sign / division_size)
    modality = sign_idx % 3
    start_signs = VARGA_START_SIGNS[varga_name]
    d_sign_idx = (start_signs[modality] + division_num) % 12
    return ZODIAC_SIGNS[d_sign_idx]


def _calculate_d150_sign(longitude: float) -> str:
    sign = _get_sign(longitude)
    sign_idx = ZODIAC_SIGNS.index(sign)
    deg_in_sign = _get_sign_degree(longitude)
    nadi_idx = int(deg_in_sign / 0.2)  # 0-149
    canonical = _get_nadi_canonical(sign_idx, nadi_idx)
    # D150 sign cycles through all 12 signs, 12.5 times per sign
    d150_sign_idx = (canonical - 1) % 12
    return ZODIAC_SIGNS[d150_sign_idx]


def _get_varga_sign(longitude: float, varga_name: str) -> str:
    if varga_name == "D1":
        return _get_sign(longitude)
    if varga_name == "D2":
        return _calculate_d2_sign(longitude)
    if varga_name == "D9":
        return _calculate_d9_sign(longitude)
    if varga_name == "D150":
        return _calculate_d150_sign(longitude)
    return _calculate_modality_varga_sign(longitude, varga_name)


def _build_planet_positions(chart: EphemerisServiceChartResponse) -> dict[str, float]:
    positions: dict[str, float] = {}
    for p in chart.planets:
        positions[p.body] = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
    return positions


# ──────────────────────────────────────────────────────────────
# Tool 7: get_divisional_charts
# ──────────────────────────────────────────────────────────────


class DivisionalChartsInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class VargaPlanetEntry(BaseModel):
    planet: str
    d1_sign: str
    d2_sign: str
    d7_sign: str
    d9_sign: str
    d10_sign: str
    d12_sign: str
    d24_sign: str
    d30_sign: str
    d40_sign: str
    d45_sign: str
    d60_sign: str
    d150_sign: str


class VargaLagnaEntry(BaseModel):
    d1_sign: str
    d2_sign: str
    d7_sign: str
    d9_sign: str
    d10_sign: str
    d12_sign: str
    d24_sign: str
    d30_sign: str
    d40_sign: str
    d45_sign: str
    d60_sign: str
    d150_sign: str


class DivisionalChartsOutput(BaseModel):
    timestamp_utc: str
    lagna: VargaLagnaEntry
    planets: list[VargaPlanetEntry]


def _chart_to_divisional(chart: EphemerisServiceChartResponse) -> DivisionalChartsOutput:
    asc_sidereal = _sidereal_longitude(
        chart.houses.ascendant_tropical, chart.ayanamsha
    )

    varga_names = [
        "D1", "D2", "D7", "D9", "D10", "D12",
        "D24", "D30", "D40", "D45", "D60", "D150",
    ]

    lagna_signs: dict[str, str] = {}
    for vn in varga_names:
        lagna_signs[vn.lower() + "_sign"] = _get_varga_sign(asc_sidereal, vn)

    lagna_entry = VargaLagnaEntry(**lagna_signs)

    planet_positions = _build_planet_positions(chart)
    planet_entries: list[VargaPlanetEntry] = []

    for planet, lon in planet_positions.items():
        planet_signs: dict[str, str] = {}
        for vn in varga_names:
            planet_signs[vn.lower() + "_sign"] = _get_varga_sign(lon, vn)
        planet_entries.append(VargaPlanetEntry(planet=planet, **planet_signs))

    return DivisionalChartsOutput(
        timestamp_utc=chart.timestamp_utc,
        lagna=lagna_entry,
        planets=planet_entries,
    )


async def tool_get_divisional_charts(
    input_data: DivisionalChartsInput,
) -> DivisionalChartsOutput:
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
        return _chart_to_divisional(chart)
    finally:
        await client.close()


DIVISIONAL_CHARTS_SPEC = ToolSpec(
    name="get_divisional_charts",
    description="Calculate divisional chart (varga) placements for Moon and planets across D1, D2, D7, D9, D10, D12, D24, D30, D40, D45, D60, D150",
    input_schema=DivisionalChartsInput,
    output_schema=DivisionalChartsOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 8: get_boundary_safety
# ──────────────────────────────────────────────────────────────


class BoundarySafetyInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class BoundaryEntry(BaseModel):
    boundary_type: str
    seconds_to_next: float
    seconds_to_previous: float
    current_sign: str
    next_sign: str
    previous_sign: str
    is_safe: bool


class BoundarySafetyOutput(BaseModel):
    timestamp_utc: str
    boundaries: list[BoundaryEntry]
    overall_safety: str
    recommendations: list[str]


def _seconds_to_sign_boundary(
    longitude: float,
    speed_deg_per_day: float,
) -> tuple[float, float]:
    deg_in_sign = longitude % 30
    sign_span = 30.0
    speed_deg_per_sec = speed_deg_per_day / (24 * 3600)
    if speed_deg_per_sec <= 0:
        return float("inf"), float("inf")
    to_next = (sign_span - deg_in_sign) / speed_deg_per_sec
    to_prev = deg_in_sign / speed_deg_per_sec
    return to_next, to_prev


def _seconds_to_nakshatra_boundary(
    longitude: float,
    speed_deg_per_day: float,
) -> tuple[float, float]:
    deg_in_nak = longitude % NAKSHATRA_SPAN_DEG
    speed_deg_per_sec = speed_deg_per_day / (24 * 3600)
    if speed_deg_per_sec <= 0:
        return float("inf"), float("inf")
    to_next = (NAKSHATRA_SPAN_DEG - deg_in_nak) / speed_deg_per_sec
    to_prev = deg_in_nak / speed_deg_per_sec
    return to_next, to_prev


def _seconds_to_varga_boundary(
    longitude: float,
    varga_name: str,
    speed_deg_per_day: float,
) -> tuple[float, float]:
    n = VARGA_DIVISIONS[varga_name]
    deg_in_sign = longitude % 30
    division_size = 30.0 / n
    deg_in_division = deg_in_sign % division_size
    speed_deg_per_sec = speed_deg_per_day / (24 * 3600)
    if speed_deg_per_sec <= 0:
        return float("inf"), float("inf")
    to_next = (division_size - deg_in_division) / speed_deg_per_sec
    to_prev = deg_in_division / speed_deg_per_sec
    return to_next, to_prev


def _next_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30) % 12
    return ZODIAC_SIGNS[(sign_idx + 1) % 12]


def _prev_sign(longitude: float) -> str:
    sign_idx = int(longitude / 30) % 12
    return ZODIAC_SIGNS[(sign_idx - 1) % 12]


def _next_nakshatra(longitude: float) -> str:
    idx = int(longitude / NAKSHATRA_SPAN_DEG) % 27
    next_idx = (idx + 1) % 27
    from app.tools.definitions.ephemeris_tools import NAKSHATRA_NAMES
    return NAKSHATRA_NAMES[next_idx]


def _prev_nakshatra(longitude: float) -> str:
    idx = int(longitude / NAKSHATRA_SPAN_DEG) % 27
    prev_idx = (idx - 1) % 27
    from app.tools.definitions.ephemeris_tools import NAKSHATRA_NAMES
    return NAKSHATRA_NAMES[prev_idx]


def _calculate_boundary_safety(
    chart: EphemerisServiceChartResponse,
) -> BoundarySafetyOutput:
    asc_sidereal = _sidereal_longitude(
        chart.houses.ascendant_tropical, chart.ayanamsha
    )
    planet_positions = _build_planet_positions(chart)
    moon_lon = planet_positions.get("moon", 0.0)

    boundaries: list[BoundaryEntry] = []

    # Lagna sign boundary
    lagna_to_next, lagna_to_prev = _seconds_to_sign_boundary(
        asc_sidereal, ASCENDANT_SPEED_DEG_PER_DAY
    )
    boundaries.append(BoundaryEntry(
        boundary_type="lagna_sign",
        seconds_to_next=round(lagna_to_next, 1),
        seconds_to_previous=round(lagna_to_prev, 1),
        current_sign=_get_sign(asc_sidereal),
        next_sign=_next_sign(asc_sidereal),
        previous_sign=_prev_sign(asc_sidereal),
        is_safe=lagna_to_next > 600 and lagna_to_prev > 600,
    ))

    # Moon nakshatra boundary
    moon_to_next, moon_to_prev = _seconds_to_nakshatra_boundary(
        moon_lon, PLANET_SPEEDS_DEG_PER_DAY["moon"]
    )
    boundaries.append(BoundaryEntry(
        boundary_type="moon_nakshatra",
        seconds_to_next=round(moon_to_next, 1),
        seconds_to_previous=round(moon_to_prev, 1),
        current_sign=_get_nakshatra(moon_lon)[0],
        next_sign=_next_nakshatra(moon_lon),
        previous_sign=_prev_nakshatra(moon_lon),
        is_safe=moon_to_next > 3600 and moon_to_prev > 3600,
    ))

    # D9 lagna boundary
    d9_to_next, d9_to_prev = _seconds_to_varga_boundary(
        asc_sidereal, "D9", ASCENDANT_SPEED_DEG_PER_DAY
    )
    boundaries.append(BoundaryEntry(
        boundary_type="d9_lagna",
        seconds_to_next=round(d9_to_next, 1),
        seconds_to_previous=round(d9_to_prev, 1),
        current_sign=_calculate_d9_sign(asc_sidereal),
        next_sign=_calculate_d9_sign(
            (asc_sidereal + 3.3333333) % 360
        ),
        previous_sign=_calculate_d9_sign(
            (asc_sidereal - 3.3333333 + 360) % 360
        ),
        is_safe=d9_to_next > 300 and d9_to_prev > 300,
    ))

    # D60 planet boundaries (for Moon and Lagna)
    for label, lon, speed in [
        ("d60_moon", moon_lon, PLANET_SPEEDS_DEG_PER_DAY["moon"]),
        ("d60_lagna", asc_sidereal, ASCENDANT_SPEED_DEG_PER_DAY),
    ]:
        d60_to_next, d60_to_prev = _seconds_to_varga_boundary(
            lon, "D60", speed
        )
        boundaries.append(BoundaryEntry(
            boundary_type=label,
            seconds_to_next=round(d60_to_next, 1),
            seconds_to_previous=round(d60_to_prev, 1),
            current_sign=_get_varga_sign(lon, "D60"),
            next_sign=_get_varga_sign(
                (lon + 0.5) % 360, "D60"
            ),
            previous_sign=_get_varga_sign(
                (lon - 0.5 + 360) % 360, "D60"
            ),
            is_safe=d60_to_next > 120 and d60_to_prev > 120,
        ))

    # Overall safety assessment
    unsafe = [b for b in boundaries if not b.is_safe]
    if len(unsafe) >= 3:
        overall = "critical"
    elif len(unsafe) >= 2:
        overall = "high"
    elif len(unsafe) >= 1:
        overall = "moderate"
    else:
        overall = "safe"

    recommendations: list[str] = []
    if overall == "critical":
        recommendations = [
            "Multiple boundaries are extremely close — birth time rectification is essential.",
            "Verify birth time with parents or hospital records.",
            "Consider forensic astrology methods for confirmation.",
        ]
    elif overall == "high":
        recommendations = [
            "At least two boundaries are close — review birth time accuracy.",
            "Use event correlation to validate exact birth time.",
        ]
    elif overall == "moderate":
        recommendations = [
            "One boundary is moderately close — monitor for precision needs.",
        ]
    else:
        recommendations = [
            "All boundaries are comfortably distant — birth time is well-placed.",
        ]

    return BoundarySafetyOutput(
        timestamp_utc=chart.timestamp_utc,
        boundaries=boundaries,
        overall_safety=overall,
        recommendations=recommendations,
    )


async def tool_get_boundary_safety(
    input_data: BoundarySafetyInput,
) -> BoundarySafetyOutput:
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
        return _calculate_boundary_safety(chart)
    finally:
        await client.close()


BOUNDARY_SAFETY_SPEC = ToolSpec(
    name="get_boundary_safety",
    description="Compute seconds-to-boundary for Lagna sign, Moon nakshatra, D9 lagna, and D60 changes",
    input_schema=BoundarySafetyInput,
    output_schema=BoundarySafetyOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 9: find_boundary_changes
# ──────────────────────────────────────────────────────────────


class BoundaryChangesInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"
    sweep_minutes: int = Field(default=120, ge=30, le=240, description="Minutes to sweep on each side")
    step_seconds: int = Field(default=15, ge=5, le=60, description="Step size in seconds")


class TransitionEntry(BaseModel):
    transition_type: str
    planet: str
    from_sign: str
    to_sign: str
    timestamp_utc: str
    direction: str


class BoundaryChangesOutput(BaseModel):
    timestamp_utc: str
    transitions: list[TransitionEntry]
    sweep_range_minutes: int
    step_seconds: int


def _generate_sweep_timestamps(
    center_utc: str,
    sweep_minutes: int,
    step_seconds: int,
) -> list[str]:
    center_dt = datetime.fromisoformat(center_utc.replace("Z", "+00:00"))
    timestamps: list[str] = []
    total_steps = (sweep_minutes * 60) // step_seconds
    for i in range(-total_steps, total_steps + 1):
        delta = timedelta(seconds=i * step_seconds)
        ts = (center_dt + delta).astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        timestamps.append(ts)
    return timestamps


def _detect_transitions(
    center_chart: EphemerisServiceChartResponse,
    charts: list[EphemerisServiceChartResponse],
    _step_seconds: int,
) -> list[TransitionEntry]:
    transitions: list[TransitionEntry] = []

    center_asc = _sidereal_longitude(
        center_chart.houses.ascendant_tropical, center_chart.ayanamsha
    )
    center_positions = _build_planet_positions(center_chart)
    center_moon = center_positions.get("moon", 0.0)

    center_lagna_sign = _get_sign(center_asc)
    center_moon_nak = _get_nakshatra(center_moon)[0]

    prev_lagna_sign = center_lagna_sign
    prev_moon_nak = center_moon_nak
    prev_d10: dict[str, str] = {}
    prev_d60: dict[str, str] = {}
    for p in PLANET_NAMES:
        prev_d10[p] = _get_varga_sign(center_positions.get(p, 0.0), "D10")
        prev_d60[p] = _get_varga_sign(center_positions.get(p, 0.0), "D60")

    for chart in charts:
        asc = _sidereal_longitude(
            chart.houses.ascendant_tropical, chart.ayanamsha
        )
        positions = _build_planet_positions(chart)
        moon = positions.get("moon", 0.0)

        lagna_sign = _get_sign(asc)
        moon_nak = _get_nakshatra(moon)[0]

        if lagna_sign != prev_lagna_sign:
            direction = "forward" if chart.timestamp_utc > center_chart.timestamp_utc else "backward"
            transitions.append(TransitionEntry(
                transition_type="lagna_sign",
                planet="ascendant",
                from_sign=prev_lagna_sign,
                to_sign=lagna_sign,
                timestamp_utc=chart.timestamp_utc,
                direction=direction,
            ))
            prev_lagna_sign = lagna_sign

        if moon_nak != prev_moon_nak:
            direction = "forward" if chart.timestamp_utc > center_chart.timestamp_utc else "backward"
            transitions.append(TransitionEntry(
                transition_type="moon_nakshatra",
                planet="moon",
                from_sign=prev_moon_nak,
                to_sign=moon_nak,
                timestamp_utc=chart.timestamp_utc,
                direction=direction,
            ))
            prev_moon_nak = moon_nak

        for p in PLANET_NAMES:
            d10_sign = _get_varga_sign(positions.get(p, 0.0), "D10")
            if d10_sign != prev_d10.get(p, ""):
                direction = "forward" if chart.timestamp_utc > center_chart.timestamp_utc else "backward"
                transitions.append(TransitionEntry(
                    transition_type="d10_sign",
                    planet=p,
                    from_sign=prev_d10.get(p, ""),
                    to_sign=d10_sign,
                    timestamp_utc=chart.timestamp_utc,
                    direction=direction,
                ))
                prev_d10[p] = d10_sign

            d60_sign = _get_varga_sign(positions.get(p, 0.0), "D60")
            if d60_sign != prev_d60.get(p, ""):
                direction = "forward" if chart.timestamp_utc > center_chart.timestamp_utc else "backward"
                transitions.append(TransitionEntry(
                    transition_type="d60_sign",
                    planet=p,
                    from_sign=prev_d60.get(p, ""),
                    to_sign=d60_sign,
                    timestamp_utc=chart.timestamp_utc,
                    direction=direction,
                ))
                prev_d60[p] = d60_sign

    return transitions


async def tool_find_boundary_changes(
    input_data: BoundaryChangesInput,
) -> BoundaryChangesOutput:
    client = EphemerisClient()
    try:
        # Fetch center chart
        center_request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.latitude,
                longitude=input_data.longitude,
            ),
            ayanamsha_mode=input_data.ayanamsha_mode,
            house_system=input_data.house_system,
            timestamp_utc=input_data.timestamp_utc,
        )
        center_chart = await client.fetch_chart(center_request)

        # Generate sweep timestamps
        timestamps = _generate_sweep_timestamps(
            input_data.timestamp_utc,
            input_data.sweep_minutes,
            input_data.step_seconds,
        )

        timestamps = [ts for ts in timestamps if ts != input_data.timestamp_utc]

        # Batch fetch all sweep charts
        from app.tools.ephemeris_client import EphemerisServiceBatchRequest

        batch_request = EphemerisServiceBatchRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.latitude,
                longitude=input_data.longitude,
            ),
            ayanamsha_mode=input_data.ayanamsha_mode,
            house_system=input_data.house_system,
            timestamps_utc=timestamps,
        )
        batch_response = await client.fetch_charts_batch(batch_request)

        # Combine center + sweep charts and sort by timestamp
        all_charts = [center_chart] + list(batch_response.charts)
        all_charts.sort(key=lambda c: c.timestamp_utc)

        transitions = _detect_transitions(
            center_chart, all_charts, input_data.step_seconds
        )

        return BoundaryChangesOutput(
            timestamp_utc=input_data.timestamp_utc,
            transitions=transitions,
            sweep_range_minutes=input_data.sweep_minutes,
            step_seconds=input_data.step_seconds,
        )
    finally:
        await client.close()


FIND_BOUNDARY_CHANGES_SPEC = ToolSpec(
    name="find_boundary_changes",
    description="Sweep backward and forward from birth time to find exact Lagna sign, Moon nakshatra, D10, and D60 transition timestamps",
    input_schema=BoundaryChangesInput,
    output_schema=BoundaryChangesOutput,
    cache_ttl_seconds=300,
)
