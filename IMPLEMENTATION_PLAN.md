# AI-Pandit (Agentic): Master Implementation Plan

**Status:** FINAL PLAN — Reviewed & Approved  
**Based on:** 6-agent exhaustive research of ai-pandit-app codebase + industry best practices  
**Target:** 12-week MVP build

---

## Phase 0: Foundation Setup (Week 1, Days 1-3)

### Step 0.1: Initialize Python Project
- [ ] Create `agentic-ai-pandit/backend/` directory
- [ ] `uv init --python 3.12`
- [ ] Set up `pyproject.toml` with all dependencies from `TECH_STACK_FINAL.md`
- [ ] Configure `[tool.ruff]`, `[tool.mypy]` (strict mode), `[tool.pytest]`
- [ ] Create `.env.example` from `ai-pandit-app/.env.example`
- [ ] Set up `uv.lock` and `.gitignore`

**Acceptance:** `uv sync` completes. `ruff check .` passes on empty project.

### Step 0.2: Directory Structure
Create the standard layout following the `apps/api/src/` pattern but in Python:
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory + lifespan
│   ├── config.py             # Pydantic Settings from env vars
│   │
│   ├── models/               # Pydantic models (port from shared/src/)
│   │   ├── __init__.py
│   │   ├── btr.py            # CandidateDataPackage, PlanetData, etc.
│   │   ├── events.py         # LifeEvent, BirthData, etc.
│   │   ├── session.py        # RectificationSession, SessionStatus
│   │   ├── job.py            # JobSummary, JobDetail, QueueStatus
│   │   ├── stream.py         # 14 SessionEvent types
│   │   ├── ephemeris.py      # EphemerisService request/response
│   │   └── validation.py     # Consensus, RedFlags, etc.
│   │
│   ├── orchestration/        # LangGraph StateGraph
│   │   ├── __init__.py
│   │   ├── state.py           # BTRState TypedDict
│   │   ├── graph.py           # Workflow compiler
│   │   └── nodes/
│   │       ├── __init__.py
│   │       ├── lagna_filter.py
│   │       ├── dasha_filter.py
│   │       ├── varga_filter.py
│   │       ├── forensic_filter.py
│   │       └── critic.py
│   │
│   ├── agents/               # LLM agent system prompts
│   │   ├── __init__.py
│   │   ├── base.py            # LLMProvider protocol + adapters
│   │   ├── prompts/
│   │   │   ├── lagna_expert.md
│   │   │   ├── dasha_expert.md
│   │   │   ├── varga_expert.md
│   │   │   ├── forensic_expert.md
│   │   │   └── critic.md
│   │   └── structured_output.py  # Pydantic output schemas per agent
│   │
│   ├── tools/                # 18-tool registry
│   │   ├── __init__.py
│   │   ├── registry.py        # ToolRegistry class
│   │   ├── ephemeris_client.py # HTTP client → Skyfield service
│   │   ├── definitions/        # Per-tool implementations
│   │   │   ├── dasha.py
│   │   │   ├── varga.py
│   │   │   ├── kp.py
│   │   │   └── ...
│   │   └── cache.py           # Redis-backed tool result cache
│   │
│   ├── event_store/          # RedisEventStore (port from shared/)
│   │   ├── __init__.py
│   │   ├── store.py           # RedisEventStore class
│   │   └── keys.py            # Key pattern constants
│   │
│   ├── queue/                # Async job processing
│   │   ├── __init__.py
│   │   ├── driver.py          # QueueDriver protocol
│   │   ├── redis_driver.py    # Redis-backed implementation
│   │   └── lifecycle.py       # Job state transitions
│   │
│   ├── db/                   # SQLAlchemy models + Alembic migrations
│   │   ├── __init__.py
│   │   ├── engine.py          # Async engine + session factory
│   │   ├── models.py          # All table models (port from schema.ts)
│   │   └── operations.py      # CRUD functions (port from jobs.ts)
│   │
│   ├── api/                  # FastAPI routers
│   │   ├── __init__.py
│   │   ├── deps.py            # Dependency injection (auth, db, redis)
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── rectify.py     # POST /rectify
│   │   │   ├── sessions.py    # CRUD sessions
│   │   │   ├── jobs.py        # Job status
│   │   │   ├── stream.py      # SSE stream
│   │   │   └── progress.py    # Polling progress
│   │   └── middleware/
│   │       ├── auth.py
│   │       ├── rate_limit.py
│   │       ├── request_id.py
│   │       └── error_handler.py
│   │
│   └── mcp/                  # MCP server
│       ├── __init__.py
│       └── server.py
│
├── migrations/               # Alembic
├── tests/                    # Mirrors app/ structure
├── prompts/                  # Git-tracked prompt versions
├── pyproject.toml
└── Dockerfile
```

**Acceptance:** Directory tree matches structure above. All `__init__.py` files present.

### Step 0.3: Configuration System
- [ ] Port `apps/api/src/config/index.ts` → `app/config.py`
- [ ] Use `pydantic-settings` for typed env validation
- [ ] All env vars from `.env.example` (Neon DB, Upstash Redis, Clerk, Ephemeris, AI keys)
- [ ] Feature flags: `USE_ASYNC_JOB_PIPELINE`, `USE_NEW_STREAM_PATH`

**Acceptance:** `Settings()` instantiation validates all required env vars.

---

## Phase 1: Shared Types & Pydantic Models (Week 1, Days 3-5)

### Step 1.1: Port Core Astrological Types
Port from `packages/shared/src/btr-types.ts` (742 lines) to `app/models/btr.py`:

- [ ] `ZODIAC_SIGNS`, `SIGN_LORDS`, `TATWA_SEQUENCE` → Python lists/dicts
- [ ] `PlanetData` → Pydantic `BaseModel` with all fields (longitude, sign, degree, nakshatra, house, dignity, isRetro, speed, isCombust, shadbala, bav, aspects, avastha, d60Deity, compoundDignity, shadbalaBreakdown, ishtaKashtaPhala)
- [ ] `CandidateDataPackage` → Pydantic `BaseModel` with ALL ~50 fields
- [ ] `VimshottariDashaEntry`, `Yoga`, `PanchangaData`, `VedicSignals`
- [ ] `D60PlanetData`, `KPSubLordData`, `KPCuspalData`
- [ ] `MethodScores`, `EventMatchResult`, `TransitMatchResult`
- [ ] `RectificationResult`, `ScanConfiguration`, `BoundaryAnalysis`

**Acceptance:** Zero mypy errors. `CandidateDataPackageSchema.parse(raw_dict)` works.

### Step 1.2: Port Event & Session Types
Port from `packages/shared/src/types/core.ts`, `api.ts`, `btr.ts`:

- [ ] `BirthData` (fullName, dateOfBirth, tentativeTime, lat, lon, timezone, gender)
- [ ] `LifeEvent` (id, category, eventType, datePrecision, eventDate, description, importance)
- [ ] `TimeOffsetConfig`, `RectificationSession`, `SessionStatus`
- [ ] `JobSummary`, `JobDetail`, `JobEventRecord`, `QueueStatus`
- [ ] All 14 `SessionEvent` union types (ProgressEvent, AIThinkingEvent, etc.)
- [ ] `BTRInput`, `BTROutput`, `SecondsPrecisionInput`, `SecondsPrecisionResult`

**Acceptance:** All Pydantic models validate correctly against sample JSON from existing system.

### Step 1.3: Port Validation Schemas
Port from `packages/shared/src/schemas.ts`:

- [ ] `LifeEventSchema` → Pydantic `@field_validator` for date precision + endDate >= eventDate
- [ ] `BirthDataSchema` → regex validation for date, coordinate bounds, XSS sanitization
- [ ] `OffsetConfigSchema` → preset enum + customMinutes range
- [ ] `CalculateRequestSchema` (birthData + lifeEvents[3-100] + offsetConfig)
- [ ] `CandidateDataPackageSchema` (passthrough for extra fields)

**Acceptance:** `LifeEventSchema(date_precision='exact_date', event_date='2020', end_date='2019')` raises ValidationError.

### Step 1.4: Port Encryption Module
Port from `packages/shared/src/encryption.ts` to `app/encryption.py`:

- [ ] AES-256-GCM + scrypt KDF (N=32768, r=8, p=1)
- [ ] Format: `v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext)`
- [ ] AAD binding: userId
- [ ] Key rotation: decrypt tries multiple secrets
- [ ] `safe_decrypt()`, `is_encrypted()`, `parse_field()`

**Acceptance:** Round-trip test: encrypt → decrypt matches. Compatible with TypeScript output.

---

## Phase 2: Database Layer (Week 2, Days 1-3)

### Step 2.1: SQLAlchemy Models
Port from `packages/db/src/schema.ts` (459 lines) to `app/db/models.py`:

- [ ] `users` table — id, externalId, email, fullName, isActive, role, lastLoginAt
- [ ] `sessions` table — ALL columns including encrypted PII fields, rectifiedTime, progressData
- [ ] `jobs` table — sessionId, kind, status, currentStage, cursorJson, checkpointJson, progressPercent
- [ ] `job_attempts` table — jobId, attemptNo, workerId, leaseToken, heartbeatAt, outcome
- [ ] `job_events` table — jobId, sessionId, sequenceNo, eventType, stage, payloadJson
- [ ] `artifacts` table — jobId, sessionId, kind, uri, mimeType, checksum, sizeBytes
- [ ] `calculations` table — sessionId, ephemerisData (JSONB), expiresAt
- [ ] `idempotency_keys` table — userId, key, requestHash, expiresAt
- [ ] `audit_logs`, `data_retention`, `payments` tables

**All enums to port:** `job_status`, `job_kind`, `job_attempt_outcome`, `artifact_kind`, `session_status`

**Acceptance:** `alembic revision --autogenerate` creates correct migration. All indexes match TypeScript schema.

### Step 2.2: Alembic Setup
- [ ] `alembic init migrations`
- [ ] Configure `env.py` with async engine (`async_engine_from_config`, `NullPool`)
- [ ] Import all models in `env.py` before `target_metadata`
- [ ] First migration: create all tables

**Acceptance:** `alembic upgrade head` creates all tables in test database.

### Step 2.3: DB Operations
Port from `packages/db/src/jobs.ts` (680 lines) to `app/db/operations.py`:

- [ ] `create_job()`, `get_job_by_id()`, `get_latest_job_for_session()`
- [ ] `claim_next_queued_job()` (optimistic DB claim with UPDATE WHERE status='queued')
- [ ] `mark_job_running()`, `update_job_progress()`, `complete_job()`, `fail_job()`
- [ ] `request_job_cancellation()`, `schedule_job_retry()`
- [ ] `create_job_attempt()`, `update_job_attempt_heartbeat()`, `complete_job_attempt()`
- [ ] `append_job_event()` (with sequence collision retry)
- [ ] `create_artifact()`, `list_artifacts_for_job()`
- [ ] Session CRUD: create, read, update, delete, clone, list by user

**Acceptance:** Integration tests pass for all DB operations against real Postgres.

---

## Phase 3: 18-Tool Registry (Week 2, Days 3-5 + Week 3, Days 1-2)

### Step 3.1: Tool Registry Framework
- [ ] `ToolRegistry` class with `register(name, fn, schema)`, `call(name, **kwargs)`, `list_tools()`
- [ ] LRU cache with Redis backend (TTL 5 min)
- [ ] Retry logic: 3 attempts, exponential backoff (0.5s, 1s, 2s)
- [ ] Circuit breaker per tool (5 consecutive failures → open for 60s)

**Acceptance:** `tool_registry.call("get_planetary_positions", ...)` returns cached result on second call.

### Step 3.2: Ephemeris HTTP Client
Port from `apps/api/src/lib/ephemeris/skyfield-client.ts`:

- [ ] `fetch_chart(timestamp_utc, request)` → `POST /v1/positions`
- [ ] `fetch_charts_batch(timestamps, request)` → `POST /v1/positions/batch`
- [ ] `fetch_sunrise(request)` → `POST /v1/sunrise`
- [ ] `fetch_health()` → `GET /health`
- [ ] Retry: 2 attempts, 5xx/network only

**Acceptance:** Integration test against running ephemeris service returns valid ChartResponse.

### Step 3.3: Tool 1-3 — Core Ephemeris (HIGH PRIORITY)
Port calculation logic from `apps/api/src/lib/ephemeris.ts` and `vedic-astrology-engine.ts`:

- [ ] **Tool 1: `get_planetary_snapshot`** — `calculate_ephemeris()` → 9 planets + ascendant + houses
- [ ] **Tool 2: `get_sign_and_nakshatra`** — `get_zodiac_sign()`, `get_nakshatra()`, `get_nakshatra_pada()`
- [ ] **Tool 3: `get_panchanga`** — `calculate_panchanga()` → tithi, vara, yoga, karana, nakshatra

### Step 3.4: Tool 4-6 — Dasha Systems (HIGH PRIORITY)
Port from `vedic-astrology-engine.ts`, `advanced-btr-methods.ts`, `kalachakra-dasha.ts`, `jaimini-astrology.ts`:

- [ ] **Tool 4: `get_vimshottari_dasha`** — Maha→Antar→Pratyantar→Sukshma→Prana (5 levels)
- [ ] **Tool 5: `get_yogini_dasha`** — 36-year cycle, 8 Yoginis
- [ ] **Tool 6: `get_kalachakra_dasha`** — Savya/Apisavya/Mixed with event correlation

### Step 3.5: Tool 7-9 — Divisional Charts (HIGH PRIORITY)
Port from `advanced-btr-methods.ts`:

- [ ] **Tool 7: `get_divisional_charts`** — D1, D2, D7, D9, D10, D12, D24, D30, D40, D45, D60, D150
- [ ] **Tool 8: `get_boundary_safety`** — Seconds-to-boundary for Lagna sign, Moon nakshatra, D9, D60
- [ ] **Tool 9: `find_boundary_changes`** — Sweep in 15s steps to find exact sign/nakshatra transitions

### Step 3.6: Tool 10-12 — Strength & Precision (MEDIUM PRIORITY)
Port from `shadbala.ts`, `advanced-btr-methods.ts`, `kp-sublords.ts`:

- [ ] **Tool 10: `get_shadbala`** — Sthana, Dig, Kala, Cheshta, Naisargika, Drig (6 sources)
- [ ] **Tool 11: `get_ashtakavarga`** — BAV per planet + SAV per sign
- [ ] **Tool 12: `get_kp_sublords`** — 4-level hierarchy (Star→Sub→Sub-Sub→Sub-Sub-Sub)

### Step 3.7: Tool 13-15 — Special Points & Signals (MEDIUM PRIORITY)
Port from `jaimini-astrology.ts`, `advanced-btr-methods.ts`:

- [ ] **Tool 13: `get_special_points`** — Arudha Lagna, Hora Lagna, Ghati Lagna, Bhrigu Bindu, Kunda Lagna
- [ ] **Tool 14: `detect_yogas_and_signals`** — Parivartana, Vargottama, Pushkar Navamsa
- [ ] **Tool 15: `calculate_chara_karakas_and_dasha`** — 7 variable significators + sign-based dasha

### Step 3.8: Tool 16-18 — Forensic & Verification (MEDIUM PRIORITY)
Port from `gandanta-detection.ts`, `nadi-amsha.ts`, `pancha-pakshi.ts`, `spouse-d9-verification.ts`:

- [ ] **Tool 16: `detect_gandanta`** — Karmic knot at Lagna/Moon junctions
- [ ] **Tool 17: `get_nadi_amsha_d150`** — 150-fold division with deity/phala/karmic tables
- [ ] **Tool 18: `verify_spouse_d9`** — Cross-match D9 with spouse chart

**Overall Acceptance:** All 18 tools pass integration tests. Cache hits > 80% for repeated calculations. Circuit breaker opens on ephemeris service outage.

---

## Phase 4: LangGraph State Machine (Week 3, Days 3-5 + Week 4)

### Step 4.1: Define BTRState
- [ ] TypedDict with all channels from the architecture:
  - `candidates: Annotated[list[Candidate], operator.add]`
  - `scores: dict[str, float]`
  - `messages: Annotated[list[BaseMessage], add_messages]`
  - `current_stage: Literal["lagna","dasha","varga","forensic","critic","complete"]`
  - `critic_iterations: int`
  - `anchor_events: list[LifeEvent]`
  - `eliminated: list[Candidate]`
  - `final_rectified_time: Optional[str]`
  - `confidence: Optional[float]`
  - `tool_call_count: int`, `token_usage: dict`

### Step 4.2: Lagna Filter Node
- [ ] Call Tool 1 (get_planetary_snapshot) for each candidate's time window
- [ ] Call Tool 8 (get_boundary_safety) to find lagna transitions
- [ ] LLM call (Tier 2: Claude Haiku) with `lagna_expert.md` prompt
- [ ] Parse `AgentVerdict` structured output (candidate_id, score, reasoning)
- [ ] Return pruned candidates (score >= 40)

**Acceptance:** Lagna node returns only candidates with valid lagna support for anchor events.

### Step 4.3: Dasha Filter Node
- [ ] Call Tool 4 (get_vimshottari_dasha) for each surviving candidate
- [ ] LLM call (Tier 2: Claude Haiku) with `dasha_expert.md` prompt
- [ ] Parse structured output with dasha-event alignment scores
- [ ] Prune: score >= 50

### Step 4.4: Varga Filter Node
- [ ] Call Tool 7 (get_divisional_charts) for D9, D10, D60
- [ ] Call Tool 9 (find_boundary_changes) for D10 transitions
- [ ] LLM call (Tier 2: Claude Haiku) with `varga_expert.md` prompt
- [ ] Prune: score >= 60. Eliminate after D10 boundary change.

### Step 4.5: Forensic Filter Node
- [ ] Call Tool 17 (get_nadi_amsha_d150) for D-60 level precision
- [ ] Call Tool 12 (get_kp_sublords) for sub-lord precision
- [ ] LLM call (Tier 3: Claude Sonnet) with `forensic_expert.md` prompt
- [ ] Return top candidate with exact second

### Step 4.6: Critic Agent Node
- [ ] Re-run Tool 1 (get_planetary_snapshot) for the finalist (fresh verification)
- [ ] Check Tool 16 (detect_gandanta) for karmic knots
- [ ] Check Tool 18 (verify_spouse_d9) if spouse data exists
- [ ] LLM call (Tier 3: Claude Sonnet) with `critic.md` prompt
- [ ] If objections found AND iteration < 3: return to relevant stage
- [ ] If clean or iteration >= 3: return final verdict

### Step 4.7: Compile Graph
- [ ] Wire nodes: Lagna → Dasha → Varga → Forensic → Critic
- [ ] Conditional edges: `route_by_score(state)` → next stage or END
- [ ] Self-loop: `critic_router(state)` → "forensic" or "final" or END
- [ ] `recursion_limit = 100` (covers all stages + critic loops)
- [ ] `checkpointer = PostgresSaver(conn_string)`
- [ ] `await checkpointer.setup()`

**Acceptance:** Full end-to-end test: input with known birth time → graph converges to correct time ±30 seconds.

---

## Phase 5: Agent System Prompts (Week 5, Days 1-3)

### Step 5.1: Prompt Architecture
- [ ] Git-tracked Markdown files in `prompts/v1/`
- [ ] `PromptManager` class: `get_prompt(name, version, **variables)`
- [ ] Jinja2 templating for variable substitution
- [ ] Version identifier embedded in LLM call metadata

### Step 5.2: Lagna Expert Prompt (`lagna_expert.md`)
- [ ] Role: "Vedic Astrology Lagna Expert"
- [ ] Instructions: Eliminate impossible lagnas based on anchor event severity
- [ ] Required output: `<AGENT_VERDICT>` XML with candidate_id, score, reasoning
- [ ] Rules: NEVER state a planetary position not in the JSON. Cite tool output.
- [ ] Include EVENT_HOUSE_MAP for reference

### Step 5.3: Dasha Expert Prompt (`dasha_expert.md`)
- [ ] Role: "Vedic Astrology Dasha Expert"
- [ ] Instructions: Match Vimshottari dasha lords to event types
- [ ] Include DASHA_YEARS, EVENT_SIGNIFICATORS for reference
- [ ] Rules: Account for dasha boundary sensitivity. Flag boundary candidates.

### Step 5.4: Varga Expert Prompt (`varga_expert.md`)
- [ ] Role: "Vedic Astrology Divisional Chart Expert"
- [ ] Instructions: Verify D-9 (marriage), D-10 (career), D-60 (precision)
- [ ] Include Varga chart purpose descriptions
- [ ] Rules: D-10 for career events, D-9 for marriage, D-60 for life purpose

### Step 5.5: Forensic Expert Prompt (`forensic_expert.md`)
- [ ] Role: "Vedic Astrology Precision Expert"
- [ ] Instructions: Pinpoint exact second using D-60 deities, Prana dasha, KP sub-lords
- [ ] Rules: D-60 deity nature must match life trajectory. Prana dasha must support timeline.

### Step 5.6: Critic Prompt (`critic.md`)
- [ ] Role: "Vedic Astrology Verification Expert (Red Team)"
- [ ] Instructions: Find flaws in the finalist's chart. Check against ALL 30 events.
- [ ] Checklist: Rahu 5th? Gandanta? Dasha Sandhi? Conflicting methods? D60 instability?
- [ ] Rules: If objection valid → specify which stage to re-evaluate. If clean → APPROVE.

**Acceptance:** Each prompt tested with sample data. Structured output parses correctly.

---

## Phase 6: LLM Abstraction Layer (Week 5, Days 3-5)

### Step 6.1: LLMProvider Protocol
- [ ] `class LLMProvider(Protocol)` with `async generate(prompt, messages, structured_output_schema) -> LLMResponse`
- [ ] `LLMResponse` dataclass: content, tool_calls, token_usage, model, latency_ms

### Step 6.2: Provider Adapters
- [ ] `GroqAdapter` wrapping `langchain-groq`
- [ ] `AnthropicAdapter` wrapping `langchain-anthropic`
- [ ] `DeepSeekAdapter` (fallback)

### Step 6.3: Tiered Router
- [ ] `LLMRouter` class with tier mapping: orchestrator→cheap, lagna/dasha/varga→mid, forensic/critic→premium
- [ ] `generate_with_fallback(tier, ...)` — tries primary, falls back with exponential backoff
- [ ] Circuit breaker per provider (5 failures → open 60s)

### Step 6.4: Structured Output Parsing
- [ ] `with_structured_output(PydanticModel, method="json_schema")` for Claude
- [ ] `method="function_calling"` fallback for Groq
- [ ] XML regex parsing as last resort fallback
- [ ] `parse_agent_verdict(raw_text) -> AgentVerdict`

### Step 6.5: Token Tracking
- [ ] `TokenTracker` class: per-session, per-stage, per-agent token counting
- [ ] Budget enforcement: max 100K tokens per session
- [ ] Prometheus metric: `btr_llm_token_usage{model, stage}`

**Acceptance:** Full LLM call with Groq → Claude fallback works. Token tracking accurate.

---

## Phase 7: API Layer (Week 6, Days 1-4)

### Step 7.1: FastAPI Application Factory
- [ ] `create_app()` in `app/main.py`
- [ ] Lifespan: DB pool init, Redis connect, ephemeris client init, graph compile
- [ ] Include all routers
- [ ] Register middleware (auth, rate limit, request ID, error handler, CORS)

### Step 7.2: API Routes — Port from Express
Port all routes from `apps/api/src/routes/`:

- [ ] `GET /health`, `/health/ready`, `/health/live` — health checks
- [ ] `POST /api/v1/rectify` — Submit BTR job (async), returns `{job_id}`
- [ ] `GET /api/v1/rectify/{job_id}` — Job status + results if complete
- [ ] `GET /api/v1/rectify/{job_id}/stream` — SSE stream for real-time progress
- [ ] `GET /api/v1/rectify/{job_id}/events?since_seq=` — Incremental polling
- [ ] `POST /api/v1/rectify/{job_id}/cancel` — Cancel running job
- [ ] `POST /api/v1/sessions` — Create session
- [ ] `GET /api/v1/sessions` — List user sessions
- [ ] `GET/PUT/DELETE /api/v1/sessions/{id}` — Session CRUD
- [ ] `POST /api/v1/sessions/{id}/clone` — Clone session
- [ ] `GET /api/v1/candidate/{session_id}/{time}/ephemeris` — Lazy-load candidate data
- [ ] `GET /api/v1/admin/metrics` — Admin dashboard (admin role required)

### Step 7.3: Middleware — Port from Express
- [ ] `AuthMiddleware` — Clerk JWT verification via `clerk` Python SDK
- [ ] `RateLimitMiddleware` — Redis sliding window (replaces in-memory Node.js store)
- [ ] `RequestIDMiddleware` — `X-Request-ID` generation + propagation
- [ ] `ErrorHandlerMiddleware` — Centralized exception → JSON response
- [ ] `PIIFilterMiddleware` — Redact PII from logs

### Step 7.4: Pydantic Dependencies
- [ ] `get_db()` — async session dependency
- [ ] `get_redis()` — redis client dependency
- [ ] `get_current_user()` — Clerk auth dependency
- [ ] `get_tool_registry()` — tool registry singleton

**Acceptance:** All routes return correct JSON. Auth blocks unauthenticated requests. Rate limiter triggers at configured thresholds.

---

## Phase 8: MCP Server (Week 6, Day 5)

### Step 8.1: Isolated MCP Service
- [ ] Separate Cloud Run service (NOT colocated with API)
- [ ] `FastMCP("AI-Pandit-BTR")` with explicit tool allowlist
- [ ] Tools exposed: `rectify_birth_time`, `get_quick_chart` (lightweight)
- [ ] Tools NOT exposed: raw calculation tools (internal only)

### Step 8.2: MCP Security
- [ ] Pydantic validation on ALL inputs (strict schemas, coordinate bounds, date format)
- [ ] Life event text sanitization (max 200 chars, strip HTML, regex for dates/injection patterns)
- [ ] Rate limiting per API key: max 5 concurrent jobs, max 100/day
- [ ] Audit log: every tool invocation recorded

**Acceptance:** MCP server works in Claude Desktop. Rate limiting blocks 6th concurrent request.

---

## Phase 9: Event Store & Streaming (Week 7, Days 1-3)

### Step 9.1: Redis Event Store — Port from TypeScript
Port `packages/shared/src/event-store.ts` (340 lines) to `app/event_store/store.py`:

- [ ] Same key prefixes: `session-events:log:`, `thinking:`, `calc:`, `scores:`, `decisions:`, `context:`
- [ ] `log_event()`, `get_events_since(seq)`, `store_thinking()`, `get_thinking()`
- [ ] `append_calculation_log()`, `store_candidate_score()`, `store_decision()`
- [ ] `publish_event(channel, msg)`, `subscribe_to_session(session_id)`
- [ ] `cleanup_session()` — TTL 24h on all keys

### Step 9.2: Add Agent Debate Events
- [ ] New key patterns: `session-events:agent:round:{n}:` — per-round debate transcripts
- [ ] `session-events:consensus:` — final consensus state
- [ ] `session-events:critic:` — critic objections

### Step 9.3: SSE Streaming Endpoint
- [ ] `GET /api/v1/rectify/{job_id}/stream`
- [ ] Subscribe to Redis pub/sub channel for session events
- [ ] Emit SSE events: `progress`, `thinking`, `candidate_score`, `stage_complete`, `complete`, `error`
- [ ] Heartbeat every 15s to keep connection alive
- [ ] Replay missed events from DB `job_events` table on reconnect

### Step 9.4: Progress Tracker
Port `packages/worker-runtime/src/progress-tracker.ts` (422 lines):

- [ ] `ProgressTracker` class: 5 analysis steps (not 7 — removed init/final)
- [ ] In-memory buffers: thinking (100KB limit), candidate scores (500 limit), calculation logs
- [ ] Throttled DB save: every 5s
- [ ] Heartbeat pulse: every 30s

**Acceptance:** SSE stream delivers real-time agent thinking to connected client. Reconnect replays missed events.

---

## Phase 10: Job Queue & Async Processing (Week 7, Days 3-5)

### Step 10.1: Queue Driver — Port from TypeScript
Port `apps/api/src/lib/queue/drivers/redis-bullmq.ts`:

- [ ] `RedisQueueDriver` implementing `QueueDriver` protocol
- [ ] Redis keys: `{prefix}:ready`, `{prefix}:delayed`, `{prefix}:dlq`
- [ ] `enqueue_session()`, `claim_next_job()`, `schedule_retry()`, `move_to_dead_letter()`
- [ ] Pub/Sub: `btr:job:notify` channel to wake workers

### Step 10.2: Job Lifecycle — Port from TypeScript
Port `apps/api/src/lib/job-lifecycle.ts`:

- [ ] State transitions: `queued → running → retrying → completed/failed/cancelled`
- [ ] `sync_job_queued()`, `sync_job_running()`, `sync_job_completed()`, `sync_job_failed()`
- [ ] `begin_job_attempt()`, `complete_job_attempt()`
- [ ] `persist_completion_artifacts()` (analysis_result, report, reasoning_log)
- [ ] `write_dead_letter_artifact()` for permanent failures

### Step 10.3: Queue Manager — Port from TypeScript
Port `apps/api/src/lib/queue-manager.ts` (1206 lines):

- [ ] `add_to_queue(session_id)` → capacity check → enqueue → DB update
- [ ] `drain_queue()` loop: check circuit breakers → purge stale → claim next → execute
- [ ] `analyze_with_retry(session_id, attempt)` wrapping LangGraph invocation
- [ ] Retry logic: `is_retryable_error()` + `get_retry_delay(attempt)` + max 3 attempts
- [ ] Memory pressure evaluation (restrict concurrency to 1 under pressure)
- [ ] Cancellation: DB update + Redis pub/sub

**Acceptance:** Queue processes 5 concurrent BTR sessions. Retry works correctly. Dead letter captures permanent failures.

---

## Phase 11: Integration & Frontend Connection (Week 8)

### Step 11.1: Frontend Backend URL Update
- [ ] Update `apps/web/.env.local` — `NEXT_PUBLIC_BACKEND_URL` → new Python API URL
- [ ] Update `apps/web/lib/api-client.ts` — API base URL from env
- [ ] Verify CORS: `ALLOWED_ORIGINS` includes frontend URL

### Step 11.2: Frontend API Contract Compatibility
- [ ] Verify `POST /api/v1/rectify` response matches `QueueSubmitResult` type
- [ ] Verify SSE event format matches `SessionEvent` union type
- [ ] Verify `GET /api/v1/rectify/{job_id}` matches `JobDetail` type
- [ ] Verify `GET /api/v1/candidate/{id}/ephemeris` matches `CandidateDataPackage` type

### Step 11.3: Frontend Modifications
- [ ] Replace "Stage Progress" labels with "Agent" labels (Lagna Agent, Dasha Agent, etc.)
- [ ] Add agent reasoning display panel (shows inter-agent debate transcripts)
- [ ] Add confidence score visualization from agent consensus
- [ ] Modify `use-analysis-sse.ts` to handle new agent events

**Acceptance:** Frontend sends BTR request → Python API processes → SSE streams agent thinking → results displayed.

---

## Phase 12: Testing (Week 9)

### Step 12.1: Unit Tests
- [ ] Pydantic model validation tests (valid + invalid inputs)
- [ ] Tool registry tests (mock ephemeris client)
- [ ] Each LangGraph node tested in isolation with mock LLM
- [ ] Encryption round-trip tests

### Step 12.2: Integration Tests
- [ ] Full BTR pipeline with real ephemeris + mock LLM
- [ ] Job queue lifecycle (queued → running → completed)
- [ ] Event store read/write
- [ ] Database CRUD operations
- [ ] API route tests with `httpx.AsyncClient`

### Step 12.3: Contract Tests
- [ ] API response schemas match frontend types
- [ ] Ephemeris service contract compatibility

### Step 12.4: E2E Tests
- [ ] Complete rectification flow (Playwright)
- [ ] Error handling: invalid input, auth failure, rate limit
- [ ] Streaming: SSE events arrive in order

### Step 12.5: Performance Tests
- [ ] k6 load test: 50 concurrent BTR submissions
- [ ] Stress test: 200 concurrent with relaxed thresholds
- [ ] LLM token cost profiling

**Acceptance:** Test coverage > 80%. All integration tests pass against real Postgres + Redis.

---

## Phase 13: Deployment (Week 10)

### Step 13.1: Dockerfile
- [ ] Multi-stage build: Python builder → slim runner
- [ ] `uv sync --frozen --no-dev` in builder
- [ ] Copy only `app/`, `prompts/`, `migrations/`
- [ ] Non-root user: `appuser`
- [ ] Healthcheck: `python -c "import urllib; urllib.request.urlopen('http://localhost:8080/health')"`
- [ ] CMD: `uvicorn app.main:app --host 0.0.0.0 --port 8080`

### Step 13.2: Cloud Build CI/CD
- [ ] Adapt `cloudbuild.yaml` for Python build
- [ ] Steps: `uv sync` → `ruff check` → `mypy` → `pytest` → `docker build` → push → deploy
- [ ] Build ephemeris Docker (unchanged from ai-pandit-app)
- [ ] Build API Docker (new Python image)

### Step 13.3: Cloud Run Deployment
- [ ] API service: memory 512Mi, CPU 1, concurrency 20, min-instances 1, timeout 3600s
- [ ] Ephemeris service: memory 1Gi, CPU 1, concurrency 5, min-instances 0
- [ ] Environment variables from Google Secret Manager
- [ ] `JOB_EXECUTION_MODE=inline`, `USE_ASYNC_JOB_PIPELINE=true`

### Step 13.4: Vercel Frontend Deploy
- [ ] Unchanged from ai-pandit-app
- [ ] Update `NEXT_PUBLIC_BACKEND_URL` to new Python API URL

**Acceptance:** `gcloud builds submit` deploys both services. Frontend loads from Vercel. BTR request completes end-to-end.

---

## Phase 14: Monitoring & Production Readiness (Week 11)

### Step 14.1: Observability
- [ ] LangSmith tracing for all LLM calls
- [ ] Structured JSON logging (structlog)
- [ ] OpenTelemetry traces across nodes
- [ ] Sentry error tracking
- [ ] Prometheus custom metrics: `btr_session_duration_seconds`, `btr_llm_cost_usd`, `btr_confidence_score`, `tool_call_failures_total`, `circuit_breaker_trips_total`

### Step 14.2: Alert Rules
- [ ] `btr_llm_cost_usd > 1.00` per session → alert
- [ ] `btr_confidence_score < 0.40` for 5 consecutive → quality drift alert
- [ ] `circuit_breaker_trips > 5` in 5 min → provider outage alert
- [ ] `btr_session_duration > 180s` → performance degradation warning

### Step 14.3: Security Hardening
- [ ] Rate limiting on all endpoints
- [ ] API key rotation mechanism
- [ ] PII encryption audit
- [ ] Dependency audit (`pip-audit` in CI)
- [ ] MCP server isolation verified

### Step 14.4: Documentation
- [ ] API docs (auto-generated from FastAPI)
- [ ] Architecture decision records (ADRs) in `docs/adr/`
- [ ] Operator runbook for production incidents

**Acceptance:** All alerts fire correctly. Production checklist complete. Runbook ready.

---

## Phase 15: Polish & Launch Prep (Week 12)

### Step 15.1: Performance Tuning
- [ ] Profile BTR pipeline: identify slow nodes
- [ ] Optimize ephemeris batch calls (chunk size tuning)
- [ ] Cache hot tool calls (TTL tuning)
- [ ] DB query optimization (EXPLAIN ANALYZE slow queries)

### Step 15.2: Error Recovery
- [ ] Test crash recovery: kill worker mid-BTR, verify PostgresSaver resumes
- [ ] Test LLM outage: verify fallback chain works
- [ ] Test Redis outage: verify graceful degradation

### Step 15.3: Launch Checklist
- [ ] Production environment variables verified
- [ ] SSL/TLS on all endpoints
- [ ] Backup strategy for PostgreSQL
- [ ] Load test passes at expected launch volume (100 concurrent)
- [ ] Rollback plan documented

---

## References Used

| Reference | Source |
|-----------|--------|
| Existing ai-pandit-app codebase | `/home/jovyan/ai-pandit-app/` |
| BTR Type Definitions | `packages/shared/src/btr-types.ts` (742 lines) |
| Database Schema | `packages/db/src/schema.ts` (459 lines) |
| Redis Event Store | `packages/shared/src/event-store.ts` (340 lines) |
| Queue Manager | `apps/api/src/lib/queue-manager.ts` (1206 lines) |
| Vedic Engine (all 13 files) | `apps/api/src/lib/vedic-astrology-engine.ts` + 12 more |
| Ephemeris Service | `services/ephemeris/` (Python FastAPI) |
| Frontend | `apps/web/` (Next.js 15) |
| Deployment Config | `cloudbuild.yaml`, `deploy/cloudrun/` |
| LangGraph Official Docs | https://docs.langchain.com/oss/python/langgraph |
| Multi-Agent Debate Patterns | `agno-agi/demo-os`, `ed-donner/agents`, `michaelalbada/BuildingApplicationsWithAIAgents` |
| Production Best Practices | Agent research report (10 areas) |
| Oracle Architecture Review | `bg_8729481a` (full stack validation) |
