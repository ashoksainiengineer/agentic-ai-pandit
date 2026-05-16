# AI-Pandit: Tech Stack & Architecture

## Stack Overview

```
┌──────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                    │
│  React (SaaS UI)  │  REST API  │  MCP Server (devs)      │
├──────────────────────────────────────────────────────────┤
│                     API LAYER                             │
│  FastAPI + Pydantic + Uvicorn                             │
├──────────────────────────────────────────────────────────┤
│                  ORCHESTRATION LAYER                      │
│  LangGraph (StateGraph) + PostgresSaver                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Lagna │→│Dasha │→│Varga │→│Foren-│→│Critic│          │
│  │Filter│ │Filter│ │Filter│ │ sic  │ │Agent │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
├──────────────────────────────────────────────────────────┤
│                     LLM LAYER                             │
│  Tier 1: Groq (Llama 3)  │  Tier 2: Claude Haiku         │
│  Tier 3: Claude Sonnet   │  Fallback: DeepSeek           │
├──────────────────────────────────────────────────────────┤
│                  ASTROLOGY ENGINE                         │
│  Skyfield  +  ndastro-engine (MIT)                        │
│  (planetary    (ayanamsa, retrograde,                    │
│   positions)    dasha, ascendant)                        │
├──────────────────────────────────────────────────────────┤
│                  DATA LAYER                               │
│  PostgreSQL (state checkpoints)  │  Redis (cache + queue) │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Core Language & Runtime

| Stack | Version | Why |
|-------|---------|-----|
| **Python** | 3.12+ | LangGraph, Skyfield, FastAPI — sab Python-first hain |
| **uv** | latest | Fastest Python package manager (replaces pip/poetry) |
| **Docker** | 26+ | Containerization for Cloud Run deployment |

---

## 2. Orchestration Engine — THE CORE

| Stack | Version | Why | Monthly Cost |
|-------|---------|-----|-------------|
| **LangGraph** | 1.2+ | StateGraph for hierarchical funnel. Conditional edges for pruning. PostgresSaver for crash recovery. **No alternative exists for our requirements.** | Free (MIT) |
| **LangChain** | 0.3+ | Required by LangGraph for LLM abstraction. | Free (MIT) |
| **Pydantic** | 2.0+ | Typed state schemas — BTRState, BirthTimeCandidate, ToolResponse | Free (MIT) |

**Why NOT CrewAI:** Hierarchical mode broken. Manager agent burns $0.01-0.04/step in token overhead.
**Why NOT AutoGen:** Deprecated. Microsoft moved to MAF.
**Why NOT OpenAI SDK:** No graph abstraction. No checkpointing. Handoff reliability issues.

### Key LangGraph Features We Use

```python
# 1. Conditional edges for scoring-based pruning
graph.add_conditional_edges("lagna_filter", route_by_score, {
    "dasha_filter": "dasha_filter",   # score >= 40 → continue
    "eliminate": END                   # score < 40 → prune
})

# 2. PostgresSaver for crash recovery
checkpointer = PostgresSaver.from_conn_string(DATABASE_URL)

# 3. Self-loop for critic re-evaluation (max 3 iterations)
graph.add_conditional_edges("critic", route_after_critic, {
    "done": END,
    "re_evaluate": "dasha_filter"  # go back if objection valid
})

# 4. Typed shared state (blackboard pattern)
class BTRState(TypedDict):
    candidates: list[BirthTimeCandidate]
    scores: dict[str, float]
    eliminated: list[BirthTimeCandidate]
    critic_iterations: int  # hard cap at 3
