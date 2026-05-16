"""BTR (Birth Time Rectification) core astrological types.

Ported from ai-pandit-app/packages/shared/src/btr-types.ts
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class ZodiacSign(StrEnum):
    ARIES = "Aries"
    TAURUS = "Taurus"
    GEMINI = "Gemini"
    CANCER = "Cancer"
    LEO = "Leo"
    VIRGO = "Virgo"
    LIBRA = "Libra"
    SCORPIO = "Scorpio"
    SAGITTARIUS = "Sagittarius"
    CAPRICORN = "Capricorn"
    AQUARIUS = "Aquarius"
    PISCES = "Pisces"


ZODIAC_SIGNS: list[str] = [s.value for s in ZodiacSign]


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


TATWA_SEQUENCE: list[str] = ["prithvi", "jala", "agni", "vayu", "akasha"]


class TatwaType(StrEnum):
    PRITHVI = "prithvi"
    JALA = "jala"
    AGNI = "agni"
    VAYU = "vayu"
    AKASHA = "akasha"


class DoshaType(StrEnum):
    VATA = "vata"
    PITTA = "pitta"
    KAPHA = "kapha"


class ConfidenceLevel(StrEnum):
    GOD_TIER = "GOD_TIER"
    STANDARD_PRECISION = "STANDARD_PRECISION"
    VERY_HIGH = "VERY_HIGH"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class EventSource(StrEnum):
    DOCUMENT = "document"
    MEMORY = "memory"
    APPROXIMATE = "approximate"
    CALCULATED = "calculated"


TATWA_ELEMENTS: dict[TatwaType, str] = {
    TatwaType.PRITHVI: "Earth",
    TatwaType.JALA: "Water",
    TatwaType.AGNI: "Fire",
    TatwaType.VAYU: "Air",
    TatwaType.AKASHA: "Ether",
}

TATWA_DOSHA_MAP: dict[TatwaType, list[DoshaType]] = {
    TatwaType.PRITHVI: [DoshaType.KAPHA],
    TatwaType.JALA: [DoshaType.KAPHA, DoshaType.PITTA],
    TatwaType.AGNI: [DoshaType.PITTA],
    TatwaType.VAYU: [DoshaType.VATA],
    TatwaType.AKASHA: [DoshaType.VATA, DoshaType.KAPHA],
}

TATWA_DURATIONS_MINUTES: int = 26

PARASHARI_ASPECTS: dict[str, list[int]] = {
    "sun": [7],
    "moon": [7],
    "mars": [4, 7, 8],
    "mercury": [7],
    "jupiter": [5, 7, 9],
    "venus": [7],
    "saturn": [3, 7, 10],
    "rahu": [5, 7, 9],
    "ketu": [5, 7, 9],
}

EVENT_WEIGHTS: dict[str, dict[str, float]] = {
    "high": {"weight": 3.0, "reliabilityBase": 0.95},
    "medium": {"weight": 1.5, "reliabilityBase": 0.70},
    "low": {"weight": 0.5, "reliabilityBase": 0.40},
}

DATE_PRECISION_MULTIPLIERS: dict[str, float] = {
    "exact_date_time": 1.0,
    "exact_date": 0.95,
    "date_range": 0.75,
    "month_year": 0.8,
    "month_range": 0.65,
    "year_range": 0.5,
}

SOURCE_MULTIPLIERS: dict[str, float] = {
    "document": 1.3,
    "memory": 1.0,
    "approximate": 0.7,
    "calculated": 0.9,
}

DATE_PRECISION_WEIGHTS: dict[str, float] = {
    "exact_date_time": 1.0,
    "exact_date": 0.9,
    "date_range": 0.7,
    "month_year": 0.5,
    "month_range": 0.3,
    "year_range": 0.1,
}

EVENT_HOUSE_MAP: dict[str, int] = {
    "marriage": 7,
    "career": 10,
    "education": 4,
    "children": 5,
    "health": 6,
    "financial": 2,
    "finance": 2,
    "travel": 9,
    "property": 4,
    "spiritual": 9,
    "legal": 6,
    "family": 2,
    "relocation": 3,
    "accident": 8,
    "death_relative": 8,
    "public_life": 10,
    "karmic_events": 8,
    "identity_shifts": 1,
    "promotion": 10,
    "business": 7,
    "divorce": 7,
    "surgery": 6,
    "inheritance": 8,
    "awards": 11,
    "other": 1,
    "sanskars": 1,
    "childhood": 4,
    "adolescent": 4,
    "teen": 4,
    "btr_markers": 1,
}

EVENT_SIGNIFICATORS: dict[str, list[str]] = {
    "marriage": ["Venus", "Jupiter", "Moon", "7th Lord"],
    "career": ["Saturn", "Sun", "Jupiter", "Mercury", "10th Lord"],
    "education": ["Mercury", "Jupiter", "Moon", "4th Lord"],
    "children": ["Jupiter", "Venus", "Moon", "5th Lord"],
    "health": ["Sun", "Moon", "Mars", "Saturn", "6th Lord"],
    "financial": ["Jupiter", "Venus", "Mercury", "2nd Lord"],
    "finance": ["Jupiter", "Venus", "Mercury", "2nd Lord"],
    "travel": ["Moon", "Rahu", "Ketu", "9th Lord", "12th Lord"],
    "property": ["Mars", "Saturn", "Venus", "4th Lord"],
    "spiritual": ["Jupiter", "Ketu", "Saturn", "9th Lord"],
    "legal": ["Mars", "Jupiter", "Saturn", "6th Lord"],
    "family": ["Moon", "Jupiter", "Venus", "2nd Lord"],
    "relocation": ["Moon", "Rahu", "3rd Lord", "9th Lord"],
    "accident": ["Mars", "Saturn", "Rahu", "8th Lord"],
    "death_relative": ["Saturn", "Rahu", "Ketu", "8th Lord"],
    "public_life": ["Sun", "Jupiter", "Mercury", "10th Lord", "11th Lord"],
    "karmic_events": ["Saturn", "Ketu", "8th Lord", "12th Lord"],
    "identity_shifts": ["Sun", "Moon", "1st Lord"],
    "promotion": ["Sun", "Jupiter", "Mercury", "10th Lord"],
    "business": ["Mercury", "Venus", "7th Lord"],
    "divorce": ["Mars", "Rahu", "Saturn", "6th Lord", "7th Lord"],
    "surgery": ["Mars", "Rahu", "Saturn", "6th Lord", "8th Lord"],
    "inheritance": ["Jupiter", "Saturn", "8th Lord"],
    "awards": ["Jupiter", "Venus", "Sun", "11th Lord"],
    "other": [],
    "sanskars": ["Moon", "Jupiter", "Sun", "1st Lord"],
    "childhood": ["Moon", "Mercury", "Jupiter", "4th Lord"],
    "adolescent": ["Mercury", "Mars", "Venus", "4th Lord", "9th Lord"],
    "teen": ["Mercury", "Mars", "Venus", "4th Lord", "9th Lord"],
    "btr_markers": ["Moon", "Saturn", "Jupiter", "Ketu", "1st Lord"],
}

EVENT_SPECIFIC_SIGNIFICATORS: dict[str, list[str]] = {
    "marriage": ["Venus", "Jupiter", "Moon", "7th Lord"],
    "engagement": ["Venus", "Mercury", "7th Lord"],
    "suhaag_raat": ["Venus", "Moon", "7th Lord"],
    "first_meeting_spouse": ["Venus", "Rahu", "7th Lord"],
    "divorce": ["Mars", "Rahu", "Saturn", "6th Lord"],
    "separation": ["Saturn", "Rahu", "6th Lord"],
    "second_marriage": ["Venus", "Jupiter", "8th Lord"],
    "first_job": ["Saturn", "Sun", "Mercury", "10th Lord"],
    "government_job": ["Sun", "Saturn", "10th Lord"],
    "job_promotion": ["Jupiter", "Sun", "Mercury", "10th Lord"],
    "job_loss": ["Mars", "Saturn", "Rahu", "10th Lord"],
    "job_change": ["Mercury", "Rahu", "3rd Lord"],
    "business_started": ["Mercury", "Sun", "Mars", "7th Lord", "10th Lord"],
    "business_loss": ["Saturn", "Mars", "Rahu", "7th Lord"],
    "freelancing_start": ["Mercury", "Rahu", "3rd Lord"],
    "retirement": ["Saturn", "Jupiter", "12th Lord"],
    "graduation_complete": ["Jupiter", "Mercury", "4th Lord", "9th Lord"],
    "board_10th": ["Mercury", "Jupiter", "4th Lord"],
    "board_12th": ["Mercury", "Jupiter", "9th Lord"],
    "study_abroad": ["Rahu", "Jupiter", "9th Lord", "12th Lord"],
    "competitive_exam": ["Mars", "Mercury", "Jupiter", "6th Lord"],
    "surgery": ["Mars", "Rahu", "Saturn", "6th Lord", "8th Lord"],
    "childhood_illness": ["Moon", "Mars", "6th Lord"],
    "accident": ["Mars", "Saturn", "Rahu", "8th Lord"],
    "childhood_accident": ["Mars", "Rahu", "8th Lord"],
    "first_child_birth": ["Jupiter", "Venus", "Moon", "5th Lord"],
    "second_child_birth": ["Jupiter", "Venus", "5th Lord"],
    "menarche": ["Moon", "Venus", "Mars", "6th Lord"],
    "first_income": ["Saturn", "Sun", "2nd Lord"],
    "sudden_wealth": ["Jupiter", "Rahu", "5th Lord", "11th Lord"],
    "inheritance": ["Jupiter", "Saturn", "8th Lord"],
    "work_abroad": ["Rahu", "Saturn", "9th Lord", "12th Lord"],
    "first_foreign_travel": ["Rahu", "Ketu", "9th Lord", "12th Lord"],
    "relocation": ["Moon", "Rahu", "Mars", "3rd Lord", "4th Lord"],
    "upanayana": ["Jupiter", "Sun", "Mercury", "1st Lord"],
    "vivaha": ["Venus", "Jupiter", "Moon", "7th Lord"],
    "sanyasa": ["Saturn", "Ketu", "Jupiter", "12th Lord"],
    "namkaran": ["Moon", "Mercury", "1st Lord"],
    "mundan": ["Mars", "Saturn", "1st Lord", "8th Lord"],
    "annaprashan": ["Moon", "Jupiter", "2nd Lord"],
    "first_love": ["Venus", "Moon", "5th Lord"],
    "first_heartbreak": ["Venus", "Rahu", "5th Lord"],
    "live_in_start": ["Venus", "Mars", "3rd Lord"],
    "name_change": ["Mercury", "Sun", "1st Lord"],
    "identity_shifts": ["Sun", "Moon", "Rahu", "1st Lord"],
    "dasha_change": ["Moon", "Saturn"],
    "jupiter_return": ["Jupiter"],
    "saturn_return": ["Saturn"],
    "sade_sati_start": ["Saturn", "Moon"],
    "near_death": ["Mars", "Saturn", "Ketu", "8th Lord"],
    "spiritual_awakening": ["Ketu", "Jupiter", "9th Lord", "12th Lord"],
    "sudden_opportunity": ["Rahu", "Jupiter", "5th Lord", "9th Lord"],
    "legal_victory": ["Jupiter", "Mars", "Sun", "6th Lord"],
    "legal_defeat": ["Saturn", "Mars", "Rahu", "6th Lord"],
}

DEFAULT_SCAN_CONFIG: dict[str, int | bool | float] = {
    "maxCandidates": 100,
    "minConsensusScore": 50,
    "parallelProcessing": True,
    "cacheEphemeris": True,
    "eventWeightThreshold": 0.3,
}


class KalachakraPeriod(BaseModel):
    sign: str
    sign_index: int
    start_date: str
    end_date: str
    duration_years: float
    lord: str
    kalachakra_type: str


class PakshiData(BaseModel):
    name: str
    sanskrit_name: str
    element: str
    ruling_hours: list[int]
    qualities: list[str]
    dominant_activities: list[str]
    weak_activities: list[str]


class PakshiAnalysis(BaseModel):
    ruling_bird: PakshiData
    secondary_bird: PakshiData | None = None
    bird_strength: str
    birth_time_quality: str
    activity_strengths: list[str]
    activity_weaknesses: list[str]
    personality_traits: list[str]
    verification_notes: str


class ShadbalaBreakdown(BaseModel):
    total: float = 0
    sthana: float = 0
    dig: float = 0
    kaala: float = 0
    cheshta: float | None = None


class PlanetData(BaseModel):
    longitude: float | None = None
    sign: str
    degree: str
    nakshatra: str | None = None
    house: int | None = None
    dignity: str | None = None
    is_retro: bool = False
    speed: float = 0
    is_combust: bool = False
    shadbala: float | None = None
    bav: int | None = None
    functional_nature: dict[str, str] | None = None
    aspects: list[Any] | None = None
    avastha: str | None = None
    d60_deity: str | None = None
    compound_dignity: str | None = None
    shadbala_breakdown: ShadbalaBreakdown | None = None
    ishta_kashta_phala: dict[str, float] | None = None


class SpecialPoint(BaseModel):
    sign: str
    degree: str
    house: int


class VimshottariDashaEntry(BaseModel):
    maha: str
    antar: str
    pratyantar: str
    sukshma: str | None = None
    prana: str | None = None
    start_end: str


class CharaKaraka(BaseModel):
    karaka_name: str
    planet: str
    degree: float


class DivisionalChartData(BaseModel):
    ascendant: str
    planets: dict[str, str]


class PanchangaData(BaseModel):
    tithi: str
    vara: str
    nakshatra: str
    yoga: str
    karana: str


class SpouseMatch(BaseModel):
    lagna_match: bool
    moon_match: bool
    score: float
    reason: str


class D60PlanetData(BaseModel):
    sign: str
    degree: str
    deity: str


class Yoga(BaseModel):
    name: str
    description: str
    significance: str
    planets_involved: list[str]


class VedicSignals(BaseModel):
    vargottama: list[str] | None = None
    parivartana: list[dict[str, list[int]]] | None = None
    pushkar: list[str] | None = None
    chara_karakas: list[CharaKaraka] | None = None
    tatwa: dict[str, Any] | None = None
    kunda_lagna: dict[str, Any] | None = None


class KpSubLordLevel(BaseModel):
    star_lord: str
    sub_lord: str
    sub_sub_lord: str
    sub_sub_sub_lord: str | None = None


class KpCuspalSubLord(BaseModel):
    house: int
    cusp: float
    sign: str
    star_lord: str
    sub_lord: str
    sub_sub_lord: str
    sub_sub_sub_lord: str | None = None


class KpData(BaseModel):
    planet_sub_lords: dict[str, KpSubLordLevel] | None = None
    cuspal_sub_lords: dict[int, KpCuspalSubLord] | None = None


class Consensus(BaseModel):
    overall_consensus: float = 0
    confidence_level: str = "LOW"
    margin_of_error: float = 0
    red_flags: dict[str, bool] | None = None


class PrecisionData(BaseModel):
    kp_sub_lords: dict[str, KpSubLordLevel] | None = None
    cuspal_sub_lords: dict[int, KpCuspalSubLord] | None = None
    consensus: Consensus | None = None


class Ascendant(BaseModel):
    sign: str
    degree: str
    nakshatra: str | None = None
    longitude: float | None = None


class TransitDataEntry(BaseModel):
    dasha: str
    signatures: list[str]
    planets: dict[str, str]
    double_transit: dict[str, Any]


class DoubleTransitAnalysis(BaseModel):
    is_triggered: bool
    details: list[dict[str, Any]]


class LifecycleShift(BaseModel):
    date: str
    event: str
    dasha: str


class CandidateDataPackage(BaseModel):
    time: str
    offset_minutes: int
    candidate_date: str | None = None
    day_offset: int | None = None
    candidate_key: str | None = None
    planets: dict[str, PlanetData]
    special_points: dict[str, SpecialPoint] | None = None
    ascendant: Ascendant
    house_lords: dict[str, str]
    moon_nakshatra: str
    ayanamsa: float | None = None
    vimshottari_dasha: list[VimshottariDashaEntry]
    yogini_dasha: list[dict[str, str]] | None = None
    chara_dasha: list[dict[str, str]] | None = None
    d9_lagna: str | None = None
    d10_lagna: str | None = None
    d60_sign: str | None = None
    d150_sign: str | None = None
    d9_chart: DivisionalChartData | None = None
    d10_chart: DivisionalChartData | None = None
    d150_chart: DivisionalChartData | None = None
    ashtakavarga: dict[str, float] | None = None
    panchanga: PanchangaData | None = None
    yogas: list[Yoga] | None = None
    double_transit_analysis: dict[str, DoubleTransitAnalysis] | None = None
    lifecycle_shifts: list[LifecycleShift] | None = None
    transit_data: dict[str, TransitDataEntry] | None = None
    ai_score: float | None = None
    ai_verdict: str | None = None
    raw_vimshottari: list[Any] | None = None
    vedic_signals: VedicSignals | None = None
    chara_karakas: list[CharaKaraka] | None = None
    vimsopaka_bala: dict[str, float] | None = None
    chalit_discrepancies: list[dict[str, Any]] | None = None
    ishta_kashta_phala: dict[str, dict[str, float]] | None = None
    varga_degrees: dict[str, dict[str, str]] | None = None
    d60_planets: dict[str, D60PlanetData] | None = None
    sandhi_zones: list[str] | None = None
    spouse_match: SpouseMatch | None = None
    kalachakra_dasha: list[KalachakraPeriod] | None = None
    nadi_data: dict[str, Any] | None = None
    nadi_analysis: list[dict[str, Any]] | None = None
    spouse_d9_verification: dict[str, Any] | None = None
    gandanta_analysis: dict[str, Any] | None = None
    pakshi_analysis: PakshiAnalysis | None = None
    d12_chart: DivisionalChartData | None = None
    kp_data: KpData | None = None
    precision: PrecisionData | None = None


class TimeWindow(BaseModel):
    base_time: str
    range_minutes: int
    step_seconds: int


class ScanConfiguration(BaseModel):
    max_candidates: int = 100
    min_consensus_score: int = 50
    parallel_processing: bool = True
    cache_ephemeris: bool = True
    event_weight_threshold: float = 0.3


class EventConfidence(BaseModel):
    level: str
    source: EventSource
    date_precision: str
    weight: float = 0
    reliability_score: float = 0


class BtrEvent(BaseModel):
    id: str
    type: str
    category: str
    event_date: str
    date_precision: str
    description: str
    impact: str
    confidence: EventConfidence
    event_house: int
    significators: list[str]


class MethodScores(BaseModel):
    vimshottari: float = 0
    yogini: float = 0
    chara: float = 0
    kalachakra: float = 0
    kp: float = 0
    varga: float = 0
    transit: float = 0
    boundary: float = 0
    tatwa: float = 0
    shadbala: float = 0
    nadi: float = 0
    spouse_d9: float = 0


class EventMatchResult(BaseModel):
    event_id: str
    event_type: str
    expected_house: int
    dasha_lord: str
    significator_match: bool = False
    house_match: bool = False
    kp_match: bool = False
    varga_match: bool = False
    score: float = 0
    details: str = ""


class TransitMatchResult(BaseModel):
    event_id: str
    event_date: str
    event_house: int
    saturn_aspect: bool = False
    jupiter_aspect: bool = False
    rahu_influence: bool = False
    double_transit: bool = False
    score: float = 0
    details: str = ""


class TatwaWindow(BaseModel):
    start_time: str
    end_time: str
    tatwa: TatwaType
    confidence: float


class TatwaResult(BaseModel):
    tatwa: TatwaType
    element: str
    start_time: str
    end_time: str
    cycle_number: int
    matches_known_tatwa: bool = False
    correction_minutes: float = 0
    corrected_windows: list[TatwaWindow]


class BoundaryAnalysis(BaseModel):
    lagna_sign_boundary: float
    moon_nakshatra_boundary: float
    moon_navamsa_boundary: float
    d60_change_window: float
    is_critical_zone: bool = False
    danger_level: str = "safe"
    details: str = ""


class StageResult(BaseModel):
    stage_number: int
    stage_name: str
    candidates_in: int
    candidates_out: int
    batch_count: int | None = None
    ai_reasoning: str | None = None


class TournamentRound(BaseModel):
    round_number: int
    batches_processed: int
    candidates_in: int
    candidates_out: int


class AnonymizedCandidate(BaseModel):
    id: str
    time: str
    original_offset_description: str
    data: CandidateDataPackage


class BatchPromptContext(BaseModel):
    candidates: list[CandidateDataPackage]
    events: list[Any]
    batch_number: int
    total_batches: int
    survivors_needed: int
    tentative_time: str | None = None


class FinalVerdict(BaseModel):
    time: str
    accuracy: float
    confidence: float | str
    margin: float


class ScanResult(BaseModel):
    success: bool = False
    candidates: list[Any]
    best_candidate: Any | None = None
    total_scanned: int = 0
    scan_duration_ms: float = 0
    recommendations: list[str] = []
    errors: list[str] = []


class RectificationResult(BaseModel):
    rectified_time: str
    rectified_date: str
    confidence_level: ConfidenceLevel
    confidence_percentage: float
    margin_of_error_seconds: float
    method_consensus: MethodScores
    evidence: dict[str, list[str]]
    candidate_analysis: list[Any]
    recommendations: list[str]
    processing_time_ms: float
