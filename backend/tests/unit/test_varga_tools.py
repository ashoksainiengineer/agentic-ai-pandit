"""Unit tests for varga tools (Tools 7-9).

Uses synthetic chart data to avoid ephemeris service dependency.
"""

from __future__ import annotations

import pytest

from app.tools.definitions.varga_tools import (
    BoundaryChangesInput,
    BoundarySafetyInput,
    DivisionalChartsInput,
    _calculate_d2_sign,
    _calculate_d9_sign,
    _calculate_d150_sign,
    _calculate_modality_varga_sign,
    _detect_transitions,
    _generate_sweep_timestamps,
    _get_varga_sign,
    _seconds_to_nakshatra_boundary,
    _seconds_to_sign_boundary,
    _seconds_to_varga_boundary,
)
from app.tools.ephemeris_client import (
    EphemerisServiceChartResponse,
    EphemerisServiceHouses,
    EphemerisServicePlanetPosition,
)

# ── Test helpers: varga calculations ──


class TestD2Sign:
    def test_aries_first_half(self) -> None:
        assert _calculate_d2_sign(5.0) == "Leo"

    def test_aries_second_half(self) -> None:
        assert _calculate_d2_sign(20.0) == "Cancer"

    def test_taurus_first_half(self) -> None:
        assert _calculate_d2_sign(35.0) == "Cancer"

    def test_taurus_second_half(self) -> None:
        assert _calculate_d2_sign(50.0) == "Leo"


class TestD9Sign:
    def test_aries_first_navamsa(self) -> None:
        assert _calculate_d9_sign(0.0) == "Aries"

    def test_aries_last_navamsa(self) -> None:
        assert _calculate_d9_sign(29.9) == "Sagittarius"

    def test_taurus_first_navamsa(self) -> None:
        assert _calculate_d9_sign(30.0) == "Capricorn"


class TestModalityVargaSign:
    def test_d7_aries(self) -> None:
        assert _calculate_modality_varga_sign(0.0, "D7") == "Aries"

    def test_d7_taurus(self) -> None:
        assert _calculate_modality_varga_sign(30.0, "D7") == "Leo"

    def test_d7_gemini(self) -> None:
        assert _calculate_modality_varga_sign(60.0, "D7") == "Sagittarius"

    def test_d10_aries(self) -> None:
        assert _calculate_modality_varga_sign(0.0, "D10") == "Aries"


class TestD150Sign:
    def test_d150_aries_start(self) -> None:
        sign = _calculate_d150_sign(0.0)
        assert isinstance(sign, str)
        assert sign in [
            "Aries", "Taurus", "Gemini", "Cancer",
            "Leo", "Virgo", "Libra", "Scorpio",
            "Sagittarius", "Capricorn", "Aquarius", "Pisces",
        ]


class TestGetVargaSign:
    def test_d1(self) -> None:
        assert _get_varga_sign(15.0, "D1") == "Aries"

    def test_d2(self) -> None:
        assert _get_varga_sign(5.0, "D2") == "Leo"

    def test_d9(self) -> None:
        assert _get_varga_sign(0.0, "D9") == "Aries"

    def test_d7(self) -> None:
        assert _get_varga_sign(0.0, "D7") == "Aries"

    def test_d150(self) -> None:
        sign = _get_varga_sign(0.0, "D150")
        assert isinstance(sign, str)


# ── Boundary safety helpers ──


class TestSecondsToBoundary:
    def test_sign_boundary(self) -> None:
        to_next, to_prev = _seconds_to_sign_boundary(15.0, 360.0)
        assert to_next == pytest.approx(3600.0)  # 15 deg * 240 sec/deg
        assert to_prev == pytest.approx(3600.0)

    def test_nakshatra_boundary(self) -> None:
        to_next, to_prev = _seconds_to_nakshatra_boundary(
            6.666666, 13.2 * 24 * 3600 / 360
        )
        assert to_next > 0
        assert to_prev > 0

    def test_varga_boundary(self) -> None:
        to_next, to_prev = _seconds_to_varga_boundary(1.0, "D9", 360.0)
        assert to_next > 0
        assert to_prev > 0


