"""Tools 16-18: Forensic Astrology — Gandanta detection, Nadi Amsha D150,
and D9 spouse verification for birth-time rectification.

Each tool is registered as a ``ToolSpec`` + async handler function
in the central ``ToolRegistry``.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.tools.base import ToolSpec
from app.tools.definitions.ephemeris_tools import (
    ZODIAC_SIGNS,
    _get_sign,
    _get_sign_degree,
    _sidereal_longitude,
)
from app.tools.ephemeris_client import (
    EphemerisClient,
    EphemerisServiceChartResponse,
    EphemerisServiceLocation,
    EphemerisServiceSingleRequest,
)

# ── shared helpers ──────────────────────────────────────────


def _sign_index(sign: str) -> int:
    return ZODIAC_SIGNS.index(sign)


def _build_planet_positions(chart: EphemerisServiceChartResponse) -> dict[str, float]:
    """Build a dict of planet name -> sidereal longitude."""
    positions: dict[str, float] = {}
    for p in chart.planets:
        positions[p.body] = _sidereal_longitude(p.tropical_longitude, chart.ayanamsha)
    return positions


def _calculate_d9_sign(longitude: float) -> str:
    """Calculate Navamsha (D9) sign for a given sidereal longitude."""
    sign_idx = int(longitude / 30) % 12
    deg_in_sign = longitude % 30
    element = sign_idx % 4
    start_signs = [0, 9, 6, 3]  # Aries, Capricorn, Libra, Cancer
    navamsha_num = int(deg_in_sign / 3.3333333)
    d9_sign_idx = (start_signs[element] + navamsha_num) % 12
    return ZODIAC_SIGNS[d9_sign_idx]


# ──────────────────────────────────────────────────────────────
# Tool 16: get_gandanta_analysis
# ──────────────────────────────────────────────────────────────


GANDANTA_POINTS: list[dict[str, Any]] = [
    {
        "longitude": 0.0,
        "from_sign": "Pisces",
        "to_sign": "Aries",
        "type": "Moksha Gandanta",
    },
    {
        "longitude": 120.0,
        "from_sign": "Cancer",
        "to_sign": "Leo",
        "type": "Rajas Gandanta",
    },
    {
        "longitude": 240.0,
        "from_sign": "Scorpio",
        "to_sign": "Sagittarius",
        "type": "Tamas Gandanta",
    },
]


class GandantaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class GandantaOutput(BaseModel):
    timestamp_utc: str
    is_lagna_gandanta: bool
    is_moon_gandanta: bool
    severity: str
    lagna_distance_deg: float
    moon_distance_deg: float
    gandanta_type: str
    interpretation: str
    recommendations: list[str]


def _gandanta_severity(distance: float) -> str:
    if distance < 0.5:
        return "critical"
    if distance < 1.0:
        return "high"
    if distance < 1.5:
        return "moderate"
    if distance < 2.0:
        return "low"
    return "none"


def _detect_gandanta(chart: EphemerisServiceChartResponse) -> GandantaOutput:
    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
    planet_positions = _build_planet_positions(chart)
    moon_lon = planet_positions.get("moon", 0.0)

    min_lagna_dist = float("inf")
    min_moon_dist = float("inf")
    matched_type = ""

    for point in GANDANTA_POINTS:
        lon = point["longitude"]
        # Handle wrap-around at 360/0
        for offset in [lon, lon + 360, lon - 360]:
            ld = abs((asc_sidereal - offset + 180) % 360 - 180)
            md = abs((moon_lon - offset + 180) % 360 - 180)
            if ld < min_lagna_dist:
                min_lagna_dist = ld
                matched_type = point["type"]
            if md < min_moon_dist:
                min_moon_dist = md

    # Re-evaluate matched type based on closest point without wrap ambiguity
    min_lagna_dist = float("inf")
    for point in GANDANTA_POINTS:
        lon = point["longitude"]
        ld = min(
            abs(asc_sidereal - lon),
            abs(asc_sidereal - (lon + 360)),
            abs(asc_sidereal - (lon - 360)),
        )
        if ld < min_lagna_dist:
            min_lagna_dist = ld
            matched_type = point["type"]

    min_moon_dist = float("inf")
    for point in GANDANTA_POINTS:
        lon = point["longitude"]
        md = min(
            abs(moon_lon - lon),
            abs(moon_lon - (lon + 360)),
            abs(moon_lon - (lon - 360)),
        )
        if md < min_moon_dist:
            min_moon_dist = md

    lagna_sev = _gandanta_severity(min_lagna_dist)
    moon_sev = _gandanta_severity(min_moon_dist)

    is_lagna = lagna_sev in {"critical", "high", "moderate", "low"}
    is_moon = moon_sev in {"critical", "high", "moderate", "low"}

    if lagna_sev == "critical" or moon_sev == "critical":
        severity = "critical"
    elif lagna_sev == "high" or moon_sev == "high":
        severity = "high"
    elif lagna_sev == "moderate" or moon_sev == "moderate":
        severity = "moderate"
    elif lagna_sev == "low" or moon_sev == "low":
        severity = "low"
    else:
        severity = "none"

    if is_lagna and is_moon:
        gandanta_type = f"Double Gandanta ({matched_type})"
        interpretation = (
            "Both Lagna and Moon are in Gandanta — a critical karmic configuration indicating "
            "profound life transitions, ancestral karma, and potential early-life instability. "
            "This often points to significant spiritual lessons carried from past lives."
        )
    elif is_lagna:
        gandanta_type = f"Lagna Gandanta ({matched_type})"
        interpretation = (
            "The ascendant is in Gandanta — indicating a soul entering at a precarious karmic threshold. "
            "Life path may involve major shifts in identity, purpose, and direction. "
            "Resilience and spiritual practice are especially important."
        )
    elif is_moon:
        gandanta_type = f"Moon Gandanta ({matched_type})"
        interpretation = (
            "The Moon is in Gandanta — emotional and mental life is colored by deep karmic imprints. "
            "Relationships with mother, emotional security, and mental peace may be areas of growth. "
            "This placement often bestows profound intuition after overcoming initial turbulence."
        )
    else:
        gandanta_type = "No Gandanta"
        interpretation = (
            "Neither Lagna nor Moon are in Gandanta. The birth chart does not show the specific "
            "karmic intensity associated with these fire-water junctions."
        )

    recommendations: list[str] = []
    if severity == "critical":
        recommendations = [
            "Immediate birth-time rectification is strongly advised.",
            "Consider Gandanta Shanti rituals and ancestral offerings (Tarpan).",
            "Regular meditation and connection with water bodies for emotional balance.",
            "Consult an experienced Jyotishi for personalized remedial measures.",
        ]
    elif severity == "high":
        recommendations = [
            "Birth-time verification recommended to confirm exact Gandanta status.",
            "Gandanta-related prayers and mantras for the ruling planet of the junction.",
            "Charity and service related to the elements involved (water and fire).",
        ]
    elif severity in {"moderate", "low"}:
        recommendations = [
            "Monitor transits over Gandanta points for life transitions.",
            "Strengthen the lagna and Moon lords through appropriate practices.",
        ]
    else:
        recommendations = ["No specific Gandanta remedial measures required."]

    return GandantaOutput(
        timestamp_utc=chart.timestamp_utc,
        is_lagna_gandanta=is_lagna,
        is_moon_gandanta=is_moon,
        severity=severity,
        lagna_distance_deg=round(min_lagna_dist, 4),
        moon_distance_deg=round(min_moon_dist, 4),
        gandanta_type=gandanta_type,
        interpretation=interpretation,
        recommendations=recommendations,
    )


async def tool_get_gandanta_analysis(input_data: GandantaInput) -> GandantaOutput:
    """Tool 16: Detect Gandanta (karmic knot) at fire-water junctions."""
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
        return _detect_gandanta(chart)
    finally:
        await client.close()


GANDANTA_SPEC = ToolSpec(
    name="get_gandanta_analysis",
    description="Detect Gandanta (karmic knot) status for Lagna and Moon at fire-water sign junctions",
    input_schema=GandantaInput,
    output_schema=GandantaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 17: get_nadi_amsha_d150
# ──────────────────────────────────────────────────────────────

NADI_DEITIES: list[str] = [
    # 1-30: Primary Deities
    "Agni",
    "Brahma",
    "Vishnu",
    "Shiva",
    "Indra",
    "Soma",
    "Surya",
    "Yama",
    "Varuna",
    "Vayu",
    "Kubera",
    "Saraswati",
    "Lakshmi",
    "Parvati",
    "Ganesha",
    "Kartikeya",
    "Hanuman",
    "Durga",
    "Kali",
    "Chandra",
    "Mangala",
    "Budha",
    "Guru",
    "Shukra",
    "Shani",
    "Rahu",
    "Ketu",
    "Ashwini",
    "Bharani",
    "Krittika",
    # 31-60: Rishis
    "Vashishtha",
    "Vishwamitra",
    "Bhrigu",
    "Angiras",
    "Atri",
    "Pulastya",
    "Pulaha",
    "Kratu",
    "Marichi",
    "Narada",
    "Daksha",
    "Kashyapa",
    "Shukracharya",
    "Brihaspati",
    "Shanideva",
    "Yamaraja",
    "Varunadeva",
    "Vayudeva",
    "Agnideva",
    "Indradeva",
    "Kuberadeva",
    "Chandradeva",
    "Suryadeva",
    "Ashwinikumarau",
    "Dhanvantari",
    "Garuda",
    "Shesha",
    "Vasuki",
    "Takshaka",
    "Ananta",
    # 61-90: Shakti Forms
    "Gauri",
    "Uma",
    "Ambika",
    "Chandi",
    "Chamunda",
    "Bhadrakali",
    "Mahakali",
    "Mahalakshmi",
    "Mahasaraswati",
    "Annapurna",
    "Lalita",
    "Tripura",
    "Bhuvaneshwari",
    "Matangi",
    "Kamala",
    "Tara",
    "Shodashi",
    "Bhairavi",
    "Chinnamasta",
    "Dhumavati",
    "Bagalamukhi",
    "Kamakhya",
    "Narmada",
    "Godavari",
    "Kaveri",
    "Yamuna",
    "Ganga",
    "Saraswati",
    "Sindhu",
    "Brahmaputra",
    # 91-120: Celestial Beings
    "Deva",
    "Asura",
    "Gandharva",
    "Kinnara",
    "Yaksha",
    "Rakshasa",
    "Pishacha",
    "Pretaraja",
    "Nagadeva",
    "Garudadeva",
    "Vidyadhara",
    "Siddha",
    "Charana",
    "Apsara",
    "Urvashi",
    "Rambha",
    "Menaka",
    "Tilottama",
    "Ghritachi",
    "Vishwachi",
    "Purvachitti",
    "Swayamprabha",
    "Hemavati",
    "Chitralekha",
    "Ratnavali",
    "Madhura",
    "Vasanta",
    "Grishma",
    "Varsha",
    "Sharada",
    # 121-150: Cosmic Guardians
    "Lokapala",
    "Dikpala",
    "Kshetrapala",
    "Gramadevata",
    "Kuladevata",
    "Ishtadevata",
    "Pitrideva",
    "Matrideva",
    "Gurudeva",
    "Shikshaka",
    "Rakshaka",
    "Palaka",
    "Srishtikarta",
    "Samharaka",
    "Anugrahaka",
    "Nigrahaka",
    "Prakasha",
    "Vimarsha",
    "Ananda",
    "Jnana",
    "Bala",
    "Virya",
    "Teja",
    "Kshama",
    "Daya",
    "Maitri",
    "Karuna",
    "Mudita",
    "Upeksha",
    "Shanti",
]

NADI_PHALAS: list[str] = [
    "Wealth and prosperity through righteous means",
    "Spiritual knowledge and mastery of scriptures",
    "Victory over enemies and obstacles",
    "Long life and good health",
    "Leadership and royal favor",
    "Happiness from children and family",
    "Fame and recognition in society",
    "Wisdom and intellectual prowess",
    "Artistic talent and creative success",
    "Courage and military achievement",
    "Charitable nature and religious merit",
    "Beauty and happiness in relationships",
    "Power and authority over others",
    "Learning and teaching abilities",
    "Travel and foreign connections",
    "Stability and landed property",
    "Devotion and spiritual progress",
    "Healing and medical knowledge",
    "Skill in trade and commerce",
    "Strength and athletic achievement",
    "Ministerial or advisory position",
    "Success in agriculture and farming",
    "Musical and poetic talent",
    "Diplomacy and negotiation skills",
    "Penance and ascetic achievement",
    "Wealth through inheritance",
    "Protection from dangers",
    "Success in competition and debate",
    "Happiness from siblings",
    "Mastery over languages and communication",
]


def _get_nadi_canonical(sign_idx: int, nadi_index: int) -> int:
    """Compute canonical nadi number (1-150) based on sign modality."""
    modality = sign_idx % 3
    if modality == 0:  # movable
        return nadi_index + 1
    if modality == 1:  # fixed
        return 150 - nadi_index
    # dual
    return ((nadi_index + 74) % 150) + 1


def _get_kala_quarter(degree_in_nadi: float) -> str:
    """Return Varna/Kala quarter within a nadi (0.2 deg span)."""
    fraction = degree_in_nadi / 0.2
    if fraction < 0.25:
        return "Vipra"
    if fraction < 0.5:
        return "Kshatriya"
    if fraction < 0.75:
        return "Vaisya"
    return "Sudra"


def _get_karmic_significance(canonical: int) -> str:
    ranges = [
        (1, 25, "Past life karma — deep-rooted patterns from previous incarnations"),
        (26, 50, "Family lineage — ancestral inheritance and bloodline karma"),
        (51, 75, "Present life purpose — soul mission and dharma in this birth"),
        (76, 100, "Relationship karma — partnerships, marriage, and social bonds"),
        (101, 125, "Career and material karma — profession, status, and wealth"),
        (126, 150, "Spiritual destiny — liberation, moksha, and final evolution"),
    ]
    for start, end, meaning in ranges:
        if start <= canonical <= end:
            return meaning
    return "General karmic unfolding"


class NadiAmshaPlanetEntry(BaseModel):
    planet: str
    nadi_index: int
    canonical_nadi: int
    sign: str
    degree_in_sign: float
    deity: str
    phala: str
    kala: str
    karmic_significance: str


class NadiAmshaInput(BaseModel):
    timestamp_utc: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"


class NadiAmshaOutput(BaseModel):
    timestamp_utc: str
    ascendant_sign: str
    planets: list[NadiAmshaPlanetEntry]
    deity_table: list[str]


def _calculate_nadi_amsha(chart: EphemerisServiceChartResponse) -> NadiAmshaOutput:
    asc_sidereal = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
    asc_sign = _get_sign(asc_sidereal)
    planet_positions = _build_planet_positions(chart)

    entries: list[NadiAmshaPlanetEntry] = []
    for planet, lon in planet_positions.items():
        sign = _get_sign(lon)
        sign_idx = _sign_index(sign)
        deg_in_sign = _get_sign_degree(lon)
        nadi_idx = int(deg_in_sign / 0.2)  # 0-149
        canonical = _get_nadi_canonical(sign_idx, nadi_idx)
        deity = NADI_DEITIES[canonical - 1]
        phala = NADI_PHALAS[(canonical - 1) % 30]
        degree_in_nadi = deg_in_sign % 0.2
        kala = _get_kala_quarter(degree_in_nadi)
        karmic = _get_karmic_significance(canonical)

        entries.append(
            NadiAmshaPlanetEntry(
                planet=planet,
                nadi_index=nadi_idx + 1,
                canonical_nadi=canonical,
                sign=sign,
                degree_in_sign=round(deg_in_sign, 6),
                deity=deity,
                phala=phala,
                kala=kala,
                karmic_significance=karmic,
            )
        )

    return NadiAmshaOutput(
        timestamp_utc=chart.timestamp_utc,
        ascendant_sign=asc_sign,
        planets=entries,
        deity_table=NADI_DEITIES,
    )


async def tool_get_nadi_amsha_d150(input_data: NadiAmshaInput) -> NadiAmshaOutput:
    """Tool 17: Calculate D150 Nadi Amsha for all planets with deity/phala tables."""
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
        return _calculate_nadi_amsha(chart)
    finally:
        await client.close()


NADI_AMSHA_D150_SPEC = ToolSpec(
    name="get_nadi_amsha_d150",
    description="Calculate D150 Nadi Amsha division for all planets with 150-deity lookup table and phala interpretation",
    input_schema=NadiAmshaInput,
    output_schema=NadiAmshaOutput,
    cache_ttl_seconds=300,
)


# ──────────────────────────────────────────────────────────────
# Tool 18: get_spouse_d9_verification
# ──────────────────────────────────────────────────────────────


class SpousePositionInput(BaseModel):
    """Pre-calculated spouse chart positions (alternative to fetching)."""

    lagna_longitude: float | None = None
    moon_longitude: float | None = None
    venus_longitude: float | None = None
    jupiter_longitude: float | None = None


class SpouseD9VerificationInput(BaseModel):
    native_timestamp_utc: str = Field(..., description="Native birth time ISO 8601 UTC")
    native_latitude: float = Field(..., ge=-90, le=90)
    native_longitude: float = Field(..., ge=-180, le=180)
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"
    # Spouse data: either pre-calculated positions OR timestamp+location
    spouse_positions: SpousePositionInput | None = None
    spouse_timestamp_utc: str | None = Field(
        default=None, description="Spouse birth time ISO 8601 UTC"
    )
    spouse_latitude: float | None = Field(default=None, ge=-90, le=90)
    spouse_longitude: float | None = Field(default=None, ge=-180, le=180)


class SpouseD9Check(BaseModel):
    check_name: str
    native_sign: str
    spouse_sign: str
    score: float
    max_score: float
    weight: float
    interpretation: str


class SpouseD9VerificationOutput(BaseModel):
    native_timestamp_utc: str
    spouse_timestamp_utc: str | None
    total_score: float
    max_possible_score: float
    percentage: float
    confidence_level: str
    verification_result: str
    checks: list[SpouseD9Check]
    critical_mismatches: list[str]


def _same_element(sign1: str, sign2: str) -> bool:
    return (_sign_index(sign1) % 4) == (_sign_index(sign2) % 4)


def _same_trine(sign1: str, sign2: str) -> bool:
    diff = abs(_sign_index(sign1) - _sign_index(sign2)) % 12
    return diff in {4, 8}


def _same_sign(sign1: str, sign2: str) -> bool:
    return sign1 == sign2


def _opposite_sign(sign1: str, sign2: str) -> bool:
    diff = abs(_sign_index(sign1) - _sign_index(sign2)) % 12
    return diff == 6


async def _get_spouse_positions(
    input_data: SpouseD9VerificationInput,
) -> dict[str, float]:
    """Return spouse positions either from provided data or by fetching chart."""
    if input_data.spouse_positions is not None:
        pos = input_data.spouse_positions
        result: dict[str, float] = {}
        if pos.lagna_longitude is not None:
            result["lagna"] = pos.lagna_longitude
        if pos.moon_longitude is not None:
            result["moon"] = pos.moon_longitude
        if pos.venus_longitude is not None:
            result["venus"] = pos.venus_longitude
        if pos.jupiter_longitude is not None:
            result["jupiter"] = pos.jupiter_longitude
        return result

    if input_data.spouse_timestamp_utc is None:
        msg = "Either spouse_positions or spouse_timestamp_utc must be provided"
        raise ValueError(msg)

    client = EphemerisClient()
    try:
        request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.spouse_latitude or 0.0,
                longitude=input_data.spouse_longitude or 0.0,
            ),
            ayanamsha_mode=input_data.ayanamsha_mode,
            house_system=input_data.house_system,
            timestamp_utc=input_data.spouse_timestamp_utc,
        )
        chart = await client.fetch_chart(request)
        positions: dict[str, float] = {}
        asc = _sidereal_longitude(chart.houses.ascendant_tropical, chart.ayanamsha)
        positions["lagna"] = asc
        for p in chart.planets:
            positions[p.body] = _sidereal_longitude(
                p.tropical_longitude, chart.ayanamsha
            )
        return positions
    finally:
        await client.close()


def _run_d9_verification(
    native_chart: EphemerisServiceChartResponse,
    spouse_positions: dict[str, float],
    spouse_timestamp: str | None,
) -> SpouseD9VerificationOutput:
    native_positions = _build_planet_positions(native_chart)
    native_asc = _sidereal_longitude(
        native_chart.houses.ascendant_tropical, native_chart.ayanamsha
    )

    # Native D9 positions
    native_d9_lagna = _calculate_d9_sign(native_asc)
    native_d9_7th = ZODIAC_SIGNS[(_sign_index(native_d9_lagna) + 6) % 12]
    native_d9_moon = _calculate_d9_sign(native_positions.get("moon", 0.0))
    native_d9_venus = _calculate_d9_sign(native_positions.get("venus", 0.0))
    native_d9_jupiter = _calculate_d9_sign(native_positions.get("jupiter", 0.0))

    # Spouse positions
    spouse_lagna_sign = _get_sign(spouse_positions.get("lagna", 0.0))
    spouse_moon_sign = _get_sign(spouse_positions.get("moon", 0.0))
    spouse_venus_sign = _get_sign(spouse_positions.get("venus", 0.0))
    spouse_jupiter_sign = _get_sign(spouse_positions.get("jupiter", 0.0))

    # Spouse D9 positions (if lagna available in spouse data)
    spouse_d9_lagna: str | None = None
    if "lagna" in spouse_positions:
        spouse_d9_lagna = _calculate_d9_sign(spouse_positions["lagna"])

    checks: list[SpouseD9Check] = []
    critical_mismatches: list[str] = []
    total_score = 0.0
    total_weight = 0.0

    def _add_check(
        name: str,
        native_s: str,
        spouse_s: str,
        exact_pts: float,
        trine_pts: float,
        element_pts: float,
        weight: float,
    ) -> None:
        nonlocal total_score, total_weight
        total_weight += weight
        if _same_sign(native_s, spouse_s):
            score = exact_pts
            interp = f"Exact match: {native_s} — strong compatibility"
        elif _same_trine(native_s, spouse_s):
            score = trine_pts
            interp = f"Trine relationship: {native_s} and {spouse_s} — harmonious"
        elif element_pts > 0 and _same_element(native_s, spouse_s):
            score = element_pts
            interp = f"Same element: {native_s} and {spouse_s} — compatible"
        else:
            score = 0.0
            interp = f"Mismatch: {native_s} vs {spouse_s} — tension possible"
            if _opposite_sign(native_s, spouse_s):
                critical_mismatches.append(
                    f"{name}: opposite signs ({native_s} vs {spouse_s})"
                )

        total_score += score * weight
        checks.append(
            SpouseD9Check(
                check_name=name,
                native_sign=native_s,
                spouse_sign=spouse_s,
                score=round(score, 2),
                max_score=exact_pts,
                weight=weight,
                interpretation=interp,
            )
        )

    # a) Native D9 7th vs spouse Lagna (weight 3)
    _add_check(
        "Native D9 7th vs Spouse Lagna",
        native_d9_7th,
        spouse_lagna_sign,
        exact_pts=3.0,
        trine_pts=1.5,
        element_pts=1.0,
        weight=1.0,
    )

    # b) Native D9 7th vs spouse Moon (weight 2.5)
    _add_check(
        "Native D9 7th vs Spouse Moon",
        native_d9_7th,
        spouse_moon_sign,
        exact_pts=2.5,
        trine_pts=0.0,
        element_pts=0.0,
        weight=1.0,
    )

    # c) Native D9 Moon vs spouse Moon (weight 2)
    _add_check(
        "Native D9 Moon vs Spouse Moon",
        native_d9_moon,
        spouse_moon_sign,
        exact_pts=2.0,
        trine_pts=1.2,
        element_pts=0.0,
        weight=1.0,
    )

    # d) Native D9 Venus vs spouse Venus (weight 1.5)
    _add_check(
        "Native D9 Venus vs Spouse Venus",
        native_d9_venus,
        spouse_venus_sign,
        exact_pts=1.5,
        trine_pts=0.0,
        element_pts=0.8,
        weight=1.0,
    )

    # e) Native D9 Jupiter vs spouse Jupiter (weight 1)
    _add_check(
        "Native D9 Jupiter vs Spouse Jupiter",
        native_d9_jupiter,
        spouse_jupiter_sign,
        exact_pts=1.0,
        trine_pts=0.0,
        element_pts=0.0,
        weight=1.0,
    )

    # f) Native D9 Lagna vs Spouse D9 Lagna (weight 2.5) — only if spouse D9 available
    if spouse_d9_lagna is not None:
        _add_check(
            "Native D9 Lagna vs Spouse D9 Lagna",
            native_d9_lagna,
            spouse_d9_lagna,
            exact_pts=2.5,
            trine_pts=1.8,
            element_pts=0.0,
            weight=1.0,
        )

    max_possible = sum(c.max_score * c.weight for c in checks)
    percentage = (total_score / max_possible * 100) if max_possible > 0 else 0.0

    if percentage >= 80:
        confidence = "very_high"
        result_text = (
            "Excellent compatibility — birth times strongly corroborate each other."
        )
    elif percentage >= 60:
        confidence = "high"
        result_text = (
            "Good compatibility — birth times are likely accurate and well-matched."
        )
    elif percentage >= 40:
        confidence = "moderate"
        result_text = "Moderate compatibility — some discrepancy may warrant review."
    elif percentage >= 20:
        confidence = "low"
        result_text = "Low compatibility — significant mismatch suggests possible birth-time error."
    else:
        confidence = "very_low"
        result_text = "Poor compatibility — birth times likely inconsistent; rectification strongly advised."

    return SpouseD9VerificationOutput(
        native_timestamp_utc=native_chart.timestamp_utc,
        spouse_timestamp_utc=spouse_timestamp,
        total_score=round(total_score, 2),
        max_possible_score=round(max_possible, 2),
        percentage=round(percentage, 2),
        confidence_level=confidence,
        verification_result=result_text,
        checks=checks,
        critical_mismatches=critical_mismatches,
    )


async def tool_get_spouse_d9_verification(
    input_data: SpouseD9VerificationInput,
) -> SpouseD9VerificationOutput:
    """Tool 18: Verify birth time through D9 synastry with spouse chart."""
    native_client = EphemerisClient()
    try:
        native_request = EphemerisServiceSingleRequest(
            location=EphemerisServiceLocation(
                latitude=input_data.native_latitude,
                longitude=input_data.native_longitude,
            ),
            ayanamsha_mode=input_data.ayanamsha_mode,
            house_system=input_data.house_system,
            timestamp_utc=input_data.native_timestamp_utc,
        )
        native_chart = await native_client.fetch_chart(native_request)
    finally:
        await native_client.close()

    spouse_positions = await _get_spouse_positions(input_data)
    return _run_d9_verification(
        native_chart,
        spouse_positions,
        input_data.spouse_timestamp_utc,
    )


SPOUSE_D9_VERIFICATION_SPEC = ToolSpec(
    name="get_spouse_d9_verification",
    description="Verify native birth time through D9 Navamsha synastry with spouse chart positions",
    input_schema=SpouseD9VerificationInput,
    output_schema=SpouseD9VerificationOutput,
    cache_ttl_seconds=300,
)
