# AI-Pandit: Definitive Tech Stack (v2 — Post-Oracle Review)

**Status:** FINAL — Reviewed May 16, 2026
**Changes from v1:** Async job architecture replaces sync Cloud Run. Checkpoint pruning added. LLM abstraction layer added. Existing modified Skyfield retained (from ai-pandit-app).

---

## Executive Summary

**3 critical corrections from Oracle review:**

1. ❌ **Skyfield + ndastro-engine** → ✅ **Existing Modified Skyfield (from ai-pandit-app ephemeris service)**
2. ❌ **Sync Cloud Run HTTP** → ✅ **Async job architecture (FastAPI enqueues → Cloud Run Jobs process)**
3. ❌ **Unbounded Postgres checkpoints** → ✅ **Capped to 2 checkpoints + GCS archival**

Everything else was correct. Python remains the language. LangGraph remains the orchestrator. FastAPI remains the API. Monolith remains the architecture.

---

## The Stack (Corrected)

```
┌──────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                             │
│  React (SaaS UI)  │  REST API (FastAPI)                   │
├──────────────────────────────────────────────────────────────────┤
│                    API & QUEUE LAYER                              │
│  FastAPI + Pydantic (API)  │  Cloud Tasks + Redis (Job Queue)    │
├──────────────────────────────────────────────────────────────────┤
│                 ORCHESTRATION LAYER (Async Worker)                │
│  LangGraph (StateGraph) + PostgresSaver (capped 2 checkpoints)   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │Lagna │→│Dasha │→│Varga │→│Foren-│→│Critic│                  │
│  │Filter│ │Filter│ │Filter│ │ sic  │ │Agent │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│  Circuit breakers + provider fallback + max 3 critic iterations  │
├──────────────────────────────────────────────────────────────────┤
│                    LLM ABSTRACTION LAYER                          │
│  LLMProvider protocol → GroqAdapter | AnthropicAdapter           │
│  Tier 1: Groq (Llama 3) | Tier 2: Claude Haiku                   │
│  Tier 3: Claude Sonnet | Fallback chain: Groq→Haiku→Sonnet      │
├──────────────────────────────────────────────────────────────────┤
│                 ASTROLOGY ENGINE (CORRECTED)                      │
│  Modified Skyfield (existing ephemeris service — deployed + tested)       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Planetary    │ │ House Cusps  │ │ Lahiri/KP     │             │
│  │ Positions    │ │ (Placidus/WS)│ │ Ayanamsa     │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Vimshottari  │ │ 16 Varga     │ │ Panchanga    │             │
│  │ Dasha (5 lev)│ │ Charts (D1-60│ │ (Tithi,Naksh)│             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  Custom layer in Python: D-60 deity, Prana dasha, BTR Shuddhi   │
├──────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                     │
│  PostgreSQL (state, capped) | Redis (cache + queue) | GCS (archive)│
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Core Language — Python 3.12 (UNCHANGED)

**Why Python remains correct:**
- LangGraph and its production features (StateGraph, PostgresSaver, streaming) are Python-only at production scale
- Modified Skyfield ephemeris service already deployed and battle-tested in production via ai-pandit-app
- LLM workloads are I/O-bound; asyncio handles 5+ concurrent calls efficiently
- Python 3.13 free-threading is NOT production-ready (40% single-thread overhead, breaks C extensions)

**When to reconsider:** Python 3.14 (2027) if free-threading becomes officially supported. Go for API gateway only if measured >10M req/day.

---

## 2. Orchestration — LangGraph (UNCHANGED)

**Why LangGraph remains correct:**
- Conditional edges for scoring-based pruning (your elimination funnel)
- PostgresSaver for crash recovery
- Typed StateGraph as blackboard pattern
- CrewAI's hierarchical mode is broken. AutoGen is deprecated.

**NEW: Lock-in mitigation via LLM abstraction layer**
```python
from typing import Protocol