# ── Sweep timestamp generation ──


class TestGenerateSweepTimestamps:
    def test_basic_sweep(self) -> None:
        timestamps = _generate_sweep_timestamps(
            "2024-06-16T10:00:00Z", sweep_minutes=1, step_seconds=30
        )
        assert len(timestamps) == 5  # -60, -30, 0, +30, +60 seconds
        assert "2024-06-16T10:00:00Z" in timestamps

    def test_center_excluded(self) -> None:
        timestamps = _generate_sweep_timestamps(
            "2024-06-16T10:00:00Z", sweep_minutes=1, step_seconds=60
        )
        assert len(timestamps) == 3  # -60, 0, +60


# ── Transition detection ──


def _make_synthetic_chart(
    timestamp_utc: str,
    ascendant_tropical: float,
    moon_tropical: float,
    ayanamsha: float = 24.0,
) -> EphemerisServiceChartResponse:
    return EphemerisServiceChartResponse(
        timestamp_utc=timestamp_utc,
        julian_day_ut=2460000.0,
        julian_day_tt=2460000.0,
        ayanamsha=ayanamsha,
        planets=[
            EphemerisServicePlanetPosition(
                body="moon",
                tropical_longitude=moon_tropical,
                tropical_latitude=0.0,
                sidereal_longitude=None,
                distance_au=1.0,
                longitude_speed=13.2,
                latitude_speed=None,
                retrograde=False,
            ),
            EphemerisServicePlanetPosition(
                body="sun",
                tropical_longitude=100.0,
                tropical_latitude=0.0,
                sidereal_longitude=None,
                distance_au=1.0,
                longitude_speed=1.0,
                latitude_speed=None,
                retrograde=False,
            ),
        ],
        houses=EphemerisServiceHouses(
            ascendant_tropical=ascendant_tropical,
            mc_tropical=ascendant_tropical + 90.0,
            house_cusps_tropical=[0.0] * 12,
            ascendant_sidereal=None,
            house_cusps_sidereal=None,
        ),
    )


class TestDetectTransitions:
    def test_lagna_sign_transition(self) -> None:
        center = _make_synthetic_chart("2024-06-16T10:00:00Z", 30.0, 50.0)
        next_chart = _make_synthetic_chart("2024-06-16T10:01:00Z", 60.0, 50.0)
        transitions = _detect_transitions(center, [center, next_chart], 60)
        lagna_trans = [t for t in transitions if t.transition_type == "lagna_sign"]
        assert len(lagna_trans) == 1
        assert lagna_trans[0].from_sign == "Aries"
        assert lagna_trans[0].to_sign == "Taurus"

    def test_no_transition(self) -> None:
        center = _make_synthetic_chart("2024-06-16T10:00:00Z", 30.0, 50.0)
        same = _make_synthetic_chart("2024-06-16T10:01:00Z", 32.0, 50.0)
        transitions = _detect_transitions(center, [center, same], 60)
        assert len(transitions) == 0


# ── Input validation tests ──


class TestInputValidation:
    def test_divisional_charts_input_valid(self) -> None:
        inp = DivisionalChartsInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.timestamp_utc == "2024-06-16T10:30:00Z"
        assert inp.latitude == 28.6139

    def test_boundary_safety_input_valid(self) -> None:
        inp = BoundarySafetyInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.longitude == 77.2090

    def test_boundary_changes_input_valid(self) -> None:
        inp = BoundaryChangesInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
            sweep_minutes=60,
            step_seconds=30,
        )
        assert inp.sweep_minutes == 60
        assert inp.step_seconds == 30

    def test_boundary_changes_input_invalid_sweep(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            BoundaryChangesInput(
                timestamp_utc="2024-06-16T10:30:00Z",
                latitude=28.6139,
                longitude=77.2090,
                sweep_minutes=10,  # below minimum 30
                step_seconds=15,
            )

    def test_boundary_changes_input_invalid_step(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            BoundaryChangesInput(
                timestamp_utc="2024-06-16T10:30:00Z",
                latitude=28.6139,
                longitude=77.2090,
                sweep_minutes=60,
                step_seconds=100,  # above maximum 60
            )
