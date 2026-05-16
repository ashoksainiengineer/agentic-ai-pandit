"""Tools 10-12: Strength & Precision — Shadbala, Ashtakavarga, KP Sublords.

Each tool is registered as a ``ToolSpec`` + async handler function
in the central ``ToolRegistry``.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.definitions.dasha_tools import (
    DASHA_SEQUENCE,
    DASHA_YEARS,
    NAKSHATRA_LORDS,
    TOTAL_DASHA_YEARS,
)
from app.tools.definitions.ephemeris_tools import (
    SIGN_LORDS,
    ZODIAC_SIGNS,
    _get_sign,
    _sidereal_longitude,
)
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceChartResponse,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── shared astrological helpers ─────────────────────────────

NAKSHATRA_SPAN = 360.0 / 27.0

EXALTATION_SIGNS: dict[str, str] = {
    "sun": "Aries",
    "moon": "Taurus",
    "mars": "Capricorn",
    "mercury": "Virgo",
    "jupiter": "Cancer",
    "venus": "Pisces",
    "saturn": "Libra",
}

MOOLATRIKONA_SIGNS: dict[str, str] = {
    "sun": "Leo",
    "moon": "Taurus",
    "mars": "Aries",
    "mercury": "Virgo",
    "jupiter": "Sagittarius",
    "venus": "Libra",
    "saturn": "Aquarius",
}

DEBILITATION_SIGNS: dict[str, str] = {
    "sun": "Libra",
    "moon": "Scorpio",
    "mars": "Cancer",
    "mercury": "Pisces",
    "jupiter": "Capricorn",
    "venus": "Virgo",
    "saturn": "Aries",
}

FRIENDLY_SIGNS: dict[str, set[str]] = {
    "sun": {"Aries", "Leo", "Sagittarius", "Gemini", "Libra"},
    "moon": {"Taurus", "Cancer", "Virgo", "Scorpio", "Pisces"},
    "mars": {"Aries", "Leo", "Sagittarius", "Gemini", "Libra"},
    "mercury": {"Taurus", "Gemini", "Virgo", "Libra", "Capricorn", "Aquarius"},
    "jupiter": {"Aries", "Cancer", "Leo", "Sagittarius", "Pisces"},
    "venus": {"Taurus", "Cancer", "Libra", "Scorpio", "Pisces"},
    "saturn": {"Taurus", "Gemini", "Virgo", "Libra", "Capricorn", "Aquarius"},
}

KENDRA_HOUSES: set[int] = {1, 4, 7, 10}

MEAN_DAILY_SPEEDS: dict[str, float] = {
    "sun": 1.0,
    "moon": 13.2,
    "mercury": 1.2,
    "venus": 1.0,
    "mars": 0.5,
    "jupiter": 0.08,
    "saturn": 0.03,
    "rahu": 0.05,
    "ketu": 0.05,
}

DIURNAL_PLANETS: set[str] = {"sun", "jupiter", "saturn"}
NOCTURNAL_PLANETS: set[str] = {"moon", "venus", "mars"}

BENEFIC_PLANETS: set[str] = {"jupiter", "venus"}
MALEFIC_PLANETS: set[str] = {"saturn", "mars", "sun"}

BAV_PLANET_ORDER: list[str] = [
    "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn",
]

BAV_CONTRIBUTORS: dict[str, list[str]] = {
    "sun": ["sun", "moon", "mars", "jupiter", "saturn"],
    "moon": ["sun", "moon", "mars", "jupiter", "saturn"],
    "mars": ["sun", "moon", "mars", "jupiter", "saturn"],
    "mercury": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "ascendant"],
    "jupiter": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"],
    "venus": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"],
    "saturn": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"],
}

BAV_BENEFIC_DISTANCES: dict[str, set[int]] = {
    "sun": {1, 3, 5, 6, 9, 10, 11},
    "moon": {1, 3, 6, 7, 10, 11},
    "mars": {1, 2, 4, 7, 8, 10, 11},
    "mercury": {1, 3, 5, 6, 9, 10, 11, 12},
    "jupiter": {1, 2, 4, 7, 8, 10, 11},
    "venus": {1, 2, 3, 4, 5, 8, 9, 11, 12},
    "saturn": {1, 3, 5, 6, 9, 10, 11, 12},
}


# ── low-level helpers ───────────────────────────────────────


def _get_sign_index(sign: str) -> int:
    return ZODIAC_SIGNS.index(sign)


def _get_whole_sign_house(longitude: float, ascendant_longitude: float) -> int:
    asc_sign_idx = int(ascendant_longitude / 30) % 12
    planet_sign_idx = int(longitude / 30) % 12
    return ((planet_sign_idx - asc_sign_idx) % 12) + 1


def _build_planet_positions(chart: EphemerisServiceChartResponse) -> dict[str, float]:
    positions: dict[str, float] = {}
    for p in chart.planets:
        positions[p.body] = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
    return positions


def _get_sidereal_cusps(chart: EphemerisServiceChartResponse) -> list[float]:
    if chart.houses.house_cusps_sidereal:
        return chart.houses.house_cusps_sidereal
    return [_sidereal_longitude(c, chart.ayanamsha) for c in chart.houses.house_cusps_tropical]


def _are_in_aspect(p1_sign_idx: int, p2_sign_idx: int, p1_name: str) -> bool:
    diff = (p2_sign_idx - p1_sign_idx) % 12
    if diff == 6:
        return True
    if p1_name == "mars" and diff in {3, 7}:
        return True
    if p1_name == "jupiter" and diff in {4, 8}:
        return True
    return bool(p1_name == "saturn" and diff in {2, 9})


# ── Shadbala helpers ────────────────────────────────────────


def _calculate_sthana_bala(planet: str, sign: str, house: int) -> float:
    if EXALTATION_SIGNS.get(planet) == sign or SIGN_LORDS.get(sign) == planet:
        score = 1.0
    elif MOOLATRIKONA_SIGNS.get(planet) == sign:
        score = 0.9
    elif sign in FRIENDLY_SIGNS.get(planet, set()):
        score = 0.7
    elif DEBILITATION_SIGNS.get(planet) == sign:
        score = 0.1
    else:
        score = 0.3

    if house in KENDRA_HOUSES:
        score = min(1.0, score + 0.1)

    return round(score, 4)


def _calculate_dig_bala(planet: str, house: int) -> float:
    strongest_house: dict[str, int] = {
        "sun": 10,
        "mars": 10,
        "saturn": 7,
        "moon": 4,
        "venus": 4,
        "jupiter": 1,
        "mercury": 1,
        "rahu": 10,
        "ketu": 4,
    }
    strong = strongest_house.get(planet, 1)
    diff = abs(house - strong)
    diff = min(diff, 12 - diff)
    score = max(0.0, 1.0 - diff / 6.0)
    return round(score, 4)


def _calculate_kala_bala(
    planet: str,
    sun_house: int,
    sun_longitude: float,
    moon_longitude: float,
) -> float:
    day_score = max(0.0, 1.0 - abs(sun_house - 10) / 6.0)

    if planet in DIURNAL_PLANETS:
        base = day_score
    elif planet in NOCTURNAL_PLANETS:
        base = 1.0 - day_score
    else:
        base = 0.5

    moon_sun_distance = (moon_longitude - sun_longitude) % 360
    is_waxing = moon_sun_distance < 180
    if is_waxing and planet in {"moon", "venus", "jupiter", "mercury"} or not is_waxing and planet in {"sun", "mars", "saturn"}:
        base = min(1.0, base + 0.1)

    return round(base, 4)


def _calculate_cheshta_bala(planet: str, retrograde: bool, speed: float) -> float:
    if retrograde:
        return 1.0
    mean_speed = MEAN_DAILY_SPEEDS.get(planet, 0.5)
    if mean_speed == 0:
        return 0.5
    ratio = abs(speed) / mean_speed
    if ratio > 1.0:
        return 0.8
    if ratio > 0.5:
        return 0.6
    return 0.4


def _calculate_naisargika_bala(planet: str) -> float:
    hierarchy: dict[str, float] = {
        "saturn": 0.1,
        "mars": 0.2,
        "mercury": 0.3,
        "jupiter": 0.5,
        "venus": 0.6,
        "moon": 0.8,
        "sun": 1.0,
        "rahu": 0.15,
        "ketu": 0.15,
    }
    return hierarchy.get(planet, 0.5)


def _calculate_drig_bala(
    planet: str,
    planet_sign_idx: int,
    all_positions: dict[str, float],
) -> float:
    modifier = 0.0
    for other_planet, other_lon in all_positions.items():
        if other_planet == planet:
            continue
        other_sign_idx = int(other_lon / 30) % 12
        if _are_in_aspect(other_sign_idx, planet_sign_idx, other_planet):
            if other_planet in BENEFIC_PLANETS:
                modifier += 0.15
            elif other_planet in MALEFIC_PLANETS:
                modifier -= 0.15

    score = 0.5 + modifier
    return round(max(0.0, min(1.0, score)), 4)


# ── KP Sublord helpers ──────────────────────────────────────


def _get_sub_lord(
    position: float,
    start_lord: str,
    parent_span: float,
) -> tuple[str, float, float]:
    """Return (lord, position_within_sub, sub_size) for a Vimshottari subdivision."""
    start_idx = DASHA_SEQUENCE.index(start_lord)
    current_pos = 0.0
    for i in range(9):
        lord = DASHA_SEQUENCE[(start_idx + i) % 9]
        sub_size = parent_span * (DASHA_YEARS[lord] / TOTAL_DASHA_YEARS)
        if current_pos <= position < current_pos + sub_size:
            return lord, position - current_pos, sub_size
        current_pos += sub_size

    last_lord = DASHA_SEQUENCE[(start_idx + 8) % 9]
    last_size = parent_span * (DASHA_YEARS[last_lord] / TOTAL_DASHA_YEARS)
    return last_lord, 0.0, last_size


def _get_kp_hierarchy(longitude: float) -> dict[str, str]:
    """Calculate the 4-level KP hierarchy for a sidereal longitude."""
    nakshatra_idx = int(longitude / NAKSHATRA_SPAN) % 27
    star_lord = NAKSHATRA_LORDS[nakshatra_idx]
    pos_in_nak = longitude % NAKSHATRA_SPAN

    sub_lord, pos_in_sub, sub_size = _get_sub_lord(
        pos_in_nak, star_lord, NAKSHATRA_SPAN
    )
    sub_sub_lord, pos_in_sub_sub, sub_sub_size = _get_sub_lord(
        pos_in_sub, sub_lord, sub_size
    )
    sub_sub_sub_lord, _, _ = _get_sub_lord(
        pos_in_sub_sub, sub_sub_lord, sub_sub_size
    )

    return {
        "star_lord": star_lord,
        "sub_lord": sub_lord,
        "sub_sub_lord": sub_sub_lord,
        "sub_sub_sub_lord": sub_sub_sub_lord,
    }


# ──────────────────────────────────────────────────────────────
# Tool 10: get_shadbala
# ──────────────────────────────────────────────────────────────


class ShadbalaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class ShadbalaPlanetOut(BaseModel):
    planet: str
    sthana_bala: float
    dig_bala: float
    kala_bala: float
    cheshta_bala: float
    naisargika_bala: float
    drig_bala: float
    total_shadbala: float


class ShadbalaOutput(BaseModel):
    timestamp_utc: str
    planets: list[ShadbalaPlanetOut]


def _compute_shadbala(chart: EphemerisServiceChartResponse) -> ShadbalaOutput:
    """Compute six-fold planetary strength for all planets in the chart."""
    asc_sidereal = _sidereal_longitude(
        chart.houses.ascendant_tropical, chart.ayanamsha
    )
    planet_positions = _build_planet_positions(chart)

    sun_lon = planet_positions.get("sun", 0.0)
    moon_lon = planet_positions.get("moon", 0.0)
    sun_house = _get_whole_sign_house(sun_lon, asc_sidereal)

    results: list[ShadbalaPlanetOut] = []
    for planet, lon in planet_positions.items():
        sign = _get_sign(lon)
        house = _get_whole_sign_house(lon, asc_sidereal)
        sign_idx = int(lon / 30) % 12

        retrograde = False
        speed = 0.0
        for p in chart.planets:
            if p.body == planet:
                retrograde = p.retrograde
                speed = p.longitude_speed
                break

        sthana = _calculate_sthana_bala(planet, sign, house)
        dig = _calculate_dig_bala(planet, house)
        kala = _calculate_kala_bala(planet, sun_house, sun_lon, moon_lon)
        cheshta = _calculate_cheshta_bala(planet, retrograde, speed)
        naisargika = _calculate_naisargika_bala(planet)
        drig = _calculate_drig_bala(planet, sign_idx, planet_positions)

        total = round((sthana + dig + kala + cheshta + naisargika + drig) / 6, 4)

        results.append(
            ShadbalaPlanetOut(
                planet=planet,
                sthana_bala=sthana,
                dig_bala=dig,
                kala_bala=kala,
                cheshta_bala=cheshta,
                naisargika_bala=naisargika,
                drig_bala=drig,
                total_shadbala=total,
            )
        )

    return ShadbalaOutput(
        timestamp_utc=chart.timestamp_utc,
        planets=results,
    )


async def tool_get_shadbala(input_data: ShadbalaInput) -> ShadbalaOutput:
    """Tool 10: Calculate six-fold planetary strength (Shadbala)."""
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
        return _compute_shadbala(chart)
    finally:
        await client.close()


SHADBALA_SPEC = ToolSpec(
    name="get_shadbala",
    description="Calculate six-fold planetary strength: Sthana, Dig, Kala, Cheshta, Naisargika, Drig Bala",
    input_schema=ShadbalaInput,
    output_schema=ShadbalaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 11: get_ashtakavarga
# ──────────────────────────────────────────────────────────────


class AshtakavargaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class AshtakavargaSignOut(BaseModel):
    sign: str
    points: int


class AshtakavargaPlanetOut(BaseModel):
    contributor: str
    sign_points: list[AshtakavargaSignOut]


class AshtakavargaOutput(BaseModel):
    timestamp_utc: str
    bav_per_planet: list[AshtakavargaPlanetOut]
    sav_per_sign: list[AshtakavargaSignOut]


def _compute_ashtakavarga(
    planet_positions: dict[str, float],
    ascendant_longitude: float,
) -> tuple[list[AshtakavargaPlanetOut], list[AshtakavargaSignOut]]:
    """Compute Bhava Ashtakavarga (BAV) per planet and Sarva Ashtakavarga (SAV) per sign."""
    asc_sign_idx = int(ascendant_longitude / 30) % 12

    planet_sign_indices: dict[str, int] = {}
    for planet, lon in planet_positions.items():
        planet_sign_indices[planet] = int(lon / 30) % 12
    planet_sign_indices["ascendant"] = asc_sign_idx

    bav_results: list[AshtakavargaPlanetOut] = []
    sav: list[int] = [0] * 12

    for contributor_planet in BAV_PLANET_ORDER:
        contributors = BAV_CONTRIBUTORS[contributor_planet]
        benefic_distances = BAV_BENEFIC_DISTANCES[contributor_planet]
        contributor_sign_idx = planet_sign_indices.get(contributor_planet, 0)

        sign_points: list[AshtakavargaSignOut] = []
        for sign_idx in range(12):
            points = 0
            for q in contributors:
                q_sign_idx = planet_sign_indices.get(q, 0)
                if q_sign_idx == sign_idx:
                    distance = ((sign_idx - contributor_sign_idx) % 12) + 1
                    if distance in benefic_distances:
                        points += 1

            sign_points.append(
                AshtakavargaSignOut(
                    sign=ZODIAC_SIGNS[sign_idx],
                    points=points,
                )
            )
            sav[sign_idx] += points

        bav_results.append(
            AshtakavargaPlanetOut(
                contributor=contributor_planet,
                sign_points=sign_points,
            )
        )

    sav_out = [
        AshtakavargaSignOut(sign=ZODIAC_SIGNS[i], points=sav[i])
        for i in range(12)
    ]

    return bav_results, sav_out


async def tool_get_ashtakavarga(input_data: AshtakavargaInput) -> AshtakavargaOutput:
    """Tool 11: Calculate Bhava Ashtakavarga (BAV) and Sarva Ashtakavarga (SAV)."""
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

    planet_positions = _build_planet_positions(chart)
    asc_sidereal = _sidereal_longitude(
        chart.houses.ascendant_tropical, chart.ayanamsha
    )
    bav, sav = _compute_ashtakavarga(planet_positions, asc_sidereal)

    return AshtakavargaOutput(
        timestamp_utc=chart.timestamp_utc,
        bav_per_planet=bav,
        sav_per_sign=sav,
    )


ASHTAKAVARGA_SPEC = ToolSpec(
    name="get_ashtakavarga",
    description="Calculate Bhava Ashtakavarga (BAV) for 7 grahas and Sarva Ashtakavarga (SAV) per sign",
    input_schema=AshtakavargaInput,
    output_schema=AshtakavargaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 12: get_kp_sublords
# ──────────────────────────────────────────────────────────────


class KpSublordsInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class KpHierarchyOut(BaseModel):
    star_lord: str
    sub_lord: str
    sub_sub_lord: str
    sub_sub_sub_lord: str


class KpSublordCuspOut(BaseModel):
    cusp_number: int
    longitude: float
    sign: str
    hierarchy: KpHierarchyOut


class KpSublordPlanetOut(BaseModel):
    planet: str
    longitude: float
    sign: str
    hierarchy: KpHierarchyOut


class KpSublordsOutput(BaseModel):
    timestamp_utc: str
    cusps: list[KpSublordCuspOut]
    planets: list[KpSublordPlanetOut]


def _compute_kp_sublords(chart: EphemerisServiceChartResponse) -> KpSublordsOutput:
    """Compute 4-level KP hierarchy for all 12 cusps and 9 planets."""
    cusps = _get_sidereal_cusps(chart)
    planet_positions = _build_planet_positions(chart)

    cusp_results: list[KpSublordCuspOut] = []
    for i, cusp_lon in enumerate(cusps):
        hierarchy = _get_kp_hierarchy(cusp_lon)
        cusp_results.append(
            KpSublordCuspOut(
                cusp_number=i + 1,
                longitude=round(cusp_lon, 6),
                sign=_get_sign(cusp_lon),
                hierarchy=KpHierarchyOut(**hierarchy),
            )
        )

    planet_results: list[KpSublordPlanetOut] = []
    for planet, lon in planet_positions.items():
        hierarchy = _get_kp_hierarchy(lon)
        planet_results.append(
            KpSublordPlanetOut(
                planet=planet,
                longitude=round(lon, 6),
                sign=_get_sign(lon),
                hierarchy=KpHierarchyOut(**hierarchy),
            )
        )

    return KpSublordsOutput(
        timestamp_utc=chart.timestamp_utc,
        cusps=cusp_results,
        planets=planet_results,
    )


async def tool_get_kp_sublords(input_data: KpSublordsInput) -> KpSublordsOutput:
    """Tool 12: Calculate 4-level KP hierarchy (Star→Sub→Sub-Sub→Sub-Sub-Sub)."""
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
        return _compute_kp_sublords(chart)
    finally:
        await client.close()


KP_SUBLORDS_SPEC = ToolSpec(
    name="get_kp_sublords",
    description="Calculate 4-level KP hierarchy (Star→Sub→Sub-Sub→Sub-Sub-Sub) for 12 cusps and 9 planets",
    input_schema=KpSublordsInput,
    output_schema=KpSublordsOutput,
    cache_ttl_seconds=300,
)