class LLMProvider(Protocol):
    """Abstract LLM provider. Zero LangChain/Anthropic imports in business logic."""
    async def generate(self, system_prompt: str, messages: list[dict], **kwargs) -> LLMResponse:
        ...

class GroqAdapter:
    def __init__(self, model: str = "llama-3.2-90b"):
        self._client = ChatGroq(model=model)

    async def generate(self, ...) -> LLMResponse:
        # All LangChain/Groq imports isolated here
        ...

class AnthropicAdapter:
    def __init__(self, model: str = "claude-3-haiku-20240307"):
        self._client = ChatAnthropic(model=model)

    async def generate(self, ...) -> LLMResponse:
        # All LangChain/Anthropic imports isolated here
        ...
```

If LangGraph needs migration, only adapter implementations change. Business logic is pure Pydantic-in/Pydantic-out.

---

## 3. Astrology Engine — **MODIFIED SKYFIELD (RETAINED from ai-pandit-app)**

### Why Skyfield (Not Swiss Ephemeris)

The existing `ai-pandit-app/services/ephemeris/` is a production-deployed, modified Skyfield microservice with:
- DE440 kernel (most accurate for modern dates 1550-2650)
- Lahiri + KP ayanamsa (degree-3 polynomial fitted to Swiss Ephemeris values)
- Batch processing (250 timestamps per request, ProcessPoolExecutor parallel)
- Placidus, Whole Sign, Equal house systems
- True/Mean lunar nodes, sunrise/sunset
- Thread-safe LRU caching (TTL 300s, max 1000 entries)

The Vedic calculation layer (Vimshottari, Varga charts, KP sub-lords, etc.) is already implemented in TypeScript at `apps/api/src/lib/`. We port this to Python for the new agentic system.

### What We Reuse (HTTP Client → Existing Service)

```python
# Tool registry wraps HTTP calls to existing ephemeris service
class EphemerisClient:
    async def fetch_chart(self, timestamp_utc: str, request: EphemerisRequest) -> ChartResponse:
        return await httpx.post(f"{EPHEMERIS_SERVICE_URL}/v1/positions", json=...)

    async def fetch_batch(self, timestamps: list[str], request: EphemerisRequest) -> BatchChartResponse:
        return await httpx.post(f"{EPHEMERIS_SERVICE_URL}/v1/positions/batch", json=...)

    async def fetch_sunrise(self, request: SunriseRequest) -> SunriseResponse:
        return await httpx.post(f"{EPHEMERIS_SERVICE_URL}/v1/sunrise", json=...)
```

### What We Port to Python (Vedic Layer)
- **Varga charts** — Port from `advanced-btr-methods.ts` (~200 lines)
- **D-60 deity mapping** — Port from `vedic-astrology-engine.ts` (~60 lines)
- **Vimshottari Dasha** — Port from `vedic-astrology-engine.ts` (~300 lines)
- **KP sub-lords** — Port from `kp-sublords.ts` (~200 lines)
- **Panchanga** — Port from `advanced-btr-methods.ts` (~100 lines)
- **Shadbala, Ashtakavarga, Chara Karakas, Yogini, Kalachakra, Nadi, etc.** — Port from remaining files

**Key advantage:** Zero license cost. Already deployed. Already validated against JHora (via the existing pipeline).

### Setup
```bash
# Ephemeris service already running — just point to it
EPHEMERIS_SERVICE_URL=https://ephemeris-service-xxxxx-as.a.run.app
EPHEMERIS_SERVICE_TIMEOUT_MS=15000
```
- **BTR Shuddhi** (~150 lines): Kunda, Tatwa, Varna alignment
- **Panchanga** (~100 lines): Tithi, Nakshatra, Yoga, Karana from Sun/Moon longitudes

### Setup
```bash
# Ephemeris service already running — just point to it
EPHEMERIS_SERVICE_URL=https://ephemeris-service-xxxxx-as.a.run.app
EPHEMERIS_SERVICE_TIMEOUT_MS=15000
```

---

## 4. Infrastructure — **ASYNC JOB ARCHITECTURE (CORRECTED)**

### The Fatal Flaw in v1
Cloud Run HTTP services hard-abort connections on scale-down. A 90-second BTR workflow that's 60 seconds in when the instance recycles? **Session lost.** No recovery.

### Corrected Architecture

```
┌─────────┐   POST /rectify    ┌──────────┐   enqueue job   ┌──────────────┐
│ Client  │ ──────────────────▶│ FastAPI   │ ──────────────▶│ Cloud Tasks  │
│         │◀──── {job_id} ────│ (Cloud Run│                 │ or Redis     │
└─────────┘                    │ Service)  │                 └──────┬───────┘
                               └──────────┘                        │
                                                                    │ pull job
                                                           ┌────────▼───────┐
                                                           │ Cloud Run Job  │
                                                           │ or GKE Worker  │
                                                           │                │
                                                           │ LangGraph BTR  │
                                                           │ 5-stage funnel │
                                                           │                │
                                                           └───────┬────────┘
                                                                   │
                                                    ┌──────────────▼─────────┐
                                                    │ PostgreSQL (checkpoints)│
                                                    │ Redis (cache)           │
                                                    │ GCS (final state)       │
                                                    └────────────────────────┘
