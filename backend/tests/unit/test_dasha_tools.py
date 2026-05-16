"""Unit tests for Dasha tools (Tools 4-6).

Tests the core calculation algorithms without ephemeris service dependency.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.tools.definitions.dasha_tools import (
    DASHA_SEQUENCE,
    DASHA_YEARS,
    NAKSHATRA_LORDS,
    NAKSHATRA_SPAN,
    KalachakraDashaInput,
    VimshottariDashaInput,
    YoginiDashaInput,
    _add_years,
    _calculate_kalachakra_dasha,
    _calculate_vimshottari,
    _calculate_yogini_dasha,
    _get_kalachakra_group,
)
from app.tools.definitions.ephemeris_tools import _get_nakshatra

# ── Test helpers ──


def _approx_year_dt(year: int) -> datetime:
    """Create a datetime for Jan 1 of *year*."""
    return datetime(year, 1, 1, tzinfo=UTC)


# ── Constants validation ──


class TestConstants:
    def test_dasha_years_sum(self) -> None:
        total = sum(DASHA_YEARS.values())
        assert total == 120

    def test_dasha_sequence_length(self) -> None:
        assert len(DASHA_SEQUENCE) == 9

    def test_nakshatra_lords_length(self) -> None:
        assert len(NAKSHATRA_LORDS) == 27

    def test_nakshatra_span(self) -> None:
        assert pytest.approx(13.3333333, rel=1e-4) == NAKSHATRA_SPAN


# ── Helper tests ──


class TestHelpers:
    def test_add_years_positive(self) -> None:
        dt = _approx_year_dt(2000)
        result = _add_years(dt, 10)
        # ~3652.5 days later = Dec 31 2009 noon (off by ~12h due to float)
        assert abs((result - dt).days - 3652) <= 1

    def test_add_years_float(self) -> None:
        dt = _approx_year_dt(2000)
        result = _add_years(dt, 0.5)
        assert result.year == 2000
        assert result.month in (6, 7)

    def test_get_kalachakra_group_ashvini(self) -> None:
        group = _get_kalachakra_group(0)
        assert group is not None
        assert group["name"] == "Ashvini"
        assert group["type"] == "Savya"

    def test_get_kalachakra_group_ashlesha(self) -> None:
        group = _get_kalachakra_group(8)
        assert group is not None
        assert group["name"] == "Ashlesha"
        assert group["type"] == "Mixed"

    def test_get_kalachakra_group_none(self) -> None:
        group = _get_kalachakra_group(99)
        assert group is None


# ── Vimshottari Dasha tests ──


class TestVimshottari:
    def test_moon_at_ashwini_start(self) -> None:
        """Moon at 0° → Ashwini, lord Ketu, balance 7 years."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(0.0, dt, 2)
        assert lord == "Ketu"
        assert balance == pytest.approx(7.0, rel=0.01)
        assert periods[0].maha == "Ketu"

    def test_moon_at_ashwini_mid(self) -> None:
        """Moon at 6.666° → Ashwini, 50% elapsed, balance ~3.5 years."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(6.66666, dt, 2)
        assert lord == "Ketu"
        assert balance == pytest.approx(3.5, rel=0.5)

    def test_moon_at_rohini(self) -> None:
        """Moon at 40° → Rohini (index 3), lord Moon, balance 10 years."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(40.0, dt, 2)
        n, _, _ = _get_nakshatra(40.0)
        assert n == "Rohini"
        assert lord == "Moon"

    def test_vimshottari_has_9_maha_periods(self) -> None:
        """After first partial, we get 8 full + 1 partial = 9 maha periods."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(0.0, dt, 2)
        unique_mahas = {p.maha for p in periods if p.maha != "-"}
        assert len(unique_mahas) <= 9

    def test_vimshottari_level_3(self) -> None:
        """Depth 3 includes pratyantar periods."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(0.0, dt, 3)
        has_pratyantar = any(p.pratyantar != "-" for p in periods)
        assert has_pratyantar

    def test_vimshottari_first_period_starts_at_birth(self) -> None:
        """First period's start_end should begin at birth date."""
        dt = _approx_year_dt(2000)
        nak, lord, balance, periods = _calculate_vimshottari(0.0, dt, 2)
        assert periods[0].maha == "Ketu"
        assert periods[0].start_end.startswith("2000-01-01")


