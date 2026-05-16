"""Unit tests for the ToolRegistry framework.

Tests cover registration, execution, circuit breaker, cache,
error handling, and the four retry/cache scenarios.
"""


import pytest
from pydantic import BaseModel

from app.tools.base import (
    CircuitBreaker,
    ToolCache,
    ToolCircuitOpenError,
    ToolExecutionError,
    ToolNotFoundError,
    ToolRegistrationError,
    ToolRegistry,
    ToolSpec,
)

# ── test helpers ──


class _TestInput(BaseModel):
    value: str


class _TestOutput(BaseModel):
    result: str


async def _echo_fn(input_data: _TestInput) -> _TestOutput:
    return _TestOutput(result=f"echo:{input_data.value}")


async def _failing_fn(_input_data: _TestInput) -> _TestOutput:
    msg = "internal error"
    raise ToolExecutionError(msg)


_ECHO_SPEC = ToolSpec(
    name="echo",
    description="Echoes the input value",
    input_schema=_TestInput,
    output_schema=_TestOutput,
    cache_ttl_seconds=60,
)

_FAILING_SPEC = ToolSpec(
    name="failing",
    description="Always fails",
    input_schema=_TestInput,
    output_schema=_TestOutput,
    cache_ttl_seconds=60,
)


# ──────────────────────────────────────────────────────────────
# Registration
# ──────────────────────────────────────────────────────────────