```

### Flow
1. Client POST `/api/v1/rectify` → FastAPI validates, creates `job_id`, enqueues to Cloud Tasks
2. FastAPI immediately returns `{job_id, status: "queued", estimated_seconds: 60}`
3. Client polls `GET /api/v1/rectify/{job_id}/status` or receives webhook
4. Cloud Run Job pulls task, executes LangGraph workflow with PostgresSaver checkpoints
5. On completion: final state archived to GCS, Postgres rows pruned, status updated

### Why Cloud Run Jobs (Not Services)
- **No HTTP timeout:** Jobs run up to 60 minutes, not 60 seconds
- **Instance recycling safe:** Jobs complete before recycling
- **Retry built-in:** Cloud Tasks retries with exponential backoff
- **Cost:** Same pricing as Cloud Run services

### Fallback: Cloud Tasks + GKE Autopilot
If Cloud Run Job startup time (ephemeris loading) exceeds 10 seconds, switch to always-warm GKE pods.

---

## 5. Database — **CAPPED CHECKPOINTS (CORRECTED)**

### The Problem in v1
Unbounded Postgres checkpoints: 30 life events + 10 planetary snapshots + full reasoning transcripts + scoring history = **2-5MB per checkpoint × 8 checkpoints per session × 1000 sessions = 16-40GB/month**.

### Corrected Policy

```python
# PostgresSaver configuration
POSTGRES_CHECKPOINT_LIMIT = 2  # Only keep latest 2 checkpoints per session
POSTGRES_RETENTION_DAYS = 7    # Delete all checkpoints 7 days after session complete

# State pruning within checkpoints
def prune_state_for_checkpoint(state: BTRState) -> BTRState:
    """Remove verbose reasoning transcripts from checkpoint state."""
    state["agent_reasoning_transcripts"] = None  # Large text, not needed for recovery
    state["full_event_list"] = None               # Keep only anchor events
    return state

# Archival
async def archive_completed_session(session_id: str):
    final_state = await load_final_state(session_id)
    await gcs_client.upload(f"btr-archive/{session_id}.json", final_state)
    await delete_postgres_rows(session_id)
