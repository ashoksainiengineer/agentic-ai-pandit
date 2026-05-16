from __future__ import annotations

from app.models.btr import (
    EVENT_HOUSE_MAP,
    PARASHARI_ASPECTS,
    SIGN_LORDS,
    TATWA_SEQUENCE,
    ZODIAC_SIGNS,
    Ascendant,
    CandidateDataPackage,
    ConfidenceLevel,
    MethodScores,
    PlanetData,
    RectificationResult,
    ShadbalaBreakdown,
    TatwaType,
    VimshottariDashaEntry,
    ZodiacSign,
)
from app.models.events import (
    EVENT_TYPES,
    BirthData,
    DatePrecision,
    EventCategory,
    EventImportance,
    Gender,
    LifeEvent,
    SessionStatus,
    TimeOffsetConfig,
)
from app.models.session import RectificationSession
from app.models.stream import (
    AIThinkingEvent,
    CandidateScore,
    CandidateScoreEvent,
    CompleteEvent,
    ErrorEvent,
    JobSummary,
    ProgressEvent,
)


def test_zodiac_signs_enum() -> None:
    assert len(ZodiacSign) == 12
    assert ZodiacSign.ARIES.value == "Aries"


def test_zodiac_signs_list() -> None:
    assert len(ZODIAC_SIGNS) == 12
    assert ZODIAC_SIGNS[0] == "Aries"


def test_sign_lords() -> None:
    assert SIGN_LORDS["Aries"] == "mars"
    assert SIGN_LORDS["Leo"] == "sun"
    assert len(SIGN_LORDS) == 12


def test_tatwa_sequence() -> None:
    assert TATWA_SEQUENCE == ["prithvi", "jala", "agni", "vayu", "akasha"]


def test_event_house_map_coverage() -> None:
    for cat in EventCategory:
        assert cat.value in EVENT_HOUSE_MAP, f"Missing house map entry for {cat}"


def test_parashari_aspects() -> None:
    assert PARASHARI_ASPECTS["jupiter"] == [5, 7, 9]
    assert PARASHARI_ASPECTS["saturn"] == [3, 7, 10]
    assert all(len(planets) >= 1 for planets in PARASHARI_ASPECTS.values())


def test_event_types_coverage() -> None:
    for cat in EventCategory:
        assert cat in EVENT_TYPES, f"Missing EVENT_TYPES entry for {cat}"
        assert len(EVENT_TYPES[cat]) >= 1


def test_confidence_level_enum() -> None:
    assert ConfidenceLevel.GOD_TIER.value == "GOD_TIER"
    assert ConfidenceLevel.LOW.value == "LOW"


def test_tatwa_type_enum() -> None:
    assert TatwaType.PRITHVI.value == "prithvi"
    assert TatwaType.AKASHA.value == "akasha"
    assert len(TatwaType) == 5


def test_gender_enum() -> None:
    assert Gender.MALE.value == "male"
    assert len(Gender) == 3


def test_date_precision_enum() -> None:
    assert DatePrecision.EXACT_DATE_TIME.value == "exact_date_time"
    assert DatePrecision.YEAR_RANGE.value == "year_range"
    assert len(DatePrecision) == 6


def test_session_status_enum() -> None:
    assert SessionStatus.PENDING.value == "pending"
    assert SessionStatus.COMPLETE.value == "complete"
    assert SessionStatus.FAILED.value == "failed"


def test_planet_data_defaults() -> None:
    p = PlanetData(sign="Aries", degree="15.5")
    assert p.sign == "Aries"
    assert p.degree == "15.5"
    assert p.is_retro is False
    assert p.is_combust is False
    assert p.speed == 0
    assert p.house is None


def test_planet_data_full() -> None:
    p = PlanetData(
        sign="Leo",
        degree="20.3",
        nakshatra="Magha",
        house=1,
        dignity="exalted",
        is_retro=True,
        speed=-0.5,
        is_combust=False,
        shadbala=450.0,
    )
    assert p.nakshatra == "Magha"
    assert p.is_retro is True
    assert p.dignity == "exalted"


def test_shadbala_breakdown() -> None:
    sb = ShadbalaBreakdown(total=500, sthana=120, dig=60, kaala=180)
    assert sb.total == 500
    assert sb.cheshta is None
    sb2 = ShadbalaBreakdown(total=600, sthana=150, dig=70, kaala=200, cheshta=30)
    assert sb2.cheshta == 30


def test_vimshottari_dasha_entry() -> None:
    d = VimshottariDashaEntry(
        maha="Venus",
        antar="Sun",
        pratyantar="Moon",
        start_end="2020-01-01 to 2030-01-01",
    )
    assert d.maha == "Venus"
    assert d.antar == "Sun"
    assert d.sukshma is None


def test_ascendant_model() -> None:
    asc = Ascendant(sign="Libra", degree="10.5", nakshatra="Chitra", longitude=195.5)
    assert asc.sign == "Libra"
    assert asc.longitude == 195.5


def test_candidate_data_package_minimal() -> None:
    pkg = CandidateDataPackage(
        time="10:30:00",
        offset_minutes=0,
        planets={"Sun": PlanetData(sign="Leo", degree="15.0")},
        ascendant=Ascendant(sign="Libra", degree="10.5"),
        house_lords={"1": "Venus"},
        moon_nakshatra="Chitra",
        vimshottari_dasha=[
            VimshottariDashaEntry(
                maha="Venus", antar="Sun", pratyantar="Moon", start_end="2020-2030"
            )
        ],
    )
    assert pkg.offset_minutes == 0
    assert pkg.ayanamsa is None
    assert pkg.d9_lagna is None


