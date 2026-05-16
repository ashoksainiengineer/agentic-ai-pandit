"""CRUD operations for jobs, sessions, job events, artifacts, and
idempotency keys — the async SQLAlchemy port of the TypeScript
``packages/db/src/jobs.ts`` module.

Every public function accepts an explicit :class:`AsyncSession` so callers
can wire it through FastAPI dependencies or direct construction.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, asc, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Artifact,
    IdempotencyKey,
    Job,
    JobAttempt,
    JobEvent,
    Session,
    SessionFavorite,
    User,
)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

_T = datetime.now(UTC)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _maybe_utc(ts: datetime | None) -> datetime | None:
    """Ensure *ts* is timezone-aware.  Naive datetimes are interpreted as
    UTC — this mirrors the TypeScript codebase which always stores ISO
    strings in UTC."""
    if ts is not None and ts.tzinfo is None:
        return ts.replace(tzinfo=UTC)
    return ts


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------

@dataclass
class CreateSessionInput:
    user_id: str
    external_id: str
    full_name: str
    date_of_birth: str
    tentative_time: str
    birth_place: str
    latitude: float
    longitude: float
    timezone: str
    gender: str | None = None
    life_events: str | None = None
    spouse_data: str | None = None
    offset_config: str | None = None


async def create_session(db: AsyncSession, input: CreateSessionInput) -> Session:
    session = Session(**dict(input.__dict__.items()))
    db.add(session)
    await db.flush()
    return session


async def get_session_by_id(db: AsyncSession, session_id: str) -> Session | None:
    result = await db.execute(select(Session).where(Session.id == session_id))
    return result.scalar_one_or_none()


async def update_session(
    db: AsyncSession,
    session_id: str,
    **updates: Any,
) -> Session | None:
    result = await db.execute(
        update(Session)
        .where(Session.id == session_id)
        .values(**updates, updated_at=_utcnow())
        .returning(Session)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def delete_session(db: AsyncSession, session_id: str) -> bool:
    result = await db.execute(
        update(Session)
        .where(Session.id == session_id, Session.deleted_at.is_(None))
        .values(deleted_at=_utcnow())
        .returning(Session.id)
    )
    await db.flush()
    return result.scalar() is not None


async def list_sessions_for_user(
    db: AsyncSession,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> list[Session]:
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id, Session.deleted_at.is_(None))
        .order_by(desc(Session.created_at))
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def clone_session(db: AsyncSession, session_id: str) -> Session | None:
    original = await get_session_by_id(db, session_id)
    if original is None:
        return None
    new_session = Session(
        user_id=original.user_id,
        external_id=original.external_id,
        full_name=original.full_name,
        date_of_birth=original.date_of_birth,
        tentative_time=original.tentative_time,
        birth_place=original.birth_place,
        latitude=original.latitude,
        longitude=original.longitude,
        timezone=original.timezone,
        gender=original.gender,
        life_events=original.life_events,
        spouse_data=original.spouse_data,
        offset_config=original.offset_config,
    )
    db.add(new_session)
    await db.flush()
    return new_session


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------

async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_external_id(db: AsyncSession, external_id: str) -> User | None:
    result = await db.execute(select(User).where(User.external_id == external_id))
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Job CRUD
# ---------------------------------------------------------------------------

@dataclass
class CreateJobInput:
    id: str
    session_id: str
    user_id: str
    kind: str = "btr_rectification"
    priority: int = 100
    max_attempts: int = 3
    checkpoint_json: dict[str, Any] | None = None
    cursor_json: dict[str, Any] | None = None


async def create_job(db: AsyncSession, input: CreateJobInput) -> Job:
    job = Job(
        id=input.id,
        session_id=input.session_id,
        user_id=input.user_id,
        kind=input.kind,
        status="queued",
        priority=input.priority,
        max_attempts=input.max_attempts,
        checkpoint_json=input.checkpoint_json,
        cursor_json=input.cursor_json,
    )
    db.add(job)
    await db.flush()
    return job


async def get_job_by_id(db: AsyncSession, job_id: str) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def get_latest_job_for_session(db: AsyncSession, session_id: str) -> Job | None:
    result = await db.execute(
        select(Job)
        .where(Job.session_id == session_id)
        .order_by(desc(Job.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_active_jobs(db: AsyncSession, limit: int = 100) -> list[Job]:
    result = await db.execute(
        select(Job)
        .where(Job.status.in_(["queued", "running", "retrying"]))
        .order_by(asc(Job.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_active_jobs(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(Job)
        .where(Job.status.in_(["queued", "running", "retrying"]))
    )
    return result.scalar() or 0


async def claim_next_queued_job(db: AsyncSession) -> Job | None:
    """Optimistic DB-level claim: find candidates, then try to update each one
    in place.  Only one worker will succeed due to the row-level lock implied
    by the UPDATE's WHERE clause match on status."""
    now = _utcnow()

    candidates = await db.execute(
        select(Job)
        .where(
            or_(
                Job.status == "queued",
                and_(Job.status == "retrying", Job.next_retry_at <= now),
            )
        )
        .order_by(asc(Job.priority), asc(Job.created_at))
        .limit(10)
    )

    for candidate in candidates.scalars().all():
        result = await db.execute(
            update(Job)
            .where(
                and_(
                    Job.id == candidate.id,
                    or_(
                        Job.status == "queued",
                        and_(Job.status == "retrying", Job.next_retry_at <= now),
                    ),
                )
            )
            .values(
                status="running",
                started_at=candidate.started_at or now,
                heartbeat_at=now,
                updated_at=now,
                error_code=None,
                error_message=None,
                retry_reason_code=None,
                next_retry_at=None,
            )
            .returning(Job)
        )
        claimed = result.scalar_one_or_none()
        if claimed is not None:
            await db.flush()
            return claimed

    return None


