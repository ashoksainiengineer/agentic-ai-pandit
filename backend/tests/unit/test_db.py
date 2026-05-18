"""Unit tests for the database layer (engine, models, migrations).

These tests exercise factory functions, model schema introspection, and
migration validation — all without a real database connection.
"""

from __future__ import annotations

from datetime import UTC
from typing import Any

from sqlalchemy import Table
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.db.engine import close_engine, create_engine, create_session_factory
from app.db.models import (
    Artifact,
    AuditLog,
    Base,
    Calculation,
    DataRetention,
    IdempotencyKey,
    Job,
    JobAttempt,
    JobEvent,
    Session,
    SessionFavorite,
    User,
)


class TestEngine:
    """Factory functions for async engine / session creation."""

    def test_create_engine_returns_async_engine(self) -> None:
        engine = create_engine("postgresql+psycopg://u:p@localhost/db")
        assert isinstance(engine, AsyncEngine)
        assert (
            engine.url.render_as_string(hide_password=False)
            == "postgresql+psycopg://u:p@localhost/db"
        )

    def test_create_engine_uses_null_pool_by_default(self) -> None:
        engine = create_engine("postgresql+psycopg://u:p@localhost/db")
        assert isinstance(engine.pool, NullPool)

    def test_create_engine_passes_kwargs(self) -> None:
        engine = create_engine("postgresql+psycopg://u:p@localhost/db", echo=True)
        assert engine.echo is True

    def test_create_session_factory_returns_async_sessionmaker(self) -> None:
        engine = create_engine("postgresql+psycopg://u:p@localhost/db")
        factory = create_session_factory(engine)
        assert isinstance(factory, async_sessionmaker)

    async def test_close_engine_safe_when_none(self) -> None:
        """close_engine() must not raise when no engine was initialised."""
        await close_engine()


class TestModelSchema:
    """Verify that all 11 models are correctly registered on Base.metadata."""

    def test_all_tables_registered(self) -> None:
        table_names = {t.name for t in Base.metadata.sorted_tables}
        expected = {
            "users",
            "sessions",
            "jobs",
            "job_attempts",
            "job_events",
            "session_favorites",
            "calculations",
            "audit_logs",
            "data_retention",
            "artifacts",
            "idempotency_keys",
        }
        assert table_names == expected, f"Missing tables: {expected - table_names}"

    # --- Column count & primary key sanity checks ---

    @staticmethod
    def _table(model: Any) -> Table:
        """Narrow the ORM ``__table__`` (``FromClause`` in stubs) to
        :class:`~sqlalchemy.Table` so that mypy can resolve ``.columns``,
        ``.primary_key``, and ``.constraints``."""
        t = model.__table__
        assert isinstance(t, Table), f"expected Table, got {type(t)}"
        return t

    def test_users_columns(self) -> None:
        t = self._table(User)
        assert len(t.columns) == 10
        assert set(t.primary_key.columns.keys()) == {"id"}
        assert t.columns["external_id"].unique is True

    def test_sessions_columns(self) -> None:
        t = self._table(Session)
        assert len(t.columns) == 34
        assert set(t.primary_key.columns.keys()) == {"id"}
        assert t.columns["status"].default is not None

    def test_jobs_columns_and_constraints(self) -> None:
        t = self._table(Job)
        assert len(t.columns) == 26
        assert set(t.primary_key.columns.keys()) == {"id"}
        ck_names = {c.name for c in t.constraints if hasattr(c, "name")}
        assert "jobs_progress_percent_check" in ck_names
        assert "jobs_version_check" in ck_names

    def test_job_attempts_columns(self) -> None:
        t = self._table(JobAttempt)
        assert len(t.columns) == 13
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_job_events_columns(self) -> None:
        t = self._table(JobEvent)
        assert len(t.columns) == 8
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_session_favorites_columns(self) -> None:
        t = self._table(SessionFavorite)
        assert len(t.columns) == 5
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_calculations_columns(self) -> None:
        t = self._table(Calculation)
        assert len(t.columns) == 14
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_audit_logs_columns(self) -> None:
        t = self._table(AuditLog)
        assert len(t.columns) == 14
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_data_retention_columns(self) -> None:
        t = self._table(DataRetention)
        assert len(t.columns) == 12
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_artifacts_columns(self) -> None:
        t = self._table(Artifact)
        assert len(t.columns) == 10
        assert set(t.primary_key.columns.keys()) == {"id"}

    def test_idempotency_keys_columns(self) -> None:
        t = self._table(IdempotencyKey)
        assert len(t.columns) == 8
        assert set(t.primary_key.columns.keys()) == {"id"}


class TestOperationsHelpers:
    """Lightweight smoke tests for the CRUD module's private helpers."""

    def test_utcnow_returns_aware_datetime(self) -> None:
        from app.db.operations import _utcnow

        now = _utcnow()
        assert now.tzinfo is not None
        assert now.tzinfo.utcoffset(now) is not None

    def test_maybe_utc_naive(self) -> None:
        from datetime import datetime

        from app.db.operations import _maybe_utc

        result = _maybe_utc(datetime(2026, 1, 1, 12, 0, 0))
        assert result is not None
        assert result.tzinfo is not None
        assert result.hour == 12

    def test_maybe_utc_aware(self) -> None:
        from datetime import datetime

        from app.db.operations import _maybe_utc

        d = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
        result = _maybe_utc(d)
        assert result is d  # returned as-is

    def test_maybe_utc_none(self) -> None:
        from app.db.operations import _maybe_utc

        assert _maybe_utc(None) is None

    def test_create_job_input_defaults(self) -> None:
        from app.db.operations import CreateJobInput

        inp = CreateJobInput(id="job_1", session_id="ses_1", user_id="usr_1")
        assert inp.kind == "btr_rectification"
        assert inp.priority == 100
        assert inp.max_attempts == 3

    def test_create_session_input(self) -> None:
        from app.db.operations import CreateSessionInput

        inp = CreateSessionInput(
            user_id="usr_1",
            external_id="ext_1",
            full_name="Test",
            date_of_birth="1999-06-16",
            tentative_time="10:30:00",
            birth_place="Delhi",
            latitude=28.61,
            longitude=77.20,
            timezone="Asia/Kolkata",
        )
        assert inp.full_name == "Test"
        assert inp.gender is None
