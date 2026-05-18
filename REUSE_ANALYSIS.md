# AI-Pandit App — Reuse Analysis for agentic-ai-pandit

## Executive Summary

**`ai-pandit-app` ek production-grade, proprietary BTR platform hai jo already WORKS.** Ismein 6-stage tournament pipeline, Skyfield ephemeris microservice, Neon DB, Upstash Redis, Clerk auth, Cloud Run deployment, aur Next.js frontend hai.

**Hum iska 70% directly reuse kar sakte hain.** Sirf core reasoning layer change karni hai — algorithmic pipeline se agentic debate mein shift. Infrastructure, DB, auth, frontend, event store, job queue — sab reuse.

---

## What ai-pandit-app IS (Current Architecture)

```
Frontend (Vercel)        API (Cloud Run)         Processing (Cloud Run)
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│ Next.js 15   │──SSE──│ Express API  │─Queue─│ Job Worker       │
│ TailwindCSS  │       │ TypeScript   │       │ 6-Stage BTR      │
│ shadcn/ui    │       │ Drizzle ORM  │       │ Vertex AI Gemini      │
│ Clerk Auth   │       │              │       │ Skyfield Ephe.   │
└──────────────┘       └──────┬───────┘       └──────────────────┘
                              │                        │
                    ┌─────────┴─────────┐    ┌────────┴────────┐
                    │  Neon PostgreSQL  │    │ Upstash Redis   │
                    │  (Sessions, Jobs) │    │ (Event Store,   │
                    │                   │    │  Pub/Sub, Queue)│
                    └───────────────────┘    └─────────────────┘
```

**Key components:**
- **BTR Pipeline:** 6-stage tournament (not agentic) — stage1_exhaustive → stage2_batch → stage3_refinement → stage4_deep → stage5_micro → stage6_final
- **AI:** Single model (Gemini 2.5 Flash/Pro via Vertex AI), called per-stage for batch scoring
- **Ephemeris:** Separate Python FastAPI microservice with modified Skyfield + DE440 kernel
- **Event Store:** RedisEventStore — session events, candidate scores, thinking buffer, decision buffer (EXACTLY our blackboard pattern!)
- **Queue:** BullMQ + Redis — async job processing, retry, dead letter queue
- **State:** Checkpoint/Resume for BTR pipeline, PostgresSaver equivalent in TypeScript

---

## REUSE ANALYSIS — Component by Component

### ✅ DIRECT REUSE (No Changes)

| Component | Location | What It Is | Why Reuse |
|-----------|----------|-----------|-----------|
| **Database Schema** | `packages/db/src/schema.ts` | Complete Drizzle ORM schema: users, sessions, jobs, calculations, artifacts, job attempts, dead letter queue | Already battle-tested for BTR. Job orchestration tables (queued→running→completed). Session-centric design. Neon Postgres compatible. |
| **BTR Type Definitions** | `packages/shared/src/btr-types.ts` (742 lines) | ALL astrological types: CandidateDataPackage, PlanetData, VimshottariDashaEntry, VedicSignals, Yoga, D60PlanetData, KP data, EVENT_HOUSE_MAP, EVENT_SIGNIFICATORS, DatePrecisionWeights | This IS our tool registry schema! Every planet, house, dasha, varga type already defined. Zod-validated. |
| **Event Store Pattern** | `packages/shared/src/event-store.ts` | RedisEventStore with event log, thinking buffer, calculation log, candidate scores, decision buffer, sequence tracking, TTL cleanup | This IS our blackboard pattern! Agents write analysis → store persists → other agents read. Exact same communication model. |
| **Encryption** | `packages/shared/src/encryption.ts`, `crypto-factory.ts` | AES-256-GCM encryption for PII (birth data, life events) | Already implemented, security-audited. Reuse for encrypting birth data at rest. |
| **Auth Provider** | `packages/shared/src/auth-provider.ts` | Clerk authentication integration | Reuse Clerk auth for user management, subscription tiers. |
| **Deployment Pipeline** | `cloudbuild.yaml` (169 lines) | Google Cloud Build CI/CD: npm ci → build packages → test → Docker build → push to Artifact Registry → deploy to Cloud Run | Complete CI/CD pipeline. Secret management via Google Secret Manager. Multi-service deployment (API + Ephemeris). |
| **Docker Configs** | `deploy/cloudrun/`, `Dockerfile`, `docker-compose.test.yml` | Multi-stage Docker builds for API and Ephemeris services | Reuse Docker patterns for new Python-based services. |
| **Vercel Config** | `vercel.json` | Next.js deployment on Vercel | Reuse for frontend deployment. |
| **Infrastructure Config** | `.env.example` (115 lines) | All env vars: Neon DB, Upstash Redis, Clerk, Vertex AI, Ephemeris service, job queue, warmup, resource management | Complete infrastructure template. Just change Vertex AI model/region. |

