"""Tool Registry Framework — register, call, cache, circuit-break.

Ported from the agentic pattern in ai-pandit-app but implemented fresh
for Python with Redis-backed LRU cache, tenacity retry, and per-tool
circuit breaker with configurable thresholds.
"""

from __future__ import annotations

import hashlib
import json
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

import structlog
from pydantic import BaseModel
from redis.asyncio import Redis as AsyncRedis
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

log = structlog.get_logger()


# ──────────────────────────────────────────────────────────────
# ToolError hierarchy
# ──────────────────────────────────────────────────────────────


class ToolError(Exception):
    """Base for all registry-level tool errors."""


class ToolNotFoundError(ToolError):
    """Raised when calling an unregistered tool name."""


class ToolRegistrationError(ToolError):
    """Raised when registering a duplicate name or invalid schema."""


class ToolCircuitOpenError(ToolError):
    """Raised when the circuit breaker is open for a tool."""


class ToolExecutionError(ToolError):
    """Raised when the tool function itself raises."""


class ToolCacheError(ToolError):
    """Raised on Redis cache failures (never propagated — cached calls degrade to uncached)."""


# ──────────────────────────────────────────────────────────────
# Typed schema helpers
# ──────────────────────────────────────────────────────────────

T = TypeVar("T", bound=BaseModel)
R = TypeVar("R", bound=BaseModel)


class ToolSpec(BaseModel):
    """Declarative metadata for a registered tool."""

    name: str
    description: str
    input_schema: type[BaseModel]  # Pydantic model class (used for validation)
    output_schema: type[BaseModel]
    cache_ttl_seconds: int = 300  # 5 min default
    is_fallback_safe: bool = False  # can this run in algorithmic fallback mode?


ToolFn = Callable[..., Awaitable[BaseModel]]


# ──────────────────────────────────────────────────────────────
# Circuit Breaker
# ──────────────────────────────────────────────────────────────


class CircuitBreaker:
    """Per-tool circuit breaker.

    State machine: CLOSED → OPEN (on threshold) → HALF_OPEN (after timeout).
    A single success in HALF_OPEN transitions back to CLOSED.
    """

    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        open_timeout_seconds: float = 60.0,
    ) -> None:
        self._name = name
        self._failure_threshold = failure_threshold
        self._open_timeout = open_timeout_seconds
        self._state = self.CLOSED
        self._failure_count = 0
        self._last_open_at: float | None = None

    @property
    def state(self) -> str:
        return self._state

    def record_success(self) -> None:
        self._failure_count = 0
        if self._state == self.HALF_OPEN:
            log.info("circuit_breaker_closed", tool=self._name)
            self._state = self.CLOSED

    def record_failure(self) -> None:
        self._failure_count += 1
        if self._state == self.HALF_OPEN:
            self._trip()
            return
        if self._failure_count >= self._failure_threshold:
            self._trip()

    def _trip(self) -> None:
        self._state = self.OPEN
        self._last_open_at = time.monotonic()
        log.warning(
            "circuit_breaker_opened",
            tool=self._name,
            failures=self._failure_count,
        )

    def allow_request(self) -> bool:
        if self._state == self.CLOSED:
            return True
        if self._state == self.OPEN:
            assert self._last_open_at is not None
            if time.monotonic() - self._last_open_at >= self._open_timeout:
                self._state = self.HALF_OPEN
                log.info("circuit_breaker_half_open", tool=self._name)
                return True
            return False
        # HALF_OPEN — allow one trial request
        return True


# ──────────────────────────────────────────────────────────────
# Redis-backed LRU Cache
# ──────────────────────────────────────────────────────────────


class CacheEntry(BaseModel):
    """Serialised cache entry stored in Redis or memory."""

    value: bytes
    created_at: float


class ToolCache:
    """Two-tier cache: in-process LRU dict + optional Redis backend.

    Degrades gracefully — Redis failures log a warning and return miss.
    """

    def __init__(self, max_memory_items: int = 256, redis_client: AsyncRedis[Any] | None = None) -> None:
        self._max_memory = max_memory_items
        self._mem: OrderedDict[str, CacheEntry] = OrderedDict()
        self._redis: AsyncRedis[Any] | None = redis_client

    # ── helpers ────────────────────────────────────────────

    @staticmethod
    def _make_key(tool_name: str, kwargs: dict[str, Any]) -> str:
        raw = json.dumps(kwargs, sort_keys=True, default=str)
        digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
        return f"tool:{tool_name}:{digest}"

    def _build_payload(self, value: BaseModel) -> bytes:
        return value.model_dump_json().encode()

    # ── public ─────────────────────────────────────────────

    async def get(self, tool_name: str, kwargs: dict[str, Any], ttl: int) -> bytes | None:
        key = self._make_key(tool_name, kwargs)

        # In-memory check
        if entry := self._mem.get(key):
            if time.monotonic() - entry.created_at < ttl:
                self._mem.move_to_end(key)  # LRU bump
                return entry.value
            del self._mem[key]

        # Redis check
        if self._redis is not None:
            try:
                val: bytes | None = await self._redis.get(key)
                if val is not None:
                    self._put_mem(key, CacheEntry(value=val, created_at=time.monotonic()))
                    return val
            except Exception:
                log.warning("cache_redis_get_failed", tool=tool_name, exc_info=True)

        return None

    async def set(self, tool_name: str, kwargs: dict[str, Any], value: bytes, ttl: int) -> None:
        key = self._make_key(tool_name, kwargs)
        now = time.monotonic()

        # Memory set
        self._put_mem(key, CacheEntry(value=value, created_at=now))

        # Redis set
        if self._redis is not None:
            try:
                await self._redis.setex(key, ttl, value)
            except Exception:
                log.warning("cache_redis_set_failed", tool=tool_name, exc_info=True)

    def _put_mem(self, key: str, entry: CacheEntry) -> None:
        self._mem[key] = entry
        if len(self._mem) > self._max_memory:
            self._mem.popitem(last=False)

    async def invalidate(self, tool_name: str) -> None:
        """Drop all entries for a tool (memory-only — Redis TTL handles the rest)."""
        prefix = f"tool:{tool_name}:"
        keys_to_del = [k for k in self._mem if k.startswith(prefix)]
        for k in keys_to_del:
            del self._mem[k]