```

**Storage breakdown:**
- PostgreSQL: ~200KB/session (capped 2 checkpoints, pruned) → scalable
- GCS archive: ~2MB/session (full state, permanent) → $0.02/GB/month
- Redis: ~5KB/session (job status + tool cache) → negligible

**Monthly cost at 10,000 sessions:**
- PostgreSQL: ~$15 (2GB stored + pruned)
- GCS: ~$4 (20GB archive)
- Redis: ~$5 (basic tier)
- **Total: ~$24/month**

---

## 6. LLM Layer — **PROVIDER ABSTRACTION + CIRCUIT BREAKERS (NEW)**

### Tiered Routing with Provider Fallback

```python
class LLMRouter:
    """Routes LLM calls to appropriate provider with fallback chain."""

    TIERS = {
        "cheap": [GroqAdapter("llama-3.2-90b"), AnthropicAdapter("claude-3-haiku")],
        "mid": [AnthropicAdapter("claude-3-haiku"), GroqAdapter("llama-3.2-90b")],
        "premium": [AnthropicAdapter("claude-3-5-sonnet"), AnthropicAdapter("claude-3-opus")],
    }

    async def generate_with_fallback(self, tier: str, **kwargs) -> LLMResponse:
        """Try primary provider; fall back on failure with exponential backoff."""
        providers = self.TIERS[tier]
        last_error = None

        for i, provider in enumerate(providers):
            try:
                return await provider.generate(**kwargs)
            except (RateLimitError, ServiceUnavailableError) as e:
                last_error = e
                if i < len(providers) - 1:
                    await asyncio.sleep(2 ** i)  # Exponential backoff
                continue

        raise LLMAllProvidersFailed(last_error)
```

### Circuit Breaker per Provider

```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self._failures = 0
        self._threshold = failure_threshold
        self._recovery = recovery_timeout
        self._last_failure = None

    async def call(self, fn, *args, **kwargs):
        if self._failures >= self._threshold:
            if time.time() - self._last_failure < self._recovery:
                raise CircuitOpenError(f"Circuit open for {self._recovery}s")
            self._failures = 0  # Try again after recovery window

        try:
            result = await fn(*args, **kwargs)
            self._failures = 0
            return result
        except Exception:
            self._failures += 1
            self._last_failure = time.time()
            raise
