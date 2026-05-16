"""FastAPI dependencies — Redis client, Clerk auth, ToolRegistry, compiled graph.

All dependencies are lazy singletons: initialised on first access during a
request.  This avoids reading env vars or connecting to external services at
import time.
"""

from __future__ import annotations

from typing import Any

import structlog
from redis.asyncio import Redis as AsyncRedis

from app.config import Settings, get_settings
from app.db.engine import get_db as _get_db
from app.tools.base import ToolRegistry
from app.tools.definitions import register_all

log = structlog.get_logger()

# ---------------------------------------------------------------------------
# Lazy module-level singletons
# ---------------------------------------------------------------------------

_redis: AsyncRedis[Any] | None = None
_registry: ToolRegistry | None = None
_graph: Any = None  # Compiled LangGraph
_event_store: Any = None  # JobEventStore — set during lifespan
_worker: Any = None  # JobWorker — set during lifespan

# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------


async def get_redis() -> AsyncRedis[Any]:
    """Return the shared Redis client, initialising it lazily on first call.

    Idempotent — safe to call from multiple lifespan handlers or request
    dependencies.
    """
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = AsyncRedis.from_url(
            settings.redis_url,
            decode_responses=False,
            socket_connect_timeout=5,
        )
        await _redis.ping()
        log.info("redis_connected")
    return _redis


async def close_redis() -> None:
    """Close the shared Redis client.  Idempotent."""
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None
        log.info("redis_disconnected")


# ---------------------------------------------------------------------------
# ToolRegistry
# ---------------------------------------------------------------------------


async def get_tool_registry() -> ToolRegistry:
    """Return the shared ToolRegistry, initialising it lazily on first call.

    Registers all 18 BTR tools and wires up the Redis-backed cache.
    """
    global _registry
    if _registry is None:
        from app.tools.base import ToolCache

        redis = await get_redis()
        cache = ToolCache(redis_client=redis)

        _registry = ToolRegistry(cache=cache)
        register_all(_registry)
        log.info("tool_registry_initialised", tool_count=_registry.tool_count)
    return _registry


# ---------------------------------------------------------------------------
# Compiled LangGraph
# ---------------------------------------------------------------------------


async def get_graph() -> Any:
    """Return the compiled BTR LangGraph, compiling it lazily on first call.

    The graph is compiled without a checkpointer by default — the
    ``compile_btr_graph`` accepts an optional ``PostgresSaver`` for
    production deployments.
    """
    global _graph
    if _graph is None:
        from app.orchestration.graph import compile_btr_graph

        _graph = compile_btr_graph()
        log.info("btr_graph_compiled")
    return _graph


# ---------------------------------------------------------------------------
# Event Store & Job Worker (set during lifespan)
# ---------------------------------------------------------------------------


def set_event_store(store: Any) -> None:
    """Set the module-level JobEventStore reference."""
    global _event_store
    _event_store = store


def set_worker(worker: Any) -> None:
    """Set the module-level JobWorker reference."""
    global _worker
    _worker = worker


def get_event_store() -> Any:
    """Return the shared JobEventStore instance."""
    return _event_store


def get_worker() -> Any:
    """Return the shared JobWorker instance."""
    return _worker


# ---------------------------------------------------------------------------
# Clerk Auth
# ---------------------------------------------------------------------------


def _verify_clerk_token(token: str, settings: Settings) -> dict[str, Any]:
    """Verify a Clerk JWT and return its payload.

    Uses the Clerk PEM-encoded public key from ``clerk_secret_key``.

    Returns the decoded claims dict, or raises ``PermissionError``.
    """

    from jwt import PyJWKClient
    from jwt import decode as jwt_decode
    from jwt import exceptions as jwt_exc

    try:
        jwks_url = "https://clerk.accounts.dev/.well-known/jwks.json"
        jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload: dict[str, Any] = jwt_decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.app_name,
            options={
                "verify_exp": True,
            },
        )
        return payload
    except jwt_exc.ExpiredSignatureError:
        raise PermissionError("Token has expired") from None
    except jwt_exc.InvalidTokenError as exc:
        raise PermissionError(f"Invalid token: {exc}") from None
    except Exception as exc:
        log.warning("clerk_verify_failed", error=str(exc)[:200])
        raise PermissionError("Authentication failed") from exc


async def get_current_user(
    authorization: str | None = None,
) -> dict[str, Any]:
    """FastAPI dependency that extracts the authenticated user from a
    ``Bearer`` token.

    Usage::

        @router.get("/me")
        async def me(user: dict = Depends(get_current_user)):
            return {"user_id": user["sub"]}
    """
    settings = get_settings()

    if settings.is_test or settings.is_development:
        return {"sub": "test_user_001", "role": "user"}

    if authorization is None or not authorization.startswith("Bearer "):
        raise PermissionError("Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    return _verify_clerk_token(token, settings)


# ---------------------------------------------------------------------------
# Re-export database dependency for convenience
# ---------------------------------------------------------------------------

get_db = _get_db


__all__ = [
    "close_redis",
    "get_current_user",
    "get_db",
    "get_event_store",
    "get_graph",
    "get_redis",
    "get_tool_registry",
    "get_worker",
    "set_event_store",
    "set_worker",
]
