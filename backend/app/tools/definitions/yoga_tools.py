"""Tools 14-15: Yoga Detection — Parivartana, Raja Yoga, Dharma-Karmadhipati,
and the 5 Maha Purusha Yogas.

Each tool is registered as a ``ToolSpec`` + async handler function
in the central ``ToolRegistry``.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
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

EXALTATION_SIGNS: dict[str, str] = {
    "sun": "Aries",
    "moon": "Taurus",
    "mars": "Capricorn",
    "mercury": "Virgo",
    "jupiter": "Cancer",
    "venus": "Pisces",
    "saturn": "Libra",
}

OWN_SIGNS: dict[str, list[str]] = {
    "sun": ["Leo"],
    "moon": ["Cancer"],
    "mars": ["Aries", "Scorpio"],
    "mercury": ["Gemini", "Virgo"],
    "jupiter": ["Sagittarius", "Pisces"],
    "venus": ["Taurus", "Libra"],
    "saturn": ["Capricorn", "Aquarius"],
}

KENDRA_HOUSES: set[int] = {1, 4, 7, 10}
TRIKONA_HOUSES: set[int] = {1, 5, 9}


def _sign_index(sign: str) -> int:
    return ZODIAC_SIGNS.index(sign)


def _get_house_signs(ascendant_sign: str) -> list[str]:
    """Return the 12 whole-sign houses starting from ascendant sign."""
    asc_idx = _sign_index(ascendant_sign)
    return [ZODIAC_SIGNS[(asc_idx + i) % 12] for i in range(12)]


def _get_house_lords(ascendant_sign: str) -> list[str]:
    """Return the lord of each of the 12 houses."""
    houses = _get_house_signs(ascendant_sign)
    return [SIGN_LORDS[h] for h in houses]


def _get_planet_sign_idx(planet_positions: dict[str, float], planet: str) -> int | None:
    lon = planet_positions.get(planet)
    if lon is None:
        return None
    return int(lon / 30) % 12


def _are_in_aspect(p1_sign_idx: int, p2_sign_idx: int, p1_name: str) -> bool:
    """Check if planet p1 aspects planet p2 (sign-based Vedic aspects).

    All planets aspect the 7th sign.
    Mars additionally aspects 4th and 8th.
    Jupiter additionally aspects 5th and 9th.
    Saturn additionally aspects 3rd and 10th.
    """
    diff = (p2_sign_idx - p1_sign_idx) % 12
    if diff == 6:  # 7th aspect (opposition)
        return True
    if p1_name == "mars" and diff in {3, 7}:
        return True
    if p1_name == "jupiter" and diff in {4, 8}:
        return True
    return bool(p1_name == "saturn" and diff in {2, 9})


def _mutual_aspect(
    p1_sign_idx: int, p2_sign_idx: int, p1_name: str, p2_name: str
) -> bool:
    return _are_in_aspect(p1_sign_idx, p2_sign_idx, p1_name) or _are_in_aspect(
        p2_sign_idx, p1_sign_idx, p2_name
    )


def _build_planet_positions(chart: EphemerisServiceChartResponse) -> dict[str, float]:
    """Build a dict of planet name -> sidereal longitude."""
    positions: dict[str, float] = {}
    for p in chart.planets:
        positions[p.body] = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
    return positions


# ──────────────────────────────────────────────────────────────
# Tool 14: get_yogas
# ──────────────────────────────────────────────────────────────


class YogaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class DetectedYoga(BaseModel):
    name: str
    description: str
    planets_involved: list[str]
    significance: str


class YogaOutput(BaseModel):
    timestamp_utc: str
    ascendant_sign: str
    yogas: list[DetectedYoga]


def _detect_parivartana(
    planet_positions: dict[str, float],
    house_lords: list[str],
) -> list[DetectedYoga]:
    """Detect Parivartana Yoga — mutual exchange of house lordships."""
    yogas: list[DetectedYoga] = []
    planets = list(planet_positions.keys())
    seen_pairs: set[tuple[str, str]] = set()

    for i, p1 in enumerate(planets):
        for p2 in planets[i + 1 :]:
            if p1 == p2:
                continue
            p1_sign_idx = _get_planet_sign_idx(planet_positions, p1)
            p2_sign_idx = _get_planet_sign_idx(planet_positions, p2)
            if p1_sign_idx is None or p2_sign_idx is None:
                continue

            # p1 is in p2's sign AND p2 is in p1's sign
            p1_lords_sign = house_lords[p1_sign_idx]
            p2_lords_sign = house_lords[p2_sign_idx]
            if p1_lords_sign == p2 and p2_lords_sign == p1:
                pair: tuple[str, str] = (p1, p2) if p1 < p2 else (p2, p1)
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    houses_involved = [p1_sign_idx + 1, p2_sign_idx + 1]
                    yogas.append(
                        DetectedYoga(
                            name="Parivartana Yoga",
                            description=f"Mutual exchange between {p1.title()} and {p2.title()} in houses {houses_involved[0]} and {houses_involved[1]}.",
                            planets_involved=[p1, p2],
                            significance="Creates powerful mutual connection between the houses involved, granting results of both houses through cooperative effort.",
                        )
                    )
    return yogas


def _detect_raja_yoga(
    planet_positions: dict[str, float],
    house_lords: list[str],
) -> list[DetectedYoga]:
    """Detect Raja Yoga — kendra + trikona lord connections."""
    yogas: list[DetectedYoga] = []
    seen: set[str] = set()

    # Build lord -> houses mapping
    lord_to_houses: dict[str, list[int]] = {}
    for house_num, lord in enumerate(house_lords, start=1):
        lord_to_houses.setdefault(lord, []).append(house_num)

    # Type 1: Same planet rules both a kendra and a trikona
    for planet, houses in lord_to_houses.items():
        has_kendra = any(h in KENDRA_HOUSES for h in houses)
        has_trikona = any(h in TRIKONA_HOUSES for h in houses)
        if has_kendra and has_trikona:
            key = f"raja_{planet}_lordship"
            if key not in seen:
                seen.add(key)
                yogas.append(
                    DetectedYoga(
                        name="Raja Yoga",
                        description=f"{planet.title()} rules both a kendra and a trikona house ({houses}).",
                        planets_involved=[planet],
                        significance="Grants power, authority, and success through the natural strength of the planet owning both angular and trinal houses.",
                    )
                )

    # Type 2: Kendra lord conjunct with trikona lord
    kendra_lords = {
        lord for h, lord in enumerate(house_lords, start=1) if h in KENDRA_HOUSES
    }
    trikona_lords = {
        lord for h, lord in enumerate(house_lords, start=1) if h in TRIKONA_HOUSES
    }

    for kl in kendra_lords:
        for tl in trikona_lords:
            if kl == tl:
                continue
            kl_sign = _get_planet_sign_idx(planet_positions, kl)
            tl_sign = _get_planet_sign_idx(planet_positions, tl)
            if kl_sign is None or tl_sign is None:
                continue
            if kl_sign == tl_sign:  # conjunction
                key = f"raja_{kl}_{tl}_conj"
                if key not in seen:
                    seen.add(key)
                    yogas.append(
                        DetectedYoga(
                            name="Raja Yoga",
                            description=f"Kendra lord {kl.title()} and trikona lord {tl.title()} are conjunct in {ZODIAC_SIGNS[kl_sign]}.",
                            planets_involved=[kl, tl],
                            significance="Powerful combination for leadership, success, and recognition in life.",
                        )
                    )

    return yogas


def _detect_dharma_karmadhipati(
    planet_positions: dict[str, float],
    house_lords: list[str],
) -> list[DetectedYoga]:
    """Detect Dharma-Karmadhipati Yoga — 9th and 10th lord connection."""
    yogas: list[DetectedYoga] = []
    lord_9 = house_lords[8]  # house 9
    lord_10 = house_lords[9]  # house 10

    if lord_9 == lord_10:
        yogas.append(
            DetectedYoga(
                name="Dharma-Karmadhipati Yoga",
                description=f"The same planet ({lord_9.title()}) rules both the 9th and 10th houses.",
                planets_involved=[lord_9],
                significance="Natural integration of dharma (fortune, righteousness) with karma (action, career). Highly auspicious for purposeful work and righteous authority.",
            )
        )
        return yogas

    p9_sign = _get_planet_sign_idx(planet_positions, lord_9)
    p10_sign = _get_planet_sign_idx(planet_positions, lord_10)
    if p9_sign is None or p10_sign is None:
        return yogas

    # Conjunction
    if p9_sign == p10_sign:
        yogas.append(
            DetectedYoga(
                name="Dharma-Karmadhipati Yoga",
                description=f"9th lord {lord_9.title()} and 10th lord {lord_10.title()} are conjunct in {ZODIAC_SIGNS[p9_sign]}.",
                planets_involved=[lord_9, lord_10],
                significance="Fortune and career unite — success through righteous action, teaching, leadership, or spiritual vocation.",
            )
        )
        return yogas

    # Mutual aspect
    if _mutual_aspect(p9_sign, p10_sign, lord_9, lord_10):
        yogas.append(
            DetectedYoga(
                name="Dharma-Karmadhipati Yoga",
                description=f"9th lord {lord_9.title()} and 10th lord {lord_10.title()} are in mutual aspect.",
                planets_involved=[lord_9, lord_10],
                significance="Strong connection between fortune and profession; career gains through wisdom, teaching, ethics, or foreign connections.",
            )
        )
        return yogas

    # Mutual exchange (Parivartana between 9th and 10th lords)
    p9_lords_sign = house_lords[p9_sign]
    p10_lords_sign = house_lords[p10_sign]
    if p9_lords_sign == lord_10 and p10_lords_sign == lord_9:
        yogas.append(
            DetectedYoga(
                name="Dharma-Karmadhipati Yoga",
                description=f"9th lord {lord_9.title()} and 10th lord {lord_10.title()} are in mutual exchange (Parivartana).",
                planets_involved=[lord_9, lord_10],
                significance="Exchange of dharma and karma houses brings powerful career success aligned with higher purpose and righteousness.",
            )
        )

    return yogas


def _calculate_yogas(chart: EphemerisServiceChartResponse) -> YogaOutput:
    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
    asc_sign = _get_sign(asc_sidereal)
    planet_positions = _build_planet_positions(chart)
    house_lords = _get_house_lords(asc_sign)

    yogas: list[DetectedYoga] = []
    yogas.extend(_detect_parivartana(planet_positions, house_lords))
    yogas.extend(_detect_raja_yoga(planet_positions, house_lords))
    yogas.extend(_detect_dharma_karmadhipati(planet_positions, house_lords))

    return YogaOutput(
        timestamp_utc=chart.timestamp_utc,
        ascendant_sign=asc_sign,
        yogas=yogas,
    )


async def tool_get_yogas(input_data: YogaInput) -> YogaOutput:
    """Tool 14: Detect Parivartana, Raja Yoga, and Dharma-Karmadhipati Yoga."""
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
        return _calculate_yogas(chart)
    finally:
        await client.close()


YOGAS_SPEC = ToolSpec(
    name="get_yogas",
    description="Detect Parivartana Yoga, Raja Yoga, and Dharma-Karmadhipati Yoga from a birth chart",
    input_schema=YogaInput,
    output_schema=YogaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 15: get_maha_purusha_yogas
# ──────────────────────────────────────────────────────────────


class MahaPurushaYogaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class MahaPurushaYogaEntry(BaseModel):
    yoga_name: str
    planet: str
    placement_type: str
    sign: str
    house: int
    strength: float


class MahaPurushaYogaOutput(BaseModel):
    timestamp_utc: str
    ascendant_sign: str
    yogas: list[MahaPurushaYogaEntry]


MAHA_PURUSHA_PLANETS: dict[str, str] = {
    "jupiter": "Hamsa Yoga",
    "venus": "Malavya Yoga",
    "saturn": "Sasa Yoga",
    "mars": "Ruchaka Yoga",
    "mercury": "Bhadra Yoga",
}


def _detect_maha_purusha_yogas(
    chart: EphemerisServiceChartResponse,
) -> MahaPurushaYogaOutput:
    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
    asc_sign = _get_sign(asc_sidereal)
    asc_idx = _sign_index(asc_sign)
    planet_positions = _build_planet_positions(chart)

    yogas: list[MahaPurushaYogaEntry] = []

    for planet, yoga_name in MAHA_PURUSHA_PLANETS.items():
        lon = planet_positions.get(planet)
        if lon is None:
            continue

        sign = _get_sign(lon)
        sign_idx = _sign_index(sign)
        house = ((sign_idx - asc_idx) % 12) + 1

        if house not in KENDRA_HOUSES:
            continue

        is_own = sign in OWN_SIGNS.get(planet, [])
        is_exalted = EXALTATION_SIGNS.get(planet) == sign

        if is_own or is_exalted:
            placement_type = "exaltation" if is_exalted else "own_sign"
            # Strength: exalted in kendra = 1.2, own in kendra = 1.0
            strength = 1.2 if is_exalted else 1.0
            yogas.append(
                MahaPurushaYogaEntry(
                    yoga_name=yoga_name,
                    planet=planet,
                    placement_type=placement_type,
                    sign=sign,
                    house=house,
                    strength=round(strength, 2),
                )
            )

    return MahaPurushaYogaOutput(
        timestamp_utc=chart.timestamp_utc,
        ascendant_sign=asc_sign,
        yogas=yogas,
    )


async def tool_get_maha_purusha_yogas(
    input_data: MahaPurushaYogaInput,
) -> MahaPurushaYogaOutput:
    """Tool 15: Detect the 5 Maha Purusha Yogas (Hamsa, Malavya, Sasa, Ruchaka, Bhadra)."""
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
        return _detect_maha_purusha_yogas(chart)
    finally:
        await client.close()


MAHA_PURUSHA_YOGAS_SPEC = ToolSpec(
    name="get_maha_purusha_yogas",
    description="Detect the 5 Maha Purusha Yogas (Hamsa, Malavya, Sasa, Ruchaka, Bhadra) when planets are in own/exaltation sign in a kendra",
    input_schema=MahaPurushaYogaInput,
    output_schema=MahaPurushaYogaOutput,
    cache_ttl_seconds=300,
)
