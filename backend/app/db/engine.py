from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import get_settings


def create_engine(database_url: str, **kwargs: Any) -> AsyncEngine:
    """Create an async SQLAlchemy engine for the given database URL.

    Uses ``NullPool`` by default — each connection is created and closed on
    demand.  This is the correct choice for serverless / ephemeral compute
    (Cloud Run, Cloud Run Jobs) where connection pooling across instances
    would leak connections.

    Parameters
    ----------
    database_url:
        Full PostgreSQL connection string, e.g.
        ``postgresql+asyncpg://user:pass@host:port/db``.
    **kwargs:
        Passed through to :func:`create_async_engine`.  Callers can override
        ``poolclass`` if persistent pooling is desired (e.g. long-lived
        workers).
    """
    kwargs.setdefault("poolclass", NullPool)
    kwargs.setdefault("echo", False)
    # Hide the password in logs while keeping the full URL for the driver
    kwargs.setdefault("hide_parameters", True)
    return create_async_engine(database_url, **kwargs)


def create_session_factory(
    engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """Return an :class:`~sqlalchemy.ext.asyncio.async_sessionmaker` bound to
    *engine*.

    ``expire_on_commit=False`` prevents the need to re-fetch objects after a
    commit, which is the typical pattern in request-response APIs.
    """
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# ---------------------------------------------------------------------------
# Module-level singleton — lazily initialised on first call to ``get_db()``.
# This avoids importing ``Settings`` / reading env vars at module load time.
# ---------------------------------------------------------------------------
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _ensure_engine() -> None:
    """Set up the module-level engine and session factory if not already
    done.  Safe to call multiple times — subsequent calls are no-ops."""
    global _engine, _session_factory  # deliberate lazy init

    if _engine is not None:
        return

    settings = get_settings()
    _engine = create_engine(settings.database_url)
    _session_factory = create_session_factory(_engine)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an :class:`AsyncSession`.

    The session is automatically closed when the request handler returns.
    Rolls back on unhandled exceptions before closing.

    Usage::

        from fastapi import Depends
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.db.engine import get_db

        @router.get("/sessions")
        async def list_sessions(db: AsyncSession = Depends(get_db)) -> ...:
            ...
    """
    _ensure_engine()

    async with _session_factory() as session:  # type: ignore[misc]
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db_readonly() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a read-only :class:`AsyncSession`.

    Never commits — rollback-only at the end of the request.
    """
    _ensure_engine()

    async with _session_factory() as session:  # type: ignore[misc]
        try:
            yield session
        finally:
            await session.rollback()


async def close_engine() -> None:
    """Dispose of the module-level engine.  Idempotent.

    Call during application shutdown::

        @app.on_event("shutdown")
        async def shutdown():
            await close_engine()
    """
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