```

---

## 3. LLM Providers — Tiered Cost Model

| Tier | Provider | Model | Cost/M tokens (input) | Used For | Monthly Est. |
|------|----------|-------|----------------------|----------|-------------|
| **Cheap** | Groq | `llama-3.2-90b` | $0.06 | Orchestrator routing, anchor extraction | ~$5 |
| **Mid** | Anthropic | `claude-3-haiku` | $0.25 | Lagna, Dasha, Varga analysis | ~$20 |
| **Premium** | Anthropic | `claude-3-5-sonnet` | $3.00 | Forensic D-60 precision, Critic red-team | ~$150 |
| **Fallback** | DeepSeek | `deepseek-chat` | $0.14 | When Groq/Anthropic is down | ~$10 |

**Why Groq for cheap tier:** Fastest inference (1250+ tokens/sec). Cheapest per token. Perfect for routing decisions.
**Why Claude for analysis/precision:** Best reasoning quality for complex astrological interpretation. Less hallucination on structured data.
**Why DeepSeek as fallback:** Cheap, good reasoning, API compatible. Prevents single-provider dependency.

### Python SDK Setup

```bash
uv add langchain langchain-core langgraph
uv add langchain-groq langchain-anthropic
uv add langchain-deepseek  # fallback
```

---

## 4. Astrology Calculation Engine

| Stack | Version | What It Provides | License |
|-------|---------|-----------------|---------|
| **Skyfield** | 1.54 | High-precision JPL planetary positions (tropical) | MIT |
| **ndastro-engine** | latest | Lahiri Ayanamsa (16 systems), Retrograde detection, Ascendant calc, Vimshottari Dasha, Nakshatra lookup | MIT |
| **NumPy** | 2.0+ | Required by Skyfield for array operations | BSD |

**Why ndastro-engine over vedic-astro-engine-lite:**
- MIT license (startup-friendly) vs AGPL (restrictive)
- Type-safe enums for planets, houses, signs
- Battle-tested ayanamsa accuracy
- Clean API: `get_planet_position()`, `get_ascendant()`, `get_retrograde_planets()`

**What we build ourselves (not available in any library):**
- `find_lagna_boundaries()` — when lagna changes within a time window
- `find_varga_changes()` — when D-9/D-10/D-60 ascendant changes
- `get_d60_deities_and_prana()` — D-60 deity mapping + Prana dasha at second-level
- `calculate_btr_shuddhi()` — Kunda, Tatwa, Varna alignment

### Python SDK Setup

```bash
uv add skyfield
uv add ndastro-engine
uv add numpy
```

---

## 5. Database & Caching

| Stack | Version | Purpose | Monthly Cost |
|-------|---------|---------|-------------|
| **PostgreSQL** | 16+ | LangGraph checkpoint state (every node transition saved) | ~$20 (Supabase/Neon free tier) |
| **Redis** | 7+ | Tool result caching (LRU), rate limiting, task queue | ~$10 (Upstash free tier) |

### PostgresSaver Schema

```sql
-- Auto-created by PostgresSaver
CREATE TABLE checkpoints (
    thread_id TEXT,
    checkpoint_ns TEXT,
    checkpoint_id TEXT,
    parent_checkpoint_id TEXT,
    type TEXT,
    checkpoint JSONB,    -- Full BTRState serialized
    metadata JSONB,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE checkpoint_writes (
    thread_id TEXT,
    checkpoint_ns TEXT,
    checkpoint_id TEXT,
    task_id TEXT,
    idx INTEGER,
    channel TEXT,
    type TEXT,
    value BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);
```

**Why this matters:** Agar server 3 steps into a 10-step BTR workflow crash ho jaye, PostgresSaver se exact wahi se resume hoga. Production mein `MemorySaver` use karna = suicide.

### Redis Usage

```python
# Tool result caching (avoid recalculating same planetary position)
cache_key = f"snapshot:{date}:{time}:{lat}:{lon}"
if cached := redis.get(cache_key):
    return json.loads(cached)

result = skyfield.compute_snapshot(date, time, lat, lon)
redis.setex(cache_key, 3600, json.dumps(result))  # 1 hour TTL

# Rate limiting per API key
redis.incr(f"rate:{api_key}:{datetime.now().hour}")
```

---

## 6. API Layer

| Stack | Version | Purpose |
|-------|---------|---------|
| **FastAPI** | 0.115+ | REST API + auto OpenAPI docs |
| **Uvicorn** | 0.34+ | ASGI server |
| **Pydantic** | 2.0+ | Request/response validation (already used in LangGraph state) |
| **httpx** | 0.28+ | Async HTTP client for external API calls |
| **tenacity** | 9.0+ | Retry logic for tool calls (3 attempts, exponential backoff) |

### Key API Endpoints

```python
# POST /api/v1/rectify
# Main BTR endpoint
@app.post("/api/v1/rectify")
async def rectify_birth_time(request: RectifyRequest) -> RectifyResponse:
    """
    Input: birth_date, time_window (start/end), location, 30 life events
    Output: rectified_time, confidence, agent_reasoning_log
    """
    config = {"configurable": {"thread_id": request.session_id}}
    initial_state = BTRState(
        birth_date=request.birth_date,
        time_window_start=request.time_window_start,
        time_window_end=request.time_window_end,
        location=request.location,
        events=request.events,
        ...
    )
    result = await btr_graph.ainvoke(initial_state, config)
    return RectifyResponse(
        rectified_time=result["final_rectified_time"],
        confidence=result["confidence"],
        agent_log=result.get("agent_log", [])
    )

# GET /api/v1/rectify/{session_id}/status
# Check status of long-running BTR (streaming response)
@app.get("/api/v1/rectify/{session_id}/status")
async def get_status(session_id: str):
    """Returns current stage, candidates, scores mid-computation."""

# POST /api/v1/tools/{tool_name}
# Direct tool access for developers who want raw calculations
@app.post("/api/v1/tools/{tool_name}")
async def call_tool(tool_name: str, params: dict):
    """Direct access to any of the 18 astrology tools."""
```

---

## 7. MCP Server — Developer Integration

| Stack | Version | Purpose |
|-------|---------|---------|
| **mcp** | 1.6+ | Model Context Protocol server |
| **FastMCP** | 2.0+ | Simplified MCP server creation |

**Why MCP server is critical:** Every major astrology API now has an MCP server (AstroVisor, VedAstro, Asterwise, Astrology-API.io). It's becoming table stakes. Developers integrate your BTR into Claude Desktop, Cursor, or their own agents via MCP.

```python
from fastmcp import FastMCP

mcp = FastMCP("AI-Pandit BTR")

@mcp.tool()
async def rectify_birth_time(
    birth_date: str,
    time_window_start: str,
    time_window_end: str,
    latitude: float,
    longitude: float,
    life_events: list[dict]
) -> dict:
    """Find exact birth time using multi-agent debate on planetary data."""
    result = await btr_graph.ainvoke(...)
    return {
        "rectified_time": result["final_rectified_time"],
        "confidence": result["confidence"],
        "reasoning": result["agent_log"]
    }

@mcp.resource("btr://tools/list")
async def list_tools() -> str:
    """List all 18 available astrological tools."""
    return tool_registry.get_tool_descriptions_for_llm()
```

---

## 8. Frontend (SaaS Dashboard)

| Stack | Version | Purpose |
|-------|---------|---------|
| **React** | 19+ | UI framework |
| **TailwindCSS** | 4+ | Styling (fast, no custom CSS) |
| **shadcn/ui** | latest | Pre-built components (tables, forms, cards) |
| **Recharts** | 2+ | Confidence visualization charts |
| **@tanstack/react-query** | 5+ | API data fetching + caching |

### Key Screens

1. **Input Form:** Date, time window slider, location picker, 30 event input fields
2. **Live Progress:** Shows agent log in real-time (SSE stream from FastAPI)
3. **Results:** Rectified time with confidence score + full reasoning transcript
4. **History:** Past BTR sessions with scores and notes

**Important:** Build API-first. The SaaS dashboard is secondary. MCP server + REST API are your primary distribution channels.

---

## 9. Monitoring & Observability

| Stack | Version | Purpose | Monthly Cost |
|-------|---------|---------|-------------|
| **LangSmith** | latest | LangGraph trace debugging, cost attribution, eval datasets | $0 (free tier) / $39/mo (team) |
| **Sentry** | latest | Error tracking, crash reports | $0 (free tier) |
| **Prometheus** | latest | Custom metrics: tool_call_latency, llm_token_usage, btr_session_duration | $0 (self-hosted) |
| **Grafana** | latest | Dashboards for Prometheus metrics | $0 (self-hosted) |

### Critical Metrics to Track

```python
# Custom metrics
btr_session_duration = Histogram("btr_session_duration_seconds", "Total BTR session time")
tool_call_latency = Histogram("tool_call_latency_seconds", "Per-tool call time", ["tool_name"])
llm_token_usage = Counter("llm_token_usage_total", "Token consumption", ["model", "stage"])
pruning_effectiveness = Gauge("pruning_effectiveness_ratio", "% candidates eliminated per stage", ["stage"])
critic_override_rate = Gauge("critic_override_rate", "% times critic changed final answer")
```

---

## 10. Infrastructure & Deployment

| Stack | Purpose | Monthly Cost (MVP) |
|-------|---------|-------------------|
| **Google Cloud Run** | Serverless container hosting (auto-scale to zero) | ~$30 |
| **Supabase** | Managed PostgreSQL + Auth | $0 (free tier, 500MB) |
| **Upstash** | Managed Redis | $0 (free tier, 10K commands/day) |
| **GitHub Actions** | CI/CD pipeline | $0 (free tier) |
| **Cloudflare** | DNS + CDN + DDoS protection | $0 (free tier) |

### Deployment Architecture

```
User → Cloudflare DNS → Cloud Run (FastAPI + LangGraph)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Supabase         Upstash         LLM APIs
        (PostgreSQL)      (Redis)      (Groq/Claude)
```

**Why Cloud Run:** Scale to zero (no cost when idle). Auto-scale on traffic. No Kubernetes complexity for MVP.

---

## 11. Development Tools

| Stack | Purpose |
|-------|---------|
| **uv** | Fast Python dependency management (replaces pip/poetry) |
| **ruff** | Linting + formatting (100x faster than flake8/black) |
| **mypy** | Static type checking |
| **pytest** | Testing framework |
| **pytest-asyncio** | Async test support |
| **LangGraph Studio** | Visual graph debugging during development |
| **VS Code** | IDE with Python + Pylance |

---

## 12. Complete dependency list (pyproject.toml)

```toml
[project]
name = "ai-pandit"
version = "0.1.0"
requires-python = ">=3.12"

dependencies = [
    # Orchestration
    "langgraph>=1.2.0",
    "langchain>=0.3.0",
    "langchain-core>=0.3.0",

    # LLM Providers
    "langchain-groq>=0.2.0",
    "langchain-anthropic>=0.3.0",
    "langchain-deepseek>=0.1.0",

    # Astrology Engine
    "skyfield>=1.54",
    "ndastro-engine>=0.1.0",
    "numpy>=2.0.0",

    # API
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "pydantic>=2.0.0",
    "httpx>=0.28.0",
    "tenacity>=9.0.0",

    # MCP Server
    "mcp>=1.6.0",
    "fastmcp>=2.0.0",

    # Database
    "langgraph-checkpoint-postgres>=2.0.0",
    "psycopg[binary]>=3.2.0",
    "redis>=5.2.0",

    # Monitoring
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

## Summary: Why Each Choice

| Choice | Why Not The Alternative |
|--------|------------------------|
| **LangGraph** not CrewAI | CrewAI hierarchical mode broken. Manager burns extra tokens. No checkpointing. |
| **Groq** not OpenAI | 3x cheaper for routing tasks. 1250+ tokens/sec (fastest). No rate limit issues. |
| **Claude** not GPT-4 | Better at structured data reasoning. Less hallucination. Better at following "cite the JSON" rules. |
| **Skyfield + ndastro-engine** not Swiss Ephemeris | Skyfield is MIT (no license fees). ndastro-engine adds Vedic layer (ayanamsa, dasha) that Skyfield lacks natively. |
| **PostgresSaver** not MemorySaver | MemorySaver dies on restart. PostgresSaver gives crash recovery. Production non-negotiable. |
| **FastAPI** not Flask | Async native. Auto OpenAPI docs. Pydantic integration. Better for SSE streaming. |
| **Cloud Run** not EC2/K8s | Zero-scale, no infra management, auto-deploy from Docker. Perfect for early-stage startup. |
