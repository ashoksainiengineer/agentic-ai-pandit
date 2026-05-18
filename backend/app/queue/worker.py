"""Background job worker — picks up rectification jobs and runs the BTR
LangGraph pipeline.

Design
------
- Push-based: jobs are submitted to an :class:`asyncio.Queue` from the
  ``POST /rectify`` handler.
- A single consumer loop runs as an asyncio task during the app lifespan.
- The worker is a simple finite state machine:

    submitted (queued) → claimed (running) → completed | failed

- Each pipeline stage emits events to ``JobEventStore`` which both persists
  them (Redis list) and publishes them (Redis pub/sub) for SSE delivery.
"""

from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass
from datetime import UTC
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.operations import (
    CompleteJobInput,
    FailJobInput,
    UpdateJobProgressInput,
    complete_job,
    fail_job,
    get_job_by_id,
    get_session_by_id,
    mark_job_running,
    update_job_progress,
)
from app.event_store import JobEvent, JobEventStore
from app.models.events import BirthData, LifeEvent

log = structlog.get_logger()

# ---------------------------------------------------------------------------
# Submitted job descriptor
# ---------------------------------------------------------------------------


@dataclass
class JobSubmission:
    """Payload pushed onto the worker queue by the API handler."""

    job_id: str
    session_id: str


# ---------------------------------------------------------------------------
# Worker
# ---------------------------------------------------------------------------


