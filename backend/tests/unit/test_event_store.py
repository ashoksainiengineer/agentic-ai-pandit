"""Tests for the Redis-backed JobEventStore.

Uses mocked async Redis to avoid external service dependency.
"""

from __future__ import annotations

import json
from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from app.event_store import JobEvent, JobEventStore


@pytest.fixture
def mock_redis() -> AsyncMock:
    redis = AsyncMock()
    redis.rpush = AsyncMock()
    redis.ltrim = AsyncMock()
    redis.publish = AsyncMock()
    redis.lrange = AsyncMock(return_value=[])
    redis.llen = AsyncMock(return_value=0)
    redis.delete = AsyncMock()
    return redis


@pytest.fixture
def store(mock_redis: AsyncMock) -> JobEventStore:
    return JobEventStore(mock_redis)


class TestJobEventDataclass:
    def test_default_timestamp(self) -> None:
        event = JobEvent(event="progress")
        assert event.event == "progress"
        assert event.data == {}
        datetime.fromisoformat(event.timestamp)

    def test_default_timestamp_is_utc(self) -> None:
        event = JobEvent(event="progress")
        assert event.timestamp.endswith("+00:00")

    def test_custom_data(self) -> None:
        event = JobEvent("score", {"score": 85.5, "stage": "lagna"})
        assert event.data["score"] == 85.5
        assert event.data["stage"] == "lagna"


class TestJobEventStoreWrite:
    async def test_write_event_rpush_and_publish(
        self, store: JobEventStore, mock_redis: AsyncMock
    ) -> None:
        event = JobEvent("progress", {"pct": 50})
        await store.write_event("job_001", event)

        mock_redis.rpush.assert_awaited_once()
        args, _ = mock_redis.rpush.await_args
        assert args[0] == "job:job_001:log"

        mock_redis.ltrim.assert_awaited_once()

        mock_redis.publish.assert_awaited_once()
        pub_args, _ = mock_redis.publish.await_args
        assert pub_args[0] == "job:job_001:events"

        payload = json.loads(pub_args[1])
        assert payload["event"] == "progress"
        assert payload["data"]["pct"] == 50

    async def test_write_error(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        await store.write_error("job_001", "Something broke", code=500)
        mock_redis.rpush.assert_awaited_once()
        args, _ = mock_redis.rpush.await_args

        payload = json.loads(args[1])
        assert payload["event"] == "error"
        assert payload["data"]["message"] == "Something broke"
        assert payload["data"]["code"] == 500

    async def test_write_stage_complete(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        await store.write_stage_complete("job_001", "lagna", 50.0)
        mock_redis.rpush.assert_awaited_once()
        args, _ = mock_redis.rpush.await_args

        payload = json.loads(args[1])
        assert payload["event"] == "stage_complete"
        assert payload["data"]["stage"] == "lagna"
        assert payload["data"]["progress_percent"] == 50.0

    async def test_write_complete(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        result = {"rectified_time": "2024-01-15T10:30:00Z", "confidence": 85.0}
        await store.write_complete("job_001", result)
        mock_redis.rpush.assert_awaited_once()
        args, _ = mock_redis.rpush.await_args

        payload = json.loads(args[1])
        assert payload["event"] == "complete"
        assert payload["data"]["result"] == result


class TestJobEventStoreRead:
    async def test_read_events_empty(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        mock_redis.lrange.return_value = []
        events = await store.read_events("job_001")
        assert events == []
        mock_redis.lrange.assert_awaited_once_with("job:job_001:log", 0, 999)

    async def test_read_events_with_data(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        stored = [
            json.dumps({"event": "progress", "data": {"pct": 10}, "timestamp": "2024-01-01T00:00:00Z"}),
            json.dumps({"event": "progress", "data": {"pct": 50}, "timestamp": "2024-01-01T00:01:00Z"}),
        ]
        mock_redis.lrange.return_value = stored
        events = await store.read_events("job_001")
        assert len(events) == 2
        assert events[0]["event"] == "progress"
        assert events[0]["data"]["pct"] == 10

    async def test_read_events_since_seq(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        mock_redis.lrange.return_value = []
        await store.read_events("job_001", since_seq=5)
        mock_redis.lrange.assert_awaited_once_with("job:job_001:log", 5, 1004)

    async def test_event_count(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        mock_redis.llen.return_value = 3
        count = await store.event_count("job_001")
        assert count == 3
        mock_redis.llen.assert_awaited_once_with("job:job_001:log")


class TestJobEventStoreCleanup:
    async def test_clear_events(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        await store.clear_events("job_001")
        mock_redis.delete.assert_awaited_once_with("job:job_001:log")


class TestJobEventStoreIntegration:

    async def test_write_then_read(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        stored_payloads: list[bytes] = []

        async def fake_rpush(_key: str, value: str) -> None:
            stored_payloads.append(value.encode())

        async def fake_lrange(_key: str, _start: int, _end: int) -> list[bytes]:
            return stored_payloads

        mock_redis.rpush.side_effect = fake_rpush
        mock_redis.lrange.side_effect = fake_lrange

        await store.write_event("job_001", JobEvent("progress", {"pct": 75}))
        events = await store.read_events("job_001")

        assert len(events) == 1
        assert events[0]["event"] == "progress"
        assert events[0]["data"]["pct"] == 75

    async def test_multiple_events(self, store: JobEventStore, mock_redis: AsyncMock) -> None:
        stored_payloads: list[bytes] = []

        async def fake_rpush(_key: str, value: str) -> None:
            stored_payloads.append(value.encode())

        async def fake_lrange(_key: str, start: int, end: int) -> list[bytes]:
            return stored_payloads[start:end + 1]

        mock_redis.rpush.side_effect = fake_rpush
        mock_redis.lrange.side_effect = fake_lrange
        mock_redis.llen.return_value = 3

        await store.write_event("job_001", JobEvent("progress", {"pct": 10}))
        await store.write_event("job_001", JobEvent("thinking", {"stage": "lagna"}))
        await store.write_event("job_001", JobEvent("complete", {"result": {}}))

        count = await store.event_count("job_001")
        assert count == 3

        events = await store.read_events("job_001")
        assert len(events) == 3
        assert events[0]["event"] == "progress"
        assert events[1]["event"] == "thinking"
        assert events[2]["event"] == "complete"