# ──────────────────────────────────────────────────────────────
# ToolRegistry
# ──────────────────────────────────────────────────────────────


class ToolRegistry:
    """Central registry for all 18 BTR tools.

    Features:
      - register / call / list_tools
      - Redis-backed LRU cache (5 min default TTL)
      - Per-tool circuit breaker (5 failures → open 60 s)
      - tenacity retry: 3 attempts, exponential backoff 0.5/1/2 s
    """

    def __init__(self, cache: ToolCache | None = None) -> None:
        self._tools: dict[str, tuple[ToolSpec, ToolFn]] = {}
        self._breakers: dict[str, CircuitBreaker] = {}
        self._cache = cache or ToolCache()
        self._log = log.bind(component="ToolRegistry")

    # ── registration ───────────────────────────────────────

    def register(
        self,
        spec: ToolSpec,
        fn: ToolFn,
        *,
        circuit_breaker: CircuitBreaker | None = None,
    ) -> None:
        """Register a tool with its spec and handler function.

        Raises ``ToolRegistrationError`` on duplicate name.
        """
        if spec.name in self._tools:
            raise ToolRegistrationError(f"Tool '{spec.name}' is already registered")
        self._tools[spec.name] = (spec, fn)
        self._breakers[spec.name] = circuit_breaker or CircuitBreaker(
            name=spec.name,
            failure_threshold=5,
            open_timeout_seconds=60.0,
        )
        self._log.info("tool_registered", name=spec.name)

    def unregister(self, name: str) -> None:
        """Remove a previously registered tool."""
        self._tools.pop(name, None)
        self._breakers.pop(name, None)

    # ── accessors ──────────────────────────────────────────

    def get_spec(self, name: str) -> ToolSpec:
        if name not in self._tools:
            raise ToolNotFoundError(f"Tool '{name}' is not registered")
        return self._tools[name][0]

    def list_tools(self) -> list[dict[str, Any]]:
        return [
            {
                "name": spec.name,
                "description": spec.description,
                "input_schema": spec.input_schema.model_json_schema(),
                "output_schema": spec.output_schema.model_json_schema(),
                "cache_ttl_seconds": spec.cache_ttl_seconds,
            }
            for spec, _ in self._tools.values()
        ]

    @property
    def tool_count(self) -> int:
        return len(self._tools)

    # ── execution ──────────────────────────────────────────

    async def call(self, name: str, /, **kwargs: Any) -> BaseModel:
        """Invoke a tool by name with validated kwargs.

        1. Check circuit breaker.
        2. Check cache.
        3. Execute with retry.
        4. Cache result.
        5. Record success/failure on breaker.
        """
        if name not in self._tools:
            raise ToolNotFoundError(f"Tool '{name}' is not registered")

        spec, fn = self._tools[name]
        breaker = self._breakers[name]

        # 1. Circuit breaker gate
        if not breaker.allow_request():
            raise ToolCircuitOpenError(
                f"Circuit breaker is OPEN for tool '{name}'. "
                f"Retry after breaker timeout ({spec.name})."
            )

        # 2. Input validation
        validated_input = spec.input_schema.model_validate(kwargs)
        input_kwargs = validated_input.model_dump()

        # 3. Cache lookup
        ttl = spec.cache_ttl_seconds
        try:
            cached = await self._cache.get(name, input_kwargs, ttl)
            if cached is not None:
                self._log.debug("cache_hit", tool=name)
                return spec.output_schema.model_validate_json(cached)
        except ToolCacheError:
            log.debug("cache_lookup_failed", tool=name)  # fall through to execute

        self._log.debug("cache_miss", tool=name)

        # 4. Execute with retry
        try:
            result = await self._execute_with_retry(fn, spec, validated_input)
        except Exception as exc:
            breaker.record_failure()
            raise ToolExecutionError(
                f"Tool '{name}' execution failed: {exc}"
            ) from exc

        # 5. Cache success
        try:
            payload = self._cache._build_payload(result)
            await self._cache.set(name, input_kwargs, payload, ttl)
        except Exception:
            self._log.warning("cache_set_failed", tool=name, exc_info=True)

        breaker.record_success()
        return result

    @staticmethod
    async def _execute_with_retry(
        fn: ToolFn,
        spec: ToolSpec,
        validated_input: BaseModel,
    ) -> BaseModel:
        """Wrap tool execution with tenacity retry policy.

        3 attempts, exponential backoff 0.5 → 1 → 2 seconds.
        Retries only on ``ToolExecutionError`` (transient errors).
        """

        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=2.0),
            retry=retry_if_exception_type(ToolExecutionError),
            reraise=True,
        )
        async def _run() -> BaseModel:
            return await fn(validated_input)

        try:
            return await _run()
        except RetryError as e:
            raise ToolExecutionError(
                f"Tool '{spec.name}' failed after 3 retries: {e}"
            ) from e
