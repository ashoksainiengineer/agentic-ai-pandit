"""LLM Provider — Vertex AI only via Google Cloud Run.

Since the app runs on Cloud Run (GCP), Vertex AI authentication is automatic
via the service account — no API key needed.

Models:
  - CHEAP   -> Gemini 2.5 Flash   - lagna, dasha, varga node analysis
  - PREMIUM -> Gemini 2.5 Pro     - critic, forensic precision

Every LLM call goes through this layer — never import LangChain providers
directly in business logic.
"""

from __future__ import annotations

import time
from collections.abc import Sequence
from contextlib import suppress
from dataclasses import dataclass, field
from typing import Any, NoReturn, Protocol, runtime_checkable

import structlog
from pydantic import BaseModel

from app.config import AITier, get_settings

log = structlog.get_logger()


@dataclass
class LLMResponse:
    content: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    token_usage: dict[str, int] = field(default_factory=dict)
    model: str = ""
    latency_ms: float = 0.0


class LLMProviderError(Exception):
    ...


class LLMProviderRateLimitError(LLMProviderError):
    ...


class LLMProviderAuthError(LLMProviderError):
    ...


class LLMProviderTimeoutError(LLMProviderError):
    ...


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol that every provider adapter must satisfy."""

    model_name: str

    async def generate(
        self,
        system_prompt: str,
        messages: Sequence[dict[str, str]],
        structured_output_schema: type[BaseModel] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        """Send a completion request and return a standardised response."""
        ...


def _build_lc_messages(
    system_prompt: str,
    messages: Sequence[dict[str, str]],
) -> list[Any]:
    from langchain_core.messages import HumanMessage, SystemMessage

    lc_messages: list[Any] = [SystemMessage(content=system_prompt)]
    lc_messages.extend(
        HumanMessage(content=m["content"]) if m["role"] == "user"
        else SystemMessage(content=m["content"])
        for m in messages
    )
    return lc_messages


def _safe_token_usage(result: Any) -> dict[str, int]:
    usage: dict[str, int] = {}
    with suppress(Exception):
        meta = getattr(result, "usage_metadata", None) or {}
        usage = {k: int(v) for k, v in meta.items()}
    return usage


def _safe_content(result: Any) -> str:
    """Extract string content from an LLM result, handling list responses."""
    content = getattr(result, "content", str(result))
    if isinstance(content, list):
        texts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                texts.append(item.get("text", str(item)))
            else:
                texts.append(str(item))
        return " ".join(texts)
    return str(content)


class VertexAIAdapter:
    """Vertex AI adapter using Gemini models via GCP native auth.

    No API key required — authentication is automatic when running on
    Cloud Run via the GCP service account.
    """

    def __init__(self, model: str | None = None) -> None:
        settings = get_settings()
        self.model_name = model or settings.vertex_flash_model

        from langchain_google_vertexai import ChatVertexAI

        self._llm: Any = ChatVertexAI(
            model_name=self.model_name,
            project=settings.google_cloud_project,
            location="asia-southeast1",
            temperature=0.1,
            max_output_tokens=4096,
        )
        self._log = log.bind(provider="vertex", model=self.model_name)

    async def generate(
        self,
        system_prompt: str,
        messages: Sequence[dict[str, str]],
        structured_output_schema: type[BaseModel] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        t0 = time.monotonic()
        try:
            self._llm.temperature = temperature
            self._llm.max_output_tokens = max_tokens
            lc_messages = _build_lc_messages(system_prompt, messages)

            if structured_output_schema is not None:
                structured_llm = self._llm.with_structured_output(
                    structured_output_schema, method="json_schema"
                )
                result = await structured_llm.ainvoke(lc_messages)
                latency = (time.monotonic() - t0) * 1000
                return LLMResponse(
                    content=result.model_dump_json() if isinstance(result, BaseModel) else str(result),
                    model=self.model_name,
                    latency_ms=round(latency, 1),
                )

            result = await self._llm.ainvoke(lc_messages)
            latency = (time.monotonic() - t0) * 1000
            return LLMResponse(
                content=_safe_content(result),
                token_usage=_safe_token_usage(result),
                model=self.model_name,
                latency_ms=round(latency, 1),
            )

        except Exception as exc:
            _raise_provider_error(exc, t0)


def _raise_provider_error(exc: Exception, t0: float) -> NoReturn:
    latency = (time.monotonic() - t0) * 1000
    err_str = str(exc).lower()
    if "rate" in err_str or "quota" in err_str:
        raise LLMProviderRateLimitError(str(exc)) from exc
    if "auth" in err_str or "unauthorized" in err_str or "permission" in err_str:
        raise LLMProviderAuthError(str(exc)) from exc
    if "timeout" in err_str:
        raise LLMProviderTimeoutError(str(exc)) from exc
    raise LLMProviderError(f"{exc} (latency={latency:.0f}ms)") from exc


class TierRouter:
    """Routes LLM calls to the right Gemini model based on complexity tier.

    Tier mapping:
      - CHEAP   -> Gemini 2.5 Flash  - lagna, dasha, varga node analysis
      - PREMIUM -> Gemini 2.5 Pro    - critic, forensic precision

    Both use Vertex AI with automatic GCP service account auth.
    """

    def __init__(self) -> None:
        settings = get_settings()

        self._providers: dict[AITier, list[tuple[LLMProvider, str]]] = {
            AITier.CHEAP: [
                (VertexAIAdapter(settings.vertex_flash_model), "vertex_flash"),
            ],
            AITier.MID: [
                (VertexAIAdapter(settings.vertex_flash_model), "vertex_flash"),
            ],
            AITier.PREMIUM: [
                (VertexAIAdapter(settings.vertex_pro_model), "vertex_pro"),
            ],
        }
        self._circuit_breakers: dict[str, _CircuitState] = {}
        self._log = log.bind(component="TierRouter")

    async def generate(
        self,
        tier: AITier,
        system_prompt: str,
        messages: Sequence[dict[str, str]],
        structured_output_schema: type[BaseModel] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        provider_chain = self._providers.get(tier, self._providers[AITier.CHEAP])
        last_error: Exception | None = None

        for provider, name in provider_chain:
            if self._is_circuit_open(name):
                self._log.warning("circuit_open_skipping", provider=name)
                continue

            try:
                result = await provider.generate(
                    system_prompt=system_prompt,
                    messages=messages,
                    structured_output_schema=structured_output_schema,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                self._record_success(name)
                return result
            except Exception as exc:
                self._record_failure(name)
                last_error = exc
                self._log.warning(
                    "provider_failed",
                    provider=name,
                    error=str(exc)[:200],
                )
                continue

        raise LLMProviderError(
            f"Vertex AI provider exhausted. Last error: {last_error}"
        ) from last_error

    def _is_circuit_open(self, name: str) -> bool:
        state = self._circuit_breakers.get(name)
        if state is None:
            return False
        if state.state == "open":
            if time.monotonic() - state.opened_at >= 60.0:
                state.state = "half_open"
                return False
            return True
        return False

    def _record_success(self, name: str) -> None:
        self._circuit_breakers.pop(name, None)

    def _record_failure(self, name: str) -> None:
        state = self._circuit_breakers.get(name)
        if state is None:
            self._circuit_breakers[name] = _CircuitState(
                state="open", opened_at=time.monotonic(), failures=1
            )
        else:
            state.failures += 1
            if state.failures >= 5:
                state.state = "open"
                state.opened_at = time.monotonic()


class _CircuitState:
    def __init__(self, state: str, opened_at: float, failures: int) -> None:
        self.state = state
        self.opened_at = opened_at
        self.failures = failures


@dataclass
class TokenUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0


MODEL_COST_PER_1M_TOKENS: dict[str, tuple[float, float]] = {
    "gemini-2.5-flash-preview-04-17": (0.15, 0.60),
    "gemini-2.5-pro-preview-03-25": (1.25, 10.00),
}

DEFAULT_COST: tuple[float, float] = (1.0, 3.0)


class TokenTracker:
    """Per-session token accounting with budget enforcement.

    Usage::
        tracker = TokenTracker(max_tokens=100_000)
        tracker.record("lagna", "gemini-2.5-flash", prompt=500, completion=200)
        tracker.record("dasha", "gemini-2.5-flash", prompt=800, completion=300)
        tracker.total_tokens  # 1800
        tracker.stage_usage["lagna"].total_tokens  # 700
    """

    def __init__(self, max_tokens: int = 100_000) -> None:
        self._max_tokens = max_tokens
        self._stage_usage: dict[str, TokenUsage] = {}
        self._per_model: dict[str, TokenUsage] = {}

    @property
    def total_tokens(self) -> int:
        return sum(u.total_tokens for u in self._stage_usage.values())

    @property
    def total_cost_usd(self) -> float:
        return sum(u.cost_usd for u in self._stage_usage.values())

    @property
    def stage_usage(self) -> dict[str, TokenUsage]:
        return dict(self._stage_usage)

    @property
    def model_usage(self) -> dict[str, TokenUsage]:
        return dict(self._per_model)

    def record(
        self,
        stage: str,
        model: str,
        prompt: int = 0,
        completion: int = 0,
    ) -> None:
        total = prompt + completion

        if stage not in self._stage_usage:
            self._stage_usage[stage] = TokenUsage()
        stage_u = self._stage_usage[stage]
        stage_u.prompt_tokens += prompt
        stage_u.completion_tokens += completion
        stage_u.total_tokens += total
        stage_u.cost_usd += self._compute_cost(model, prompt, completion)

        if model not in self._per_model:
            self._per_model[model] = TokenUsage()
        model_u = self._per_model[model]
        model_u.prompt_tokens += prompt
        model_u.completion_tokens += completion
        model_u.total_tokens += total
        model_u.cost_usd += self._compute_cost(model, prompt, completion)

        if self.total_tokens > self._max_tokens:
            log.warning(
                "token_budget_exceeded",
                total=self.total_tokens,
                max_tokens=self._max_tokens,
            )

    def budget_exceeded(self) -> bool:
        return self.total_tokens > self._max_tokens

    @staticmethod
    def _compute_cost(model: str, prompt: int, completion: int) -> float:
        prompt_cost, completion_cost = MODEL_COST_PER_1M_TOKENS.get(
            model, DEFAULT_COST
        )
        return (prompt * prompt_cost + completion * completion_cost) / 1_000_000
