"""FastAPI application factory — create_app(), lifespan, router registration.

Usage::

    uvicorn app.main:app --reload
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.api.deps import close_redis, get_tool_registry, set_event_store, set_worker
from app.api.middleware.auth import AuthMiddleware
from app.api.middleware.error_handler import exception_handler
from app.api.middleware.rate_limit import RateLimitMiddleware
from app.api.middleware.request_id import RequestIDMiddleware
from app.api.routers import (
    admin_router,
    candidate_router,
    health_router,
    rectify_router,
    sessions_router,
)
from app.config import get_settings

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — initialise services on startup, clean up on
    shutdown."""
    settings = get_settings()
    log.info(
        "ai_pandit_startup",
        app_version="0.1.0",
        env=settings.app_env.value,
    )

    # Warm up the tool registry (loads tools + connects Redis)
    try:
        registry = await get_tool_registry()
        log.info(
            "tool_registry_warmed",
            tool_count=registry.tool_count,
        )
    except Exception:
        log.warning("tool_registry_warmup_failed", exc_info=True)

    # Initialise the job event store and background worker
    try:
        from app.api.deps import get_redis

        redis = await get_redis()
        from app.event_store import JobEventStore

        store = JobEventStore(redis)
        set_event_store(store)

        from app.queue.worker import JobWorker

        worker = JobWorker(store)
        set_worker(worker)
        worker.start()
        log.info("job_worker_started")
    except Exception:
        log.warning("job_worker_init_failed", exc_info=True)

    yield

    # Graceful shutdown
    try:
        from app.api.deps import get_worker as _get_worker

        w = _get_worker()
        if w is not None:
            await w.stop()
    except Exception:
        log.warning("job_worker_stop_failed", exc_info=True)

    await close_redis()
    log.info("ai_pandit_shutdown")


def create_app() -> FastAPI:
    """Build and return a fully configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AI-Pandit Agentic BTR",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    # ── Exception handlers ─────────────────────────────────────────
    app.add_exception_handler(Exception, exception_handler)

    # ── CORS ───────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Custom middleware ──────────────────────────────────────────
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(AuthMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # ── Prometheus metrics ─────────────────────────────────────────
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    # ── Routers ────────────────────────────────────────────────────
    app.include_router(health_router)
    app.include_router(sessions_router)
    app.include_router(rectify_router)
    app.include_router(candidate_router)
    app.include_router(admin_router)

    log.info(
        "app_created",
        routes=len(app.routes),
        middleware=len(app.user_middleware),
    )

    return app


# Lazy module-level ``app`` — created on first access so that importing
# ``app.main`` (e.g. in tests) does **not** require env vars.
_app: Any | None = None


def __getattr__(name: str) -> Any:
    if name == "app":
        global _app
        if _app is None:
            _app = create_app()
        return _app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