class TestRegistration:
    def test_register_and_list(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        tools = registry.list_tools()
        assert len(tools) == 1
        assert tools[0]["name"] == "echo"
        assert tools[0]["description"] == "Echoes the input value"

    def test_register_duplicate_raises(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        with pytest.raises(ToolRegistrationError, match="already registered"):
            registry.register(_ECHO_SPEC, _echo_fn)

    def test_unregister(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        registry.unregister("echo")
        assert registry.tool_count == 0

    def test_get_spec(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        spec = registry.get_spec("echo")
        assert spec.name == "echo"

    def test_get_spec_not_found(self) -> None:
        registry = ToolRegistry()
        with pytest.raises(ToolNotFoundError, match="not registered"):
            registry.get_spec("nonexistent")


# ──────────────────────────────────────────────────────────────
# Execution
# ──────────────────────────────────────────────────────────────


class TestExecution:
    @pytest.mark.asyncio
    async def test_call_success(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        result = await registry.call("echo", value="hello")
        assert isinstance(result, _TestOutput)
        assert result.result == "echo:hello"

    @pytest.mark.asyncio
    async def test_call_not_found(self) -> None:
        registry = ToolRegistry()
        with pytest.raises(ToolNotFoundError, match="not registered"):
            await registry.call("nonexistent")

    @pytest.mark.asyncio
    async def test_call_execution_error(self) -> None:
        registry = ToolRegistry()
        registry.register(_FAILING_SPEC, _failing_fn)
        with pytest.raises(ToolExecutionError):
            await registry.call("failing", value="x")


# ──────────────────────────────────────────────────────────────
# Circuit Breaker
# ──────────────────────────────────────────────────────────────


class TestCircuitBreaker:
    def test_initial_state_closed(self) -> None:
        cb = CircuitBreaker("test")
        assert cb.state == "CLOSED"

    def test_opens_after_threshold(self) -> None:
        cb = CircuitBreaker("test", failure_threshold=3, open_timeout_seconds=60)
        for _ in range(3):
            cb.record_failure()
        assert cb.state == "OPEN"

    def test_blocks_when_open(self) -> None:
        cb = CircuitBreaker("test", failure_threshold=1, open_timeout_seconds=60)
        cb.record_failure()
        assert not cb.allow_request()

    def test_half_open_after_timeout(self) -> None:
        cb = CircuitBreaker("test", failure_threshold=1, open_timeout_seconds=0)
        cb.record_failure()
        assert cb.allow_request()
        assert cb.state == "HALF_OPEN"

    def test_closes_on_success_in_half_open(self) -> None:
        cb = CircuitBreaker("test", failure_threshold=1, open_timeout_seconds=0)
        cb.record_failure()
        assert cb.state == "OPEN"
        # After the zero timeout, allow_request transitions to HALF_OPEN
        assert cb.allow_request()
        cb.record_success()
        assert cb.state == "CLOSED"

    @pytest.mark.asyncio
    async def test_circuit_breaker_integration(self) -> None:
        """Registry circuit breaker blocks after consecutive failures."""
        registry = ToolRegistry()
        spec = _FAILING_SPEC
        registry.register(spec, _failing_fn, circuit_breaker=CircuitBreaker("failing", failure_threshold=2))

        # First two calls — fail, but breaker still allows
        for _ in range(2):
            with pytest.raises(ToolExecutionError):
                await registry.call("failing", value="x")

        # Third call — breaker should be OPEN
        with pytest.raises(ToolCircuitOpenError, match="OPEN"):
            await registry.call("failing", value="x")


# ──────────────────────────────────────────────────────────────
# Cache
# ──────────────────────────────────────────────────────────────


class TestCache:
    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached(self) -> None:
        call_count = 0

        async def counting_fn(_input_data: _TestInput) -> _TestOutput:
            nonlocal call_count
            call_count += 1
            return _TestOutput(result=f"count:{call_count}")

        registry = ToolRegistry()
        spec = ToolSpec(
            name="counter",
            description="Counts calls",
            input_schema=_TestInput,
            output_schema=_TestOutput,
            cache_ttl_seconds=60,
        )
        registry.register(spec, counting_fn)

        result1 = await registry.call("counter", value="a")
        assert result1.result == "count:1"
        assert call_count == 1

        result2 = await registry.call("counter", value="a")
        assert result2.result == "count:1"
        assert call_count == 1  # cached — count unchanged

    @pytest.mark.asyncio
    async def test_cache_miss_different_args(self) -> None:
        call_count = 0

        async def counting_fn(_input_data: _TestInput) -> _TestOutput:
            nonlocal call_count
            call_count += 1
            return _TestOutput(result=f"count:{call_count}")

        registry = ToolRegistry()
        spec = ToolSpec(
            name="counter",
            description="Counts calls",
            input_schema=_TestInput,
            output_schema=_TestOutput,
            cache_ttl_seconds=60,
        )
        registry.register(spec, counting_fn)

        await registry.call("counter", value="a")
        await registry.call("counter", value="b")
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_cache_memory_lru_eviction(self) -> None:
        cache = ToolCache(max_memory_items=2)
        registry = ToolRegistry(cache=cache)

        fn_call_count = 0

        async def fn(input_data: _TestInput) -> _TestOutput:
            nonlocal fn_call_count
            fn_call_count += 1
            return _TestOutput(result=f"v:{input_data.value}")

        spec = ToolSpec(
            name="lru_test",
            description="LRU test",
            input_schema=_TestInput,
            output_schema=_TestOutput,
            cache_ttl_seconds=60,
        )
        registry.register(spec, fn)

        await registry.call("lru_test", value="a")  # mem: {a}        — miss (1)
        await registry.call("lru_test", value="b")  # mem: {a, b}     — miss (2)
        await registry.call("lru_test", value="c")  # mem: {b, c}     — miss (3, a evicted)

        assert fn_call_count == 3

        # "a" was evicted — miss again
        await registry.call("lru_test", value="a")  # mem: {c, a}     — miss (4, b evicted)
        assert fn_call_count == 4

        # "b" was evicted when "a" was inserted — miss again
        await registry.call("lru_test", value="b")  # mem: {a, b}     — miss (5, c evicted)
        assert fn_call_count == 5


# ──────────────────────────────────────────────────────────────
# Error propagation
# ──────────────────────────────────────────────────────────────


class TestErrorPropagation:
    @pytest.mark.asyncio
    async def test_input_validation_error(self) -> None:
        registry = ToolRegistry()
        registry.register(_ECHO_SPEC, _echo_fn)
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            await registry.call("echo", unknown_field="x")

    @pytest.mark.asyncio
    async def test_circuit_breaker_open_on_call(self) -> None:
        registry = ToolRegistry()
        spec = _FAILING_SPEC
        registry.register(spec, _failing_fn, circuit_breaker=CircuitBreaker("failing", failure_threshold=2))

        for _ in range(2):
            with pytest.raises(ToolExecutionError):
                await registry.call("failing", value="x")

        with pytest.raises(ToolCircuitOpenError, match="OPEN"):
            await registry.call("failing", value="x")

        with pytest.raises(ToolCircuitOpenError, match="OPEN"):
            await registry.call("failing")
