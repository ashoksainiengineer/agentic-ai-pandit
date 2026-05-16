from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from prometheus_client import make_asgi_app

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    log.info("ai_pandit_startup", app_version="0.1.0")
    yield
    log.info("ai_pandit_shutdown")


app = FastAPI(
    title="AI-Pandit Agentic BTR",
    version="0.1.0",
    lifespan=lifespan,
)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-pandit-agentic", "version": "0.1.0"}