```

---

## 7. API Security — **INPUT SANITIZATION + RATE LIMITING**

### Input Validation
- [ ] Pydantic validation on ALL inputs with strict schemas
- [ ] Life event text sanitized: max 200 chars, strip HTML/script tags, regex for dates
- [ ] Rate limiting per API key: max 5 concurrent BTR jobs, max 100/day
- [ ] Birth data encrypted at rest in Postgres (pgcrypto or application-level)
- [ ] API key rotation support built in from day 1
- [ ] Audit log: every API invocation recorded with timestamp, user, inputs

---

## 8. Observability — **CUSTOM METRICS (NEW)**

### What LangSmith + Sentry + Prometheus Cover
- LangSmith: LLM call traces, token usage per call, latency per node
- Sentry: Python exceptions, stack traces, error grouping
- Prometheus: Infrastructure metrics (CPU, memory, request rate)

### Critical Gaps (What We Add)
```python
# Custom Prometheus metrics — emitted from BTR worker
btr_session_duration = Histogram("btr_session_duration_seconds", [...])
btr_llm_cost_usd = Histogram("btr_llm_cost_usd", [...], ["provider", "tier"])
btr_checkpoint_size_bytes = Gauge("btr_checkpoint_size_bytes", [...])
btr_confidence_score = Gauge("btr_confidence_score", [...])
btr_pruning_ratio = Gauge("btr_pruning_ratio", [...], ["stage"])
tool_call_failures = Counter("tool_call_failures_total", [...], ["tool_name"])
circuit_breaker_trips = Counter("circuit_breaker_trips_total", [...], ["provider"])
```

### Alert Rules
- `btr_llm_cost_usd > 1.00` per session → Alert (cost anomaly)
- `btr_confidence_score < 0.40` for 5 consecutive sessions → Alert (quality drift)
- `circuit_breaker_trips{provider="groq"} > 5` in 5 min → Alert (provider outage)
- `btr_checkpoint_size_bytes > 500_000` → Warning (state bloat)
- `btr_session_duration > 180` seconds → Warning (performance degradation)

---

## 9. Complete dependency list (pyproject.toml — v2)

```toml
[project]
name = "ai-pandit"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    # Orchestration (unchanged)
    "langgraph>=1.2.0",
    "langchain>=0.3.0",
    "langchain-core>=0.3.0",

    # LLM Providers (unchanged)
    "langchain-groq>=0.2.0",
    "langchain-anthropic>=0.3.0",

    # Astrology Engine (CORRECTED: pyswisseph replaces skyfield+ndastro)
    "pyswisseph>=2.10.0",

    # API (unchanged)
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "pydantic>=2.0.0",
    "httpx>=0.28.0",
    "tenacity>=9.0.0",

    # Job Queue (NEW)
    "google-cloud-tasks>=2.0.0",     # Cloud Tasks client
    "google-cloud-storage>=3.0.0",   # GCS for state archival
    "redis>=5.2.0",                  # Cache + queue fallback

    # Database (unchanged)
    "langgraph-checkpoint-postgres>=2.0.0",
    "psycopg[binary]>=3.2.0",

    # Monitoring (unchanged)
    "prometheus-client>=0.21.0",
    "sentry-sdk>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.25.0",
    "ruff>=0.9.0",
    "mypy>=1.14.0",
]
```

---

## 10. Monthly Cost Estimate (CORRECTED)

| Component | 100 sessions/mo | 1,000 sessions/mo | 10,000 sessions/mo |
|-----------|----------------|-------------------|--------------------|
| **Cloud Run Jobs** | $0 (free) | $5 | $50 |
| **Supabase Postgres** | $0 (free 500MB) | $0 (free) | $25 (Pro) |
| **GCS Archive** | $0 (free 5GB) | $0.01 | $0.20 |
| **Upstash Redis** | $0 (free 10K cmds) | $10 | $25 |
| **Swiss Ephemeris License** | $0 (not needed) | $0 | $0 |
| **Groq (cheap tier)** | $1 | $8 | $80 |
| **Claude Haiku (mid)** | $3 | $25 | $250 |
| **Claude Sonnet (premium)** | $10 | $80 | $800 |
| **LangSmith** | $0 (free) | $39 (team) | $99 |
| **Sentry** | $0 (free) | $0 (free) | $26 (team) |
| **TOTAL (month)** | **$14 + $830 once** | **$168** | **$1,356** |

**Per-session cost:** $0.14 at 100 sessions → $0.17 at 1,000 → $0.14 at 10,000 (economies of scale on cache hits).

**Pricing to customers:** $5/session API → 35x margin. $29-99/month SaaS → strong unit economics.

---

## What Changed From v1 and Why

| v1 Decision | v2 Correction | Why (Oracle Finding) |
|---|---|---|
| Skyfield + ndastro-engine | Existing Modified Skyfield (retained) | ndastro-engine: 3 stars, unmaintained. Your modified Skyfield: already deployed, validated, and battle-tested in ai-pandit-app production. |
| Sync Cloud Run HTTP | Async Cloud Run Jobs + queue | 90s workflows on sync HTTP = fatal. Instance scale-down kills sessions. |
| Unbounded Postgres checkpoints | Capped 2 checkpoints + GCS archive | 2-5MB/checkpoint × 1000 sessions = 40GB/month. Postgres chokes. |
| Direct LangChain imports | LLMProvider protocol + adapters | Reduces LangGraph lock-in blast radius from "rewrite" to "refactor adapters." |
| No circuit breakers | Circuit breaker on each LLM provider | Provider 500 error should never fail a BTR session. |
| No rate limiting or input sanitization | Pydantic validation + rate limiting per API key | Prevent prompt injection and resource exhaustion |
| No custom metrics beyond LangSmith | Prometheus metrics for cost, confidence, pruning | LangSmith doesn't track state corruption, cost per session, or quality drift. |

---

## What Should NOT Change

- **Python** — Still the correct language. GIL irrelevant for I/O-bound LLM workloads.
- **LangGraph** — Still the correct orchestrator. No alternative has its production features.
- **FastAPI** — Still the correct API framework. Litestar not worth migration for MVP.
- **Monolith** — Still the correct architecture for MVP. Defer microservices until 50+ tools.
- **React + Tailwind** — Still the correct frontend. Not worth debating for API-first product.