### ⚠️ REUSE WITH MODIFICATIONS

| Component | Location | What Changes | Effort |
|-----------|----------|-------------|--------|
| **Ephemeris Service** | `services/ephemeris/` | Keep architecture (FastAPI Python microservice with Skyfield). Optionally upgrade to Swiss Ephemeris per Oracle recommendation. Endpoints remain same: /v1/positions, /v1/positions/batch, /v1/sunrise, /v1/sunset. | Low (if keeping Skyfield) / Medium (if switching to Swiss Ephemeris) |
| **Frontend** | `apps/web/` | Keep Next.js 15 + TailwindCSS + shadcn/ui + Clerk auth. Modify backend URL to point to new Python FastAPI. Keep SSE streaming for real-time agent progress. Keep rectify page UI but show agent reasoning instead of stage progress. | Low |
| **Queue Infrastructure** | `apps/api/src/lib/queue-manager.ts`, `packages/worker-runtime/` | Keep BullMQ + Redis pattern but reimplement in Python with `arq` or `celery`. Keep job lifecycle states (queued→running→completed). Keep dead letter queue pattern. | Medium |
| **Event Store** | `packages/shared/src/event-store.ts` | Keep Redis key schemas and pub/sub pattern. Reimplement in Python with `redis-py`. Keep same key prefixes: `session-events:log:`, `session-events:thinking:`, `session-events:calc:`, `session-events:scores:`. | Low |
| **DB ORM** | `packages/db/` | Keep table schemas but migrate from Drizzle ORM (TypeScript) to SQLAlchemy (Python). Keep same column names, types, indexes. | Medium |

### ❌ REPLACE (Architecture Mismatch)

| Component | Location | Why Replace | What To Build Instead |
|-----------|----------|------------|----------------------|
| **BTR Pipeline Core** | `apps/api/src/lib/seconds-precision-btr.ts` (509 lines) | 6-stage tournament algorithm. Not agentic debate. Calls AI per-stage for batch scoring, not for inter-agent debate. | LangGraph StateGraph with 5-stage agentic funnel (Lagna→Dasha→Varga→Forensic→Critic). Agents debate, not pipeline processes. |
| **API Layer** | `apps/api/` (Express + TypeScript) | Express doesn't support LangGraph natively. Need Python for LangGraph, LangChain, Skyfield/SwissEph. | Python FastAPI + LangGraph orchestration. Keep same REST endpoints. |
| **AI Client** | `apps/api/src/lib/ai-client.ts` | Single model (Vertex AI Gemini). No tiered routing. No debate. | Vertex AI with Gemini 2.5 Flash/Pro. GCP native auth. Tiered routing (cheap/premium). |
| **Prompt System** | `apps/api/src/lib/btr/prompts/` | Prompts designed for batch tournament scoring, not agentic debate. | New system prompts for 5 agent roles (Lagna/Dasha/Varga/Forensic/Critic) with debate instructions. |
| **BTR Stages** | `apps/api/src/lib/btr/stages/` | 6 algorithmic stages. | 5 LangGraph nodes + conditional pruning edges. |

---

## HYBRID STRATEGY — What To Actually Build

