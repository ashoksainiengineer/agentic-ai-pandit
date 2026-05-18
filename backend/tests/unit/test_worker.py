"""Tests for JobWorker — pure helper methods (no Redis/DB/LangGraph mocking).

Tests only the static/helper methods that transform data without
external dependencies: _build_birth_data, _parse_life_events,
_generate_candidates, and the JobSubmission dataclass.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest

from app.queue.worker import JobSubmission, JobWorker


@pytest.fixture
def worker() -> JobWorker:
    event_store = AsyncMock()
    return JobWorker(event_store)


class TestJobSubmission:
    def test_creation(self) -> None:
        sub = JobSubmission(job_id="job_001", session_id="ses_001")
        assert sub.job_id == "job_001"
        assert sub.session_id == "ses_001"

    def test_immutable_fields(self) -> None:
        sub = JobSubmission(job_id="job_001", session_id="ses_001")
        assert isinstance(sub.job_id, str)
        assert isinstance(sub.session_id, str)


class TestBuildBirthData:
    def test_full_data(self, worker: JobWorker) -> None:
        session = type(
            "Session",
            (),
            {
                "full_name": "Test User",
                "date_of_birth": "1990-06-15",
                "tentative_time": "14:30:00",
                "birth_place": "Mumbai",
                "latitude": 19.076,
                "longitude": 72.8777,
                "timezone": 5.5,
                "gender": "male",
            },
        )()
        bd = worker._build_birth_data(session)
        assert bd.full_name == "Test User"
        assert bd.date_of_birth == "1990-06-15"
        assert bd.tentative_time == "14:30:00"
        assert bd.birth_place == "Mumbai"
        assert bd.latitude == 19.076
        assert bd.longitude == 72.8777
        assert bd.timezone == 5.5
        assert bd.gender == "male"

    def test_null_gender(self, worker: JobWorker) -> None:
        session = type(
            "Session",
            (),
            {
                "full_name": "T",
                "date_of_birth": "2000-01-01",
                "tentative_time": "12:00:00",
                "birth_place": "X",
                "latitude": 0.0,
                "longitude": 0.0,
                "timezone": 0,
                "gender": None,
            },
        )()
        bd = worker._build_birth_data(session)
        assert bd.gender is None


class TestParseLifeEvents:
    def test_no_events_returns_empty(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": None})()
        events = worker._parse_life_events(session)
        assert events == []

    def test_empty_string(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": ""})()
        events = worker._parse_life_events(session)
        assert events == []

    def test_valid_json_array(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": "[]"})()
        events = worker._parse_life_events(session)
        assert events == []

    def test_parses_life_events(self, worker: JobWorker) -> None:
        json_str = json.dumps(
            [
                {
                    "category": "career",
                    "event_type": "Job start",
                    "date_precision": "exact_date",
                    "event_date": "2015-03-01",
                    "description": "Started first job",
                    "importance": "high",
                }
            ]
        )
        session = type("Session", (), {"life_events": json_str})()
        events = worker._parse_life_events(session)
        assert len(events) == 1
        assert events[0].category == "career"
        assert events[0].event_type == "Job start"
        assert events[0].importance == "high"

    def test_invalid_json_returns_empty(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": "not valid json"})()
        events = worker._parse_life_events(session)
        assert events == []

    def test_non_list_json_returns_empty(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": '{"key": "value"}'})()
        events = worker._parse_life_events(session)
        assert events == []

    def test_missing_required_field_returns_empty(self, worker: JobWorker) -> None:
        session = type("Session", (), {"life_events": '[{"invalid": true}]'})()
        events = worker._parse_life_events(session)
        assert events == []


class TestGenerateCandidates:
    async def test_generates_correct_count(self, worker: JobWorker) -> None:
        from app.models.events import BirthData

        bd = BirthData(
            full_name="Test",
            date_of_birth="1990-06-15",
            tentative_time="14:30:00",
            birth_place="Mumbai",
            latitude=19.076,
            longitude=72.8777,
            timezone=5.5,
            gender=None,
        )
        candidates = await worker._generate_candidates(bd)
        assert len(candidates) == 11

    async def test_includes_zero_offset(self, worker: JobWorker) -> None:
        from app.models.events import BirthData

        bd = BirthData(
            full_name="T",
            date_of_birth="2000-01-01",
            tentative_time="12:00:00",
            birth_place="X",
            latitude=0.0,
            longitude=0.0,
            timezone=0,
            gender=None,
        )
        candidates = await worker._generate_candidates(bd)
        zero = [c for c in candidates if c.offset_minutes == 0]
        assert len(zero) == 1
        assert zero[0].candidate_key == "offset_+0"

    async def test_candidate_has_expected_fields(self, worker: JobWorker) -> None:
        from app.models.events import BirthData

        bd = BirthData(
            full_name="T",
            date_of_birth="2000-01-01",
            tentative_time="12:00:00",
            birth_place="X",
            latitude=0.0,
            longitude=0.0,
            timezone=0,
            gender=None,
        )
        candidates = await worker._generate_candidates(bd)
        c = candidates[0]
        assert c.time.endswith("Z")
        assert isinstance(c.offset_minutes, int)
        assert c.candidate_key is not None
        assert c.candidate_date is not None

    async def test_candidate_time_is_utc(self, worker: JobWorker) -> None:
        from app.models.events import BirthData

        bd = BirthData(
            full_name="T",
            date_of_birth="2000-06-15",
            tentative_time="10:30:00",
            birth_place="X",
            latitude=0.0,
            longitude=0.0,
            timezone=5.5,
            gender=None,
        )
        candidates = await worker._generate_candidates(bd)
        for c in candidates:
            assert c.time.endswith("Z"), f"Expected UTC time, got {c.time}"

    async def test_offsets_are_sorted(self, worker: JobWorker) -> None:
        from app.models.events import BirthData

        bd = BirthData(
            full_name="T",
            date_of_birth="2000-06-15",
            tentative_time="10:30:00",
            birth_place="X",
            latitude=0.0,
            longitude=0.0,
            timezone=0,
            gender=None,
        )
        candidates = await worker._generate_candidates(bd)
        offsets = [c.offset_minutes for c in candidates]
        assert offsets == sorted(offsets)
