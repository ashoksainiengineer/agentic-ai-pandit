"""Redis-backed job event store for BTR rectification progress streaming.

Writes every event to a Redis list (``job:{job_id}:log``) for persistence and
publishes to a Redis pub/sub channel (``job:{job_id}:events``) for real-time
SSE delivery.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import structlog
from redis.asyncio import Redis as AsyncRedis

log = structlog.get_logger()

# Max events kept per job to bound memory
_MAX_LOG_SIZE = 10_000


@dataclass
class JobEvent:
    """A single progression event emitted during job processing."""

    event: str
    """Event type — one of ``progress``, ``thinking``, ``candidate_score``,
    ``stage_complete``, ``complete``, ``error``, ``cancelled``."""

    data: dict[str, Any] = field(default_factory=dict)
    """Free-form payload (stage name, score, message, …)."""

    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    """ISO-8601 timestamp of when the event was emitted."""


class JobEventStore:
    """Persists and streams job progress events via Redis.

    Usage::

        store = JobEventStore(redis)
        await store.write_event("job_001", JobEvent("progress", {"pct": 50}))
        events = await store.read_events("job_001")
        async for evt in store.stream_events("job_001"):
            ...
    """

    def __init__(self, redis: AsyncRedis[Any]) -> None:
        self._redis: AsyncRedis[Any] = redis

    # ------------------------------------------------------------------
    # Write path
    # ------------------------------------------------------------------

    async def write_event(self, job_id: str, event: JobEvent) -> None:
        """Persist *event* to Redis and publish it to the SSE channel."""
        payload = {
            "event": event.event,
            "data": event.data,
            "timestamp": event.timestamp,
        }
        raw = json.dumps(payload, default=str)

        # Append to the persistent log (capped at MAX_LOG_SIZE)
        log_key = f"job:{job_id}:log"
        await self._redis.rpush(log_key, raw)
        await self._redis.ltrim(log_key, -_MAX_LOG_SIZE, -1)

        # Publish to the SSE pub/sub channel
        await self._redis.publish(f"job:{job_id}:events", raw)

        log.debug("event_written", job_id=job_id, event_type=event.event)

    async def write_error(self, job_id: str, message: str, **extra: Any) -> None:
        """Convenience — write an ``error`` event."""
        await self.write_event(
            job_id,
            JobEvent("error", {"message": message, **extra}),
        )

    async def write_stage_complete(
        self,
        job_id: str,
        stage: str,
        progress_pct: float,
        **extra: Any,
    ) -> None:
        """Convenience — write a ``stage_complete`` event."""
        await self.write_event(
            job_id,
            JobEvent(
                "stage_complete",
                {"stage": stage, "progress_percent": progress_pct, **extra},
            ),
        )

    async def write_complete(
        self,
        job_id: str,
        result: dict[str, Any],
    ) -> None:
        """Convenience — write a ``complete`` event."""
        await self.write_event(
            job_id,
            JobEvent("complete", {"result": result}),
        )

    # ------------------------------------------------------------------
    # Read path (polling — used by the HTTP GET /events endpoint)
    # ------------------------------------------------------------------

    async def read_events(
        self,
        job_id: str,
        since_seq: int = 0,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        """Return stored events from *since_seq* onward.

        ``since_seq`` is a zero-based index into the Redis list (the log is
        append-only so Redis list indices double as sequence numbers).
        """
        log_key = f"job:{job_id}:log"
        raw_entries = await self._redis.lrange(
            log_key, since_seq, since_seq + limit - 1
        )
        return [json.loads(e) for e in raw_entries]

    async def event_count(self, job_id: str) -> int:
        """Return the total number of stored events for *job_id*."""
        result = await self._redis.llen(f"job:{job_id}:log")
        return int(result) if result is not None else 0

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    async def clear_events(self, job_id: str) -> None:
        """Remove all stored events for *job_id*."""
        await self._redis.delete(f"job:{job_id}:log")


__all__ = [
    "JobEvent",
    "JobEventStore",
]