```
agentic-ai-pandit/
├── backend/                          # NEW: Python LangGraph orchestration
│   ├── pyproject.toml
│   ├── src/
│   │   ├── api/                      # FastAPI REST endpoints
│   │   ├── orchestration/            # LangGraph StateGraph + nodes
│   │   │   ├── state.py              # BTRState TypedDict (adapt from btr-types.ts)
│   │   │   ├── graph.py              # LangGraph workflow compiler
│   │   │   ├── nodes/                # Lagna, Dasha, Varga, Forensic, Critic nodes
│   │   │   └── pruning.py            # Conditional edge scoring logic
│   │   ├── agents/                   # LLM agent system prompts + debate logic
│   │   │   ├── lagna_expert.py
│   │   │   ├── dasha_expert.py
│   │   │   ├── varga_expert.py
│   │   │   ├── forensic_expert.py
│   │   │   └── critic.py
│   │   ├── llm/                      # LLMProvider abstraction + adapters
│   │   │   ├── protocol.py
│   │   │   └── vertex_adapter.py
Multi-provider → Single Vertex AI provider (GCP native auth)
│   │   ├── tools/                    # Tool registry (18 tools wrapping Ephemeris service)
│   │   │   ├── registry.py
│   │   │   └── ephemeris_client.py   # HTTP client → existing ephemeris service
│   │   ├── event_store/              # Redis event store (reimplement from event-store.ts)
│   │   └── models/                   # Pydantic models (adapt from btr-types.ts)
│   └── tests/
│
├── ephemeris/                        # REUSE: Copy from ai-pandit-app/services/ephemeris/
│   └── ...                           # (or point to existing deployed service)
│
├── frontend/                         # REUSE: Copy from ai-pandit-app/apps/web/
│   └── ...                           # (change NEXT_PUBLIC_BACKEND_URL to new Python API)
│
├── deploy/                           # REUSE: Adapt cloudbuild.yaml + Dockerfiles
│   └── ...
│
└── db/                               # REUSE: Keep schema, recreate in Python
    └── migrations/                   # SQLAlchemy + Alembic
```

---

## REUSE VALUE ESTIMATE

| Category | Reuse % | Lines Saved | Effort Saved |
|----------|---------|-------------|--------------|
| **Type definitions** (btr-types.ts → Pydantic) | 90% | ~742 lines → ~600 lines Python | 1 week |
| **Ephemeris service** | 100% | ~2000 lines Python | 3 weeks |
| **Database schema** | 80% | ~459 lines Drizzle → ~400 lines SQLAlchemy | 1 week |
| **Event store** | 80% | ~340 lines TS → ~250 lines Python | 3 days |
| **Job queue** | 70% | ~2000 lines TS → ~1500 lines Python | 1 week |
| **Frontend** | 85% | ~5000 lines Next.js | 3 weeks |
| **Deployment pipeline** | 80% | ~500 lines YAML/Dockerfile | 1 week |
| **Auth (Clerk)** | 90% | ~200 lines | 2 days |
| **Encryption** | 100% | ~150 lines | 1 day |
| **BTR pipeline core** | 10% | ~5000 lines → NEW | Must rebuild |
| **AI layer** | 10% | ~800 lines → NEW | Must rebuild |
| **API layer** | 30% | ~3000 lines → NEW | Must rebuild |
| **TOTAL** | **~70%** | **~18,000 lines reused** | **~2 months saved** |

---

## SPECIFIC REUSE RECOMMENDATIONS

### 1. Ephemeris Service — 100% REUSE

**What exists:** `services/ephemeris/` — Python FastAPI with modified Skyfield + DE440 kernel.

**Keep:**
- `/v1/positions` → single chart calculation
- `/v1/positions/batch` → batch candidate generation (250 per request)
- `/v1/sunrise`, `/v1/sunset` → panchanga calculations
- API key auth (`app/auth.py`)
- Dockerfile + deployment config
- DE440 kernel loading + caching

**Change (optional):** Switch from Skyfield to Swiss Ephemeris per Oracle recommendation. Same endpoints, different calculation backend.