async def mark_job_running(
    db: AsyncSession, job_id: str, started_at: datetime | None = None
) -> Job | None:
    now = started_at or _utcnow()
    result = await db.execute(
        update(Job)
        .where(Job.id == job_id)
        .values(
            status="running",
            started_at=now,
            heartbeat_at=now,
            updated_at=now,
            error_code=None,
            error_message=None,
            retry_reason_code=None,
            next_retry_at=None,
        )
        .returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


@dataclass
class UpdateJobProgressInput:
    job_id: str
    progress_percent: int
    current_stage: str | None = None
    checkpoint_json: dict[str, Any] | None = None
    cursor_json: dict[str, Any] | None = None


async def update_job_progress(
    db: AsyncSession, input: UpdateJobProgressInput
) -> Job | None:
    now = _utcnow()
    result = await db.execute(
        update(Job)
        .where(Job.id == input.job_id)
        .values(
            current_stage=input.current_stage,
            progress_percent=input.progress_percent,
            checkpoint_json=input.checkpoint_json,
            cursor_json=input.cursor_json,
            heartbeat_at=now,
            updated_at=now,
        )
        .returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def request_job_cancellation(db: AsyncSession, job_id: str) -> Job | None:
    now = _utcnow()
    result = await db.execute(
        update(Job)
        .where(and_(Job.id == job_id, Job.cancel_requested_at.is_(None)))
        .values(cancel_requested_at=now, updated_at=now)
        .returning(Job)
    )
    await db.flush()
    claimed = result.scalar_one_or_none()
    if claimed is not None:
        return claimed
    return await get_job_by_id(db, job_id)


@dataclass
class CompleteJobInput:
    job_id: str
    result_json: dict[str, Any] | None = None


async def complete_job(db: AsyncSession, input: CompleteJobInput) -> Job | None:
    now = _utcnow()
    result = await db.execute(
        update(Job)
        .where(Job.id == input.job_id)
        .values(
            status="completed",
            progress_percent=100,
            finished_at=now,
            heartbeat_at=now,
            result_json=input.result_json,
            updated_at=now,
            error_code=None,
            error_message=None,
            retry_reason_code=None,
            next_retry_at=None,
        )
        .returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


@dataclass
class FailJobInput:
    job_id: str
    error_code: str | None = None
    error_message: str | None = None
    status: str = "failed"  # 'failed' | 'cancelled' | 'retrying'


async def fail_job(db: AsyncSession, input: FailJobInput) -> Job | None:
    now = _utcnow()
    values: dict[str, Any] = {
        "status": input.status,
        "error_code": input.error_code,
        "error_message": input.error_message,
        "heartbeat_at": now,
        "updated_at": now,
    }
    if input.status != "retrying":
        values["finished_at"] = now
        values["retry_reason_code"] = None
        values["next_retry_at"] = None

    result = await db.execute(
        update(Job).where(Job.id == input.job_id).values(**values).returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


@dataclass
class ScheduleJobRetryInput:
    job_id: str
    retry_count: int
    next_retry_at: datetime
    retry_reason_code: str | None = None
    error_code: str | None = None
    error_message: str | None = None


async def schedule_job_retry(
    db: AsyncSession, input: ScheduleJobRetryInput
) -> Job | None:
    now = _utcnow()
    result = await db.execute(
        update(Job)
        .where(Job.id == input.job_id)
        .values(
            status="retrying",
            retry_count=input.retry_count,
            retry_reason_code=input.retry_reason_code,
            next_retry_at=input.next_retry_at,
            error_code=input.error_code,
            error_message=input.error_message,
            finished_at=None,
            heartbeat_at=now,
            updated_at=now,
        )
        .returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def increment_job_attempt(db: AsyncSession, job_id: str) -> Job | None:
    current = await get_job_by_id(db, job_id)
    if current is None:
        return None
    now = _utcnow()
    result = await db.execute(
        update(Job)
        .where(and_(Job.id == job_id, Job.version == current.version))
        .values(
            attempt=current.attempt + 1,
            updated_at=now,
            heartbeat_at=now,
        )
        .returning(Job)
    )
    await db.flush()
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Job Attempt CRUD
# ---------------------------------------------------------------------------

@dataclass
class CreateJobAttemptInput:
    id: str
    job_id: str
    attempt_no: int
    worker_id: str | None = None
    lease_token: str | None = None


async def create_job_attempt(
    db: AsyncSession, input: CreateJobAttemptInput
) -> JobAttempt:
    attempt = JobAttempt(
        id=input.id,
        job_id=input.job_id,
        attempt_no=input.attempt_no,
        worker_id=input.worker_id,
        lease_token=input.lease_token,
        outcome="running",
    )
    db.add(attempt)
    await db.flush()
    return attempt


async def update_job_attempt_heartbeat(
    db: AsyncSession,
    attempt_id: str,
    checkpoint_json: dict[str, Any] | None = None,
) -> JobAttempt | None:
    now = _utcnow()
    result = await db.execute(
        update(JobAttempt)
        .where(JobAttempt.id == attempt_id)
        .values(heartbeat_at=now, checkpoint_json=checkpoint_json)
        .returning(JobAttempt)
    )
    await db.flush()
    return result.scalar_one_or_none()


@dataclass
class CompleteJobAttemptInput:
    attempt_id: str
    outcome: str  # 'completed' | 'failed' | 'cancelled' | 'abandoned'
    failure_reason: str | None = None
    failure_code: str | None = None
    checkpoint_json: dict[str, Any] | None = None


async def complete_job_attempt(
    db: AsyncSession, input: CompleteJobAttemptInput
) -> JobAttempt | None:
    now = _utcnow()
    result = await db.execute(
        update(JobAttempt)
        .where(JobAttempt.id == input.attempt_id)
        .values(
            ended_at=now,
            heartbeat_at=now,
            outcome=input.outcome,
            failure_reason=input.failure_reason,
            failure_code=input.failure_code,
            checkpoint_json=input.checkpoint_json,
        )
        .returning(JobAttempt)
    )
    await db.flush()
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Job Event CRUD (with sequence collision retry)
# ---------------------------------------------------------------------------

@dataclass
class CreateJobEventInput:
    id: str
    job_id: str
    session_id: str
    sequence_no: int
    event_type: str
    payload_json: dict[str, Any]
    stage: str | None = None


async def append_job_event(
    db: AsyncSession, input: CreateJobEventInput
) -> JobEvent:
    """Insert a job event, retrying on sequence-number collision (unique
    constraint violation on ``(job_id, sequence_no)``).

    This matches the TypeScript ``appendJobEvent`` behaviour: up to 3
    attempts, each time bumping the sequence number to the next available
    value.
    """
    next_seq = input.sequence_no
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            event = JobEvent(
                id=input.id if attempt == 0 else f"{input.id}-{attempt}",
                job_id=input.job_id,
                session_id=input.session_id,
                sequence_no=next_seq,
                event_type=input.event_type,
                stage=input.stage,
                payload_json=input.payload_json,
            )
            db.add(event)
            await db.flush()
            return event
        except Exception as exc:
            # SQLAlchemy rolls back the flushed objects on error, so we
            # need to check if it's a unique-violation-like condition.
            last_error = exc
            if attempt == 2:
                raise

            # Find the next available sequence number
            latest = await db.execute(
                select(JobEvent.sequence_no)
                .where(JobEvent.job_id == input.job_id)
                .order_by(desc(JobEvent.sequence_no))
                .limit(1)
            )
            latest_val = latest.scalar()
            next_seq = (latest_val if latest_val is not None else next_seq) + 1

    raise RuntimeError("append_job_event exhausted retries") from last_error


async def list_job_events(
    db: AsyncSession, job_id: str, limit: int = 1000
) -> list[JobEvent]:
    result = await db.execute(
        select(JobEvent)
        .where(JobEvent.job_id == job_id)
        .order_by(JobEvent.sequence_no)
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_job_events_since(
    db: AsyncSession, job_id: str, sequence_no: int, limit: int = 1000
) -> list[JobEvent]:
    result = await db.execute(
        select(JobEvent)
        .where(
            and_(JobEvent.job_id == job_id, JobEvent.sequence_no > sequence_no)
        )
        .order_by(JobEvent.sequence_no)
        .limit(limit)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Artifact CRUD
# ---------------------------------------------------------------------------

@dataclass
class CreateArtifactInput:
    id: str
    job_id: str
    uri: str
    session_id: str | None = None
    kind: str = "other"
    mime_type: str | None = None
    checksum: str | None = None
    size_bytes: int | None = None
    metadata_json: dict[str, Any] | None = None


async def create_artifact(db: AsyncSession, input: CreateArtifactInput) -> Artifact:
    artifact = Artifact(
        id=input.id,
        job_id=input.job_id,
        session_id=input.session_id,
        kind=input.kind,
        uri=input.uri,
        mime_type=input.mime_type,
        checksum=input.checksum,
        size_bytes=input.size_bytes,
        metadata_json=input.metadata_json,
    )
    db.add(artifact)
    await db.flush()
    return artifact


async def list_artifacts_for_job(
    db: AsyncSession, job_id: str, limit: int = 100
) -> list[Artifact]:
    result = await db.execute(
        select(Artifact)
        .where(Artifact.job_id == job_id)
        .order_by(desc(Artifact.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_latest_artifact_for_job_by_kind(
    db: AsyncSession, job_id: str, kind: str
) -> Artifact | None:
    result = await db.execute(
        select(Artifact)
        .where(and_(Artifact.job_id == job_id, Artifact.kind == kind))
        .order_by(desc(Artifact.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Idempotency Key CRUD
# ---------------------------------------------------------------------------

@dataclass
class CreateIdempotencyKeyInput:
    id: str
    user_id: str
    key: str
    request_hash: str
    expires_at: datetime
    session_id: str | None = None
    job_id: str | None = None


async def create_idempotency_key(
    db: AsyncSession, input: CreateIdempotencyKeyInput
) -> IdempotencyKey:
    record = IdempotencyKey(
        id=input.id,
        user_id=input.user_id,
        key=input.key,
        request_hash=input.request_hash,
        session_id=input.session_id,
        job_id=input.job_id,
        expires_at=_maybe_utc(input.expires_at),
    )
    db.add(record)
    await db.flush()
    return record


async def get_idempotency_key(
    db: AsyncSession, user_id: str, key: str
) -> IdempotencyKey | None:
    result = await db.execute(
        select(IdempotencyKey).where(
            and_(
                IdempotencyKey.user_id == user_id,
                IdempotencyKey.key == key,
            )
        )
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Session Favorites
# ---------------------------------------------------------------------------

async def add_session_favorite(
    db: AsyncSession, user_id: str, session_id: str
) -> SessionFavorite:
    fav = SessionFavorite(user_id=user_id, session_id=session_id)
    db.add(fav)
    await db.flush()
    return fav


async def remove_session_favorite(
    db: AsyncSession, user_id: str, session_id: str
) -> bool:
    result = await db.execute(
        select(SessionFavorite).where(
            and_(
                SessionFavorite.user_id == user_id,
                SessionFavorite.session_id == session_id,
            )
        )
    )
    fav = result.scalar_one_or_none()
    if fav is None:
        return False
    await db.delete(fav)
    await db.flush()
    return True


async def list_session_favorites(
    db: AsyncSession, user_id: str, limit: int = 50
) -> list[SessionFavorite]:
    result = await db.execute(
        select(SessionFavorite)
        .where(SessionFavorite.user_id == user_id)
        .order_by(desc(SessionFavorite.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())