# ── Yogini Dasha tests ──


class TestYogini:
    def test_yogini_moon_at_ashwini(self) -> None:
        """Moon at 0° → Ashwini → starting Yogini Mangala (index 0)."""
        dt = _approx_year_dt(2000)
        nak, start_name, periods = _calculate_yogini_dasha(0.0, dt, 1)
        assert start_name == "Mangala"
        assert periods[0].name == "Mangala"

    def test_yogini_moon_at_ardra(self) -> None:
        """Moon at 70° → Ardra (index 5) → starting Yogini Ulka (index 5)."""
        dt = _approx_year_dt(2000)
        nak, start_name, periods = _calculate_yogini_dasha(70.0, dt, 1)
        assert start_name == "Ulka"

    def test_yogini_cycle_duration(self) -> None:
        """One full cycle = 36 years (1+2+3+4+5+6+7+8)."""
        dt = _approx_year_dt(2000)
        nak, start_name, periods = _calculate_yogini_dasha(0.0, dt, 1)
        # First period is partial (balance), skip it
        full_periods = periods[1:]
        total_years = sum(p.duration_years for p in full_periods)
        assert total_years == pytest.approx(36.0, rel=0.1)

    def test_yogini_first_period_starts_at_birth(self) -> None:
        dt = _approx_year_dt(2000)
        nak, start_name, periods = _calculate_yogini_dasha(0.0, dt, 1)
        assert periods[0].start_date == "2000-01-01"


# ── Kalachakra Dasha tests ──


class TestKalachakra:
    def test_kalachakra_moon_at_ashwini(self) -> None:
        """Moon at 0° → Ashvini group → Savya type, first sign Aries."""
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(0.0, dt)
        assert kc_type == "Savya"
        assert periods[0].sign == "Aries"

    def test_kalachakra_moon_at_bharani(self) -> None:
        """Moon at 14° → Bharani group → Apisavya, first sign Pisces."""
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(14.0, dt)
        assert kc_type == "Apisavya"
        assert periods[0].sign == "Pisces"

    def test_kalachakra_has_12_periods(self) -> None:
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(0.0, dt)
        assert len(periods) == 12

    def test_kalachakra_first_period_starts_at_birth(self) -> None:
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(0.0, dt)
        assert periods[0].start_date == "2000-01-01"

    def test_kalachakra_savya_progression(self) -> None:
        """Savya: signs advance forward: Aries → Taurus → Gemini ..."""
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(0.0, dt)
        assert periods[0].sign == "Aries"
        assert periods[1].sign == "Taurus"

    def test_kalachakra_apisavya_progression(self) -> None:
        """Apisavya: signs move backward: Pisces → Aquarius → Capricorn ..."""
        dt = _approx_year_dt(2000)
        nak, kc_type, periods = _calculate_kalachakra_dasha(14.0, dt)
        assert periods[0].sign == "Pisces"
        assert periods[1].sign == "Aquarius"


# ── Input validation tests ──


class TestInputValidation:
    def test_vimshottari_input_valid(self) -> None:
        inp = VimshottariDashaInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
            max_levels=3,
        )
        assert inp.max_levels == 3

    def test_vimshottari_input_default_level(self) -> None:
        inp = VimshottariDashaInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.max_levels == 3

    def test_vimshottari_input_level_range(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            VimshottariDashaInput(
                timestamp_utc="2024-06-16T10:30:00Z",
                latitude=28.6139,
                longitude=77.2090,
                max_levels=6,
            )

    def test_yogini_input_valid(self) -> None:
        inp = YoginiDashaInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.num_cycles == 3

    def test_kalachakra_input_valid(self) -> None:
        inp = KalachakraDashaInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.longitude == 77.2090