def test_birth_data_validation() -> None:
    bd = BirthData(
        full_name="Test User",
        date_of_birth="1999-06-16",
        tentative_time="10:30:00",
        birth_place="Delhi",
        latitude=28.6139,
        longitude=77.2090,
        timezone=5.5,
        gender=Gender.MALE,
    )
    assert bd.full_name == "Test User"
    assert bd.gender == Gender.MALE
    assert bd.latitude == 28.6139


def test_birth_data_invalid_date_pattern() -> None:
    import re

    import pytest

    with pytest.raises(Exception, match=re.escape("pattern")):
        BirthData(
            full_name="Test",
            date_of_birth="16-06-1999",
            tentative_time="10:30:00",
            birth_place="Delhi",
            latitude=0,
            longitude=0,
            timezone=0,
        )


def test_life_event_default_importance() -> None:
    e = LifeEvent(
        category=EventCategory.EDUCATION,
        event_type="Graduation",
        date_precision=DatePrecision.EXACT_DATE,
        event_date="2020-06-15",
    )
    assert e.importance == "medium"
    assert e.description is None


def test_life_event_critical() -> None:
    e = LifeEvent(
        category=EventCategory.MARRIAGE,
        event_type="Wedding",
        date_precision=DatePrecision.EXACT_DATE_TIME,
        event_date="2023-12-01",
        event_time="18:30:00",
        importance=EventImportance.CRITICAL,
    )
    assert e.importance == "critical"
    assert e.event_time == "18:30:00"


def test_time_offset_config() -> None:
    from app.models.events import OffsetPreset

    cfg = TimeOffsetConfig(preset=OffsetPreset.HOURS_2, description="2 hour scan")
    assert cfg.preset == OffsetPreset.HOURS_2
    assert cfg.custom_minutes is None


def test_session_status_transitions() -> None:
    session = RectificationSession(
        id="ses_001",
        user_id="usr_001",
        external_id="ext_001",
        full_name="Test",
        date_of_birth="1999-06-16",
        tentative_time="10:30:00",
        birth_place="Delhi",
        latitude=28.61,
        longitude=77.21,
        timezone=5.5,
        life_events=[],
        status=SessionStatus.PENDING,
        created_at="2026-05-16T00:00:00Z",
        updated_at="2026-05-16T00:00:00Z",
    )
    assert session.status == SessionStatus.PENDING
    assert session.gender is None
    assert session.rectified_time is None


def test_method_scores_defaults() -> None:
    ms = MethodScores()
    assert ms.vimshottari == 0
    assert ms.kp == 0
    assert ms.nadi == 0


def test_rectification_result() -> None:
    result = RectificationResult(
        rectified_time="10:32:15",
        rectified_date="1999-06-16",
        confidence_level=ConfidenceLevel.HIGH,
        confidence_percentage=82.5,
        margin_of_error_seconds=45,
        method_consensus=MethodScores(vimshottari=85, kp=78),
        evidence={"primary": ["Dasha match"], "secondary": [], "warnings": []},
        candidate_analysis=[],
        recommendations=["Use 10:32:15 as rectified time"],
        processing_time_ms=45000,
    )
    assert result.confidence_percentage == 82.5
    assert result.margin_of_error_seconds == 45
    assert "Dasha match" in result.evidence["primary"]


def test_job_summary() -> None:
    job = JobSummary(
        id="job_001",
        session_id="ses_001",
        user_id="usr_001",
        kind="btr_rectification",
        status="queued",
        progress_percent=0,
        queued_at="2026-05-16T00:00:00Z",
        created_at="2026-05-16T00:00:00Z",
        updated_at="2026-05-16T00:00:00Z",
    )
    assert job.kind == "btr_rectification"
    assert job.status == "queued"
    assert job.progress_percent == 0


def test_stream_progress_event() -> None:
    event = ProgressEvent(
        step="lagna_filter",
        step_index=0,
        total_steps=5,
        percentage=20.0,
        message="Analyzing lagna",
    )
    assert event.type == "progress"
    assert event.step == "lagna_filter"


def test_stream_ai_thinking_event() -> None:
    event = AIThinkingEvent(chunk="Analyzing...", stage=1, candidate_time="10:30:00")
    assert event.type == "ai_thinking"
    assert event.stage == 1


def test_stream_candidate_score_event() -> None:
    event = CandidateScoreEvent(time="10:30:00", score=85.0, stage=1)
    assert event.type == "candidate_score"
    assert event.score == 85.0


def test_stream_complete_event() -> None:
    event = CompleteEvent(rectified_time="10:32:15", accuracy=92.5, confidence="HIGH")
    assert event.rectified_time == "10:32:15"


def test_stream_error_event() -> None:
    event = ErrorEvent(message="Something went wrong", stage="lagna_filter")
    assert event.type == "error"


def test_candidate_score_optional_fields() -> None:
    cs = CandidateScore(time="10:30:00")
    assert cs.score is None
    assert cs.confidence_level is None
    assert cs.red_flags is None


def test_candidate_score_full() -> None:
    cs = CandidateScore(
        time="10:30:00",
        score=85.0,
        stage=1,
        rank=3,
        red_flags=["Sandhi zone"],
        key_evidence=["Dasha match"],
    )
    assert cs.rank == 3
    assert cs.red_flags == ["Sandhi zone"]
    assert cs.key_evidence == ["Dasha match"]