class JobWorker:
    """Background worker that consumes rectification jobs.

    Usage::

        worker = JobWorker(event_store)
        worker.start(app_state)
        ...
        await worker.submit(JobSubmission(job_id="...", session_id="..."))
        ...
        await worker.stop()
    """

    def __init__(self, event_store: JobEventStore) -> None:
        self._event_store: JobEventStore = event_store
        self._queue: asyncio.Queue[JobSubmission] = asyncio.Queue()
        self._task: asyncio.Task[None] | None = None
        self._stop_requested: bool = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Launch the background consumer loop.  Idempotent."""
        if self._task is not None:
            return
        self._stop_requested = False
        self._task = asyncio.create_task(self._run())
        log.info("job_worker_started")

    async def stop(self) -> None:
        """Signal the consumer to stop and wait for it to finish."""
        self._stop_requested = True
        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None
        log.info("job_worker_stopped")

    async def submit(self, submission: JobSubmission) -> None:
        """Enqueue a job for processing.

        Safe to call from any coroutine — returns immediately.
        """
        await self._queue.put(submission)

    # ------------------------------------------------------------------
    # Consumer loop
    # ------------------------------------------------------------------

    async def _run(self) -> None:
        """Consume jobs from the queue forever (until cancelled)."""
        while not self._stop_requested:
            try:
                submission = await asyncio.wait_for(
                    self._queue.get(),
                    timeout=1.0,  # Poll with 1s timeout so stop is responsive
                )
            except TimeoutError:
                continue

            try:
                await self._process(submission)
            except Exception as exc:
                log.error(
                    "job_worker_crash",
                    job_id=submission.job_id,
                    error=str(exc)[:500],
                    exc_info=True,
                )
            finally:
                self._queue.task_done()

    # ------------------------------------------------------------------
    # Process a single job
    # ------------------------------------------------------------------

    async def _process(self, submission: JobSubmission) -> None:
        """Run the full BTR pipeline for a single job."""
        job_id = submission.job_id
        log.info("job_processing_start", job_id=job_id)

        from app.db.engine import get_db

        async for db in get_db():
            await self._run_pipeline(db, job_id, submission.session_id)

    async def _run_pipeline(
        self,
        db: AsyncSession,
        job_id: str,
        session_id: str,
    ) -> None:
        """Execute the pipeline stages with event emission."""

        # ---- 1. Claim the job ----
        job = await get_job_by_id(db, job_id)
        if job is None:
            log.warning("job_not_found", job_id=job_id)
            return

        job = await mark_job_running(db, job_id)
        if job is None:
            log.warning("job_claim_failed", job_id=job_id)
            return
        await db.commit()

        try:
            # ---- 2. Load session data ----
            session = await get_session_by_id(db, session_id)
            if session is None:
                await self._fail(db, job_id, "session_not_found", "Session not found")
                return

            await self._event_store.write_event(
                job_id,
                JobEvent(
                    "progress", {"message": "Session loaded", "progress_percent": 5}
                ),
            )

            # ---- 3. Parse birth data ----
            birth_data = self._build_birth_data(session)

            # ---- 4. Parse life events ----
            anchor_events = self._parse_life_events(session)

            # ---- 5. Notify: starting pipeline ----
            await self._event_store.write_event(
                job_id,
                JobEvent(
                    "progress",
                    {
                        "message": "Starting BTR pipeline",
                        "progress_percent": 10,
                        "stage": "lagna",
                    },
                ),
            )

            # ---- 6. Build initial state ----
            initial_candidates = await self._generate_candidates(birth_data)

            initial_state: dict[str, Any] = {
                "birth_data": birth_data,
                "anchor_events": anchor_events,
                "candidates": initial_candidates,
                "eliminated": [],
                "verdicts": [],
                "scores": {},
                "critic_iterations": 0,
                "final_rectified_time": None,
                "confidence": None,
                "current_stage": "lagna",
                "tool_call_count": 0,
                "token_usage": {},
                "stage_log": [],
                "messages": [],
            }

            # ---- 7. Compile and run the graph ----
            from app.orchestration.graph import compile_btr_graph

            graph = compile_btr_graph(recursion_limit=100)

            # Wrap the graph invoke with event emission for each stage
            result = await self._invoke_with_events(
                db,
                job_id,
                graph,
                initial_state,
            )

            # ---- 8. Write results ----
            rectified_time = result.get("final_rectified_time")
            confidence = result.get("confidence")
            score = result.get("scores", {})
            verdicts = [v.model_dump() for v in result.get("verdicts", [])]

            outcome = {
                "rectified_time": rectified_time,
                "confidence": confidence,
                "scores": score,
                "verdicts": verdicts,
                "stage_log": result.get("stage_log", []),
            }

            await self._event_store.write_complete(job_id, outcome)

            if rectified_time:
                from app.db.operations import update_session

                await update_session(
                    db,
                    session_id,
                    rectified_time=rectified_time,
                    confidence=str(confidence) if confidence else None,
                    status="complete",
                )

            # Mark job as completed
            await complete_job(db, CompleteJobInput(job_id=job_id, result_json=outcome))
            await db.commit()

            log.info(
                "job_completed",
                job_id=job_id,
                rectified_time=rectified_time,
                confidence=confidence,
            )

        except Exception as exc:
            await db.rollback()
            await self._event_store.write_error(
                job_id,
                str(exc)[:2000],
            )
            await self._fail(db, job_id, "pipeline_error", str(exc)[:2000])
            await db.commit()
            log.error("job_failed", job_id=job_id, error=str(exc)[:500])

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _invoke_with_events(
        self,
        db: AsyncSession,
        job_id: str,
        graph: Any,
        initial_state: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the graph and emit stage events as it progresses.

        This wraps the compiled LangGraph so every stage transition is
        visible via the event store.
        """
        # Because LangGraph's compiled graph doesn't expose per-node
        # callbacks in its simplest API, we emit events before/after
        # and rely on the graph's internal ``current_stage`` state
        # updates (which each node sets via its return dict).

        stages = ["lagna", "dasha", "varga", "forensic", "critic"]
        total_stages = len(stages)
        progress_per_stage = 70.0 / total_stages  # 10% → 80% for pipeline

        current_pct = 10.0

        # Emit a "thinking" event for each expected stage
        for _idx, stage in enumerate(stages):
            await self._event_store.write_event(
                job_id,
                JobEvent(
                    "thinking",
                    {
                        "stage": stage,
                        "message": f"Starting {stage} filter",
                    },
                ),
            )

        # Run the pipeline
        result: dict[str, Any] = await graph.ainvoke(initial_state)

        # Emit stage-complete events based on what the graph produced
        stage_log = result.get("stage_log", [])
        if stage_log:
            for entry in stage_log:
                await self._event_store.write_stage_complete(
                    job_id,
                    entry.get("stage", "unknown"),
                    entry.get("progress_percent", current_pct),
                )
                await self._event_store.write_event(
                    job_id,
                    JobEvent("candidate_score", entry),
                )
                current_pct += progress_per_stage

                # Persist progress to DB
                await update_job_progress(
                    db,
                    UpdateJobProgressInput(
                        job_id=job_id,
                        progress_percent=int(current_pct),
                        current_stage=entry.get("stage", "unknown"),
                        cursor_json={"stage_log": stage_log},
                    ),
                )
        else:
            # Fallback: emit synthetic events from the result state
            final_stage = result.get("current_stage", "complete")
            verdicts = result.get("verdicts", [])
            scores = result.get("scores", {})

            await self._event_store.write_stage_complete(
                job_id,
                final_stage,
                80.0,
                verdict_count=len(verdicts),
                score_summary=scores,
            )

        # Final progress bump
        await update_job_progress(
            db,
            UpdateJobProgressInput(
                job_id=job_id,
                progress_percent=90,
                current_stage="complete",
            ),
        )

        return result

    @staticmethod
    def _build_birth_data(session: Any) -> BirthData:
        """Convert a DB Session row to a ``BirthData`` model."""
        return BirthData(
            full_name=session.full_name,
            date_of_birth=session.date_of_birth,
            tentative_time=session.tentative_time,
            birth_place=session.birth_place,
            latitude=session.latitude,
            longitude=session.longitude,
            timezone=session.timezone,
            gender=session.gender if session.gender else None,
        )

    @staticmethod
    def _parse_life_events(session: Any) -> list[LifeEvent]:
        """Parse the session's ``life_events`` JSON string into models."""
        if not session.life_events:
            return []
        import json

        try:
            raw = (
                json.loads(session.life_events)
                if isinstance(session.life_events, str)
                else session.life_events
            )
            if isinstance(raw, list):
                return [LifeEvent(**evt) for evt in raw]
            return []
        except (json.JSONDecodeError, TypeError, ValueError) as exc:
            log.warning("life_events_parse_failed", error=str(exc)[:200])
            return []

    async def _generate_candidates(
        self,
        birth_data: BirthData,
    ) -> list[Any]:
        """Generate initial candidate time packages from birth data.

        Creates candidate times at various offsets from the tentative birth
        time so the pipeline can evaluate which offset best fits the life
        events.
        """
        from datetime import datetime, timedelta, timezone

        import structlog

        _log = structlog.get_logger()

        try:
            base_dt_str = f"{birth_data.date_of_birth}T{birth_data.tentative_time}"
            tz_offset = (
                birth_data.timezone
                if isinstance(birth_data.timezone, (int, float))
                else 0
            )
            tz = timezone(timedelta(hours=tz_offset))
            base_dt = datetime.strptime(base_dt_str, "%Y-%m-%dT%H:%M:%S").replace(
                tzinfo=tz
            )
            base_utc = base_dt.astimezone(UTC)
        except (ValueError, TypeError) as exc:
            _log.warning("candidate_gen_time_parse_fail", error=str(exc)[:200])
            return []

        offset_minutes = [-30, -15, -10, -5, -2, 0, 2, 5, 10, 15, 30]
        candidates: list[Any] = []

        from app.models.btr import Ascendant, CandidateDataPackage

        for offset in offset_minutes:
            candidate_time = base_utc + timedelta(minutes=offset)
            time_str = candidate_time.strftime("%Y-%m-%dT%H:%M:%SZ")

            candidate = CandidateDataPackage(
                time=time_str,
                offset_minutes=offset,
                candidate_key=f"offset_{offset:+d}",
                candidate_date=candidate_time.strftime("%Y-%m-%d"),
                planets={},
                ascendant=Ascendant(sign="Unknown", degree="0.0"),
                house_lords={},
                moon_nakshatra="",
                vimshottari_dasha=[],
            )
            candidates.append(candidate)

        _log.info("candidates_generated", count=len(candidates))
        return candidates

    # ------------------------------------------------------------------
    # Failure helper
    # ------------------------------------------------------------------

    async def _fail(
        self,
        db: AsyncSession,
        job_id: str,
        error_code: str,
        error_message: str,
    ) -> None:
        """Mark the job as failed and record the error."""
        await fail_job(
            db,
            FailJobInput(
                job_id=job_id, error_code=error_code, error_message=error_message
            ),
        )
        await self._event_store.write_error(
            job_id, error_message, error_code=error_code
        )
        log.warning("job_failed", job_id=job_id, error_code=error_code)


__all__ = [
    "JobSubmission",
    "JobWorker",
]
