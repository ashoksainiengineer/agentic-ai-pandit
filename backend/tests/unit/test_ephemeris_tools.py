"""Unit tests for ephemeris tools (Tools 1-3).

Uses synthetic chart data to avoid ephemeris service dependency.
"""

from __future__ import annotations

import pytest

from app.tools.definitions.ephemeris_tools import (
    PanchangaInput,
    PlanetarySnapshotInput,
    SignNakshatraInput,
    _calculate_panchanga,
    _get_nakshatra,
    _get_sign,
    _get_sign_degree,
    _sidereal_longitude,
)

# ── Test helpers: sidereal geometry ──


class TestSiderealHelpers:
    def test_sidereal_longitude_simple(self) -> None:
        result = _sidereal_longitude(200.0, 24.0)
        assert result == pytest.approx(176.0)

    def test_sidereal_longitude_wrap(self) -> None:
        result = _sidereal_longitude(10.0, 20.0)
        assert result == pytest.approx(350.0)

    def test_get_sign(self) -> None:
        assert _get_sign(0) == "Aries"
        assert _get_sign(29.9) == "Aries"
        assert _get_sign(30.0) == "Taurus"
        assert _get_sign(60.0) == "Gemini"
        assert _get_sign(180.0) == "Libra"
        assert _get_sign(350.0) == "Pisces"

    def test_get_sign_degree(self) -> None:
        assert _get_sign_degree(45.0) == pytest.approx(15.0)
        assert _get_sign_degree(0.0) == pytest.approx(0.0)
        assert _get_sign_degree(359.0) == pytest.approx(29.0)


# ── Nakshatra tests ──


class TestNakshatra:
    def test_ashwini(self) -> None:
        name, pada, lord = _get_nakshatra(0.0)
        assert name == "Ashwini"
        assert lord == "ketu"

    def test_ashwini_second_pada(self) -> None:
        name, pada, lord = _get_nakshatra(5.0)
        assert name == "Ashwini"
        assert pada == 2

    def test_bharani(self) -> None:
        name, pada, lord = _get_nakshatra(13.34)
        assert name == "Bharani"
        assert lord == "venus"

    def test_revati(self) -> None:
        name, pada, lord = _get_nakshatra(359.0)
        assert name == "Revati"
        assert lord == "mercury"

    def test_nakshatra_pada_range(self) -> None:
        for lon in range(0, 360):
            _, pada, _ = _get_nakshatra(float(lon))
            assert 1 <= pada <= 4


# ── Panchanga tests ──


class TestPanchanga:
    def test_purnima(self) -> None:
        """θ=168° → index 14 → Purnima"""
        result = _calculate_panchanga(0.0, 168.0, 0)
        assert result["tithi"] == "Purnima"
        assert result["vara"] == "Sunday"

    def test_amavasya(self) -> None:
        """θ=354° → index 29 → Amavasya"""
        result = _calculate_panchanga(0.0, 354.0, 3)
        assert result["tithi"] == "Amavasya"
        assert result["vara"] == "Wednesday"

    def test_prathama(self) -> None:
        # Sun at 0°, Moon at 1° → θ=1° → index 0 = Prathama
        result = _calculate_panchanga(0.0, 1.0, 1)
        assert result["tithi"] == "Prathama"

    def test_yoga_names(self) -> None:
        result = _calculate_panchanga(0.0, 0.0, 0)
        assert "yoga" in result
        assert isinstance(result["yoga"], str)

    def test_karana_names(self) -> None:
        result = _calculate_panchanga(0.0, 6.0, 0)
        assert "karana" in result
        assert isinstance(result["karana"], str)


# ── Input validation tests ──


class TestInputValidation:
    def test_planetary_snapshot_input_valid(self) -> None:
        inp = PlanetarySnapshotInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.timestamp_utc == "2024-06-16T10:30:00Z"
        assert inp.latitude == 28.6139

    def test_planetary_snapshot_input_edge_lat(self) -> None:
        PlanetarySnapshotInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=90.0,
            longitude=0.0,
        )
        PlanetarySnapshotInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=-90.0,
            longitude=0.0,
        )

    def test_planetary_snapshot_input_invalid_lat(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PlanetarySnapshotInput(
                timestamp_utc="2024-06-16T10:30:00Z",
                latitude=91.0,
                longitude=0.0,
            )

    def test_sign_nakshatra_input_valid(self) -> None:
        inp = SignNakshatraInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.longitude == 77.2090

    def test_panchanga_input_valid(self) -> None:
        inp = PanchangaInput(
            timestamp_utc="2024-06-16T10:30:00Z",
            latitude=28.6139,
            longitude=77.2090,
        )
        assert inp.latitude == 28.6139

    def test_panchanga_input_invalid_longitude(self) -> None:
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PanchangaInput(
                timestamp_utc="2024-06-16T10:30:00Z",
                latitude=28.6139,
                longitude=181.0,
            )