**Contract preserved:** All 18 tools in our agentic system map to this service. No duplication needed.

### 2. BTR Types → Pydantic Models — 90% REUSE

**What exists:** `packages/shared/src/btr-types.ts` — Complete astrological data types.

**Direct mappings:**
```python
# TypeScript (reuse)         → Python (new)
CandidateDataPackage         → CandidateDataPackage(BaseModel)
PlanetData                   → PlanetData(BaseModel)
VimshottariDashaEntry        → VimshottariDashaEntry(BaseModel)
EVENT_HOUSE_MAP              → EVENT_HOUSE_MAP: dict
EVENT_SIGNIFICATORS          → EVENT_SIGNIFICATORS: dict
PARASHARI_ASPECTS            → PARASHARI_ASPECTS: dict
ZODIAC_SIGNS                 → ZODIAC_SIGNS: list
SIGN_LORDS                   → SIGN_LORDS: dict
```

741 lines of type definitions → ~600 lines of Pydantic. Zod validation → Pydantic validation.

### 3. Event Store (Blackboard) — 80% REUSE

**What exists:** `packages/shared/src/event-store.ts` — RedisEventStore.

**Keep:**
- Same Redis key prefixes: `session-events:log:`, `session-events:thinking:`, `session-events:calc:`, `session-events:scores:`, `session-events:decisions:`, `session-events:context:`
- Same TTL: 24 hours
- Same max list length: 2000
- Same pub/sub channel for real-time updates

**Add for agentic:**
- `session-events:agent:round:N:` → per-debate-round transcripts
- `session-events:consensus:` → final consensus state
- `session-events:critic:` → critic objections

### 4. Frontend — 85% REUSE

**What exists:** `apps/web/` — Next.js 15 + Clerk + shadcn/ui.

**Keep exactly:**
- Clerk authentication (login, signup, dashboard)
- SSE streaming for real-time progress (just change backend URL)
- Dashboard layout
- Event input form (life events entry)

**Modify:**
- Replace "Stage Progress" with "Agent Thinking Log"
- Show inter-agent debate transcripts instead of pipeline stage numbers
- Add confidence visualization from agent consensus

### 5. Database Schema — 80% REUSE

**What exists:** `packages/db/src/schema.ts` — Complete Drizzle ORM schema.

**Tables to keep (recreate in SQLAlchemy):**
- `users` — Clerk user mapping
- `sessions` — BTR session tracking
- `jobs` — async job orchestration
- `job_attempts` — retry tracking
- `dead_letter_artifacts` — failed job artifacts
- `calculations` — cached results
- `artifacts` — analysis outputs

**Add for agentic:**
- `agent_rounds` — per-debate-round transcripts
- `agent_scores` — per-agent confidence scores

### 6. Infrastructure — 90% REUSE

**Keep exactly:**
- Neon PostgreSQL (same connection, different schema migrations)
- Upstash Redis (same event store keys, same queue)
- Google Cloud Build (same pipeline, change Dockerfile)
- Google Secret Manager (same secrets, add Vertex AI model config)
- Vercel (same frontend deployment)
- Clerk (same auth provider)

**Change:**
- Cloud Run API service: Express → Python FastAPI
- Add LangSmith for agent tracing
- Add Cloud Run Job for async BTR processing (Oracle recommendation)

---

## WHAT NOT TO TOUCH

These files should NEVER be modified in ai-pandit-app:
- `apps/api/src/lib/seconds-precision-btr.ts` — Existing BTR works. Don't break it.
- `packages/db/src/schema.ts` — Production schema. Migrations run on live data.
- `apps/web/` — Live app. Don't touch.
- `.env*` files — Live secrets.

---

## BOTTOM LINE

**Hum already-built infrastructure ka 70% reuse kar sakte hain.** The existing app proves that Skyfield + Neon DB + Upstash Redis + Clerk + Cloud Run + Vercel stack WORKS in production for BTR. We just change the _reasoning core_ from algorithmic pipeline to agentic debate.

Estimated savings: **~2 months of development time** and **~18,000 lines of code** we don't have to write.
