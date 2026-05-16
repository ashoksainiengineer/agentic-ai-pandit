"""BTR Rectification router — submit, poll, stream, cancel.

Ported from the ai-pandit-app Express ``/api/v1/rectify`` routes.
"""

from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user, get_db
from app.db.operations import CreateJobInput as DbCreateJobInput
from app.db.operations import (
    create_job as db_create_job,
)
from app.db.operations import (
    get_job_by_id as db_get_job,
)

log = structlog.get_logger()

router = APIRouter(prefix="/api/v1/rectify", tags=["rectify"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class RectifyRequest(BaseModel):
    session_id: str


class RectifyResponse(BaseModel):
    job_id: str
    status: str = "queued"


class JobStatusResponse(BaseModel):
    job_id: str
    session_id: str
    status: str
    current_stage: str | None = None
    progress_percent: float | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


class CancelResponse(BaseModel):
    job_id: str
    status: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("", response_model=RectifyResponse, status_code=202)
async def submit_rectification(
    body: RectifyRequest,
    db: AsyncSession = Depends(get_db),
    user: dict[str, Any] = Depends(get_current_user),
) -> RectifyResponse:
    """Submit a BTR rectification job for the given session.

    Returns a ``job_id`` immediately (HTTP 202).  The job runs asynchronously
    through the LangGraph pipeline via the background worker.
    """
    from app.api.deps import get_worker

    job_id = str(uuid4())
    user_id = user.get("sub", "unknown")

    job = await db_create_job(
        db,
        DbCreateJobInput(
            id=job_id,
            session_id=body.session_id,
            user_id=user_id,
            kind="btr_rectification",
        ),
    )

    try:
        worker = get_worker()
        if worker is not None:
            from app.queue.worker import JobSubmission

            await worker.submit(JobSubmission(job_id=job.id, session_id=body.session_id))
            log.info(
                "rectification_dispatched",
                job_id=job_id,
                session_id=body.session_id,
            )
        else:
            log.warning("rectification_worker_unavailable", job_id=job_id)
    except Exception as exc:
        log.error("rectification_dispatch_failed", job_id=job_id, error=str(exc)[:200])

    log.info(
        "rectification_submitted",
        job_id=job_id,
        session_id=body.session_id,
        user_id=user_id,
    )

    return RectifyResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_rectification_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> JobStatusResponse:
    """Poll the status of a rectification job."""
    job = await db_get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job.id,
        session_id=job.session_id,
        status=job.status,
        current_stage=job.current_stage,
        progress_percent=job.progress_percent,
        result=job.result_json,
        error_message=job.error_message,
        created_at=job.created_at.isoformat() if job.created_at else "",
        updated_at=job.updated_at.isoformat() if job.updated_at else "",
    )


@router.get("/{job_id}/stream")
async def stream_rectification(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> EventSourceResponse:
    """SSE stream of rectification progress events.

    Yields ``progress``, ``thinking``, ``candidate_score``,
    ``stage_complete``, ``complete``, and ``error`` events.
    """
    from app.api.deps import get_redis

    job = await db_get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    channel = f"job:{job_id}:events"

    async def event_generator() -> Any:
        redis = await get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)

        try:
            # Replay stored events
            stored = await redis.lrange(f"job:{job_id}:log", 0, -1)
            for entry in reversed(stored):
                data = json.loads(entry)
                yield {"event": data.get("event", "message"), "data": entry}

            # Stream new events
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data_str = message["data"]
                    if isinstance(data_str, bytes):
                        data_str = data_str.decode()
                    data = json.loads(data_str)
                    yield {
                        "event": data.get("event", "message"),
                        "data": data_str,
                    }
        except Exception:
            log.warning("sse_stream_error", job_id=job_id, exc_info=True)
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    return EventSourceResponse(event_generator())


@router.get("/{job_id}/events")
async def get_job_events(
    job_id: str,
    since_seq: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    """Incremental polling — returns events after ``since_seq``."""
    from app.api.deps import get_redis

    redis = await get_redis()
    entries = await redis.lrange(f"job:{job_id}:log", since_seq, -1)
    return [json.loads(e) for e in entries]


@router.post("/{job_id}/cancel", response_model=CancelResponse)
async def cancel_rectification(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict[str, Any] = Depends(get_current_user),
) -> CancelResponse:
    """Request cancellation of a running rectification job."""
    from app.api.deps import get_redis

    job = await db_get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    from app.db.operations import update_session as db_update_job

    await db_update_job(db, job.id, status="cancelled")

    redis = await get_redis()
    await redis.publish(f"job:{job_id}:events", json.dumps({"event": "cancelled"}))

    log.info("rectification_cancelled", job_id=job_id)
    return CancelResponse(job_id=job_id, status="cancelled")
