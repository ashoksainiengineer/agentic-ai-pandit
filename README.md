# AI-Pandit (Agentic): Autonomous BTR Engine

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-238%20passing-brightgreen.svg)](backend/tests)
[![Code Style: Ruff](https://img.shields.io/badge/Code%20Style-Ruff-0e7a3b.svg)](https://docs.astral.sh/ruff/)

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**
> This repository is publicly visible for transparency and portfolio purposes only.
> No license is granted to use, copy, modify, or distribute this code. See [LICENSE](LICENSE) for full terms.

AI-Pandit (Agentic) is a high-performance, autonomous Birth Time Rectification (BTR) platform that determines accurate birth times down to the **second**. It combines classical Vedic astrology with an **agentic LangGraph pipeline** — multiple AI agents debate, filter, and converge on the most astronomically and astrologically consistent birth time.

This is the **agentic version** of the original [ai-pandit-app](https://github.com/ashoksainiengineer/ai-pandit-app). The backend has been ported from Express/TypeScript to **Python/FastAPI**, and the monolithic pipeline has been replaced with a **multi-agent LangGraph architecture**.

---

## 🏗 Architecture

```
User ←→ Next.js Frontend (port 3000)
            ↕ HTTP / SSE
        FastAPI Backend (port 8000)
            ↕
 ┌──────────────────────────────┐
 │   LangGraph Agent Pipeline   │
 │                              │
 │  Lagna Filter → Dasha Filter│
 │       → Varga Filter        │
 │   → Forensic Filter → Critic│
 │         ↻ (feedback loop)   │
 └──────────────────────────────┘
            ↕
    ToolRegistry → Ephemeris API
    Redis (cache + event stream)
    PostgreSQL (sessions + jobs)
```

### Key Components

| Layer | Technology | Description |
|-------|------------|-------------|
| **Orchestration** | LangGraph (Python) | Multi-agent StateGraph with conditional routing and critic feedback loop |
| **Backend API** | FastAPI | REST endpoints for sessions, rectification, SSE streaming, admin, health |
| **LLM Agents** | Groq / Anthropic / DeepSeek | Tiered AI providers (cheap, mid, premium) for agent reasoning |
| **Database** | PostgreSQL (async SQLAlchemy) | Sessions, jobs, events, artifacts with Alembic migrations |
| **Cache / Queue** | Redis | Job event store, rate limiting, SSE pub/sub |
| **Ephemeris** | HTTP client → Skyfield service | JPL DE440 planetary data for all astrological calculations |
| **Frontend** | Next.js 15 (extracted) | Dashboard, rectification flow, real-time SSE progress, results |

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Agentic Pipeline](#-agentic-pipeline)
- [Tech Stack](#-tech-stack)
- [Repository Map](#-repository-map)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [License](#-license)

---

## 🤖 Agentic Pipeline

The core innovation is the **LangGraph StateGraph** — 5 agent nodes with a conditional critic loop:

| Stage | Node | Description |
|-------|------|-------------|
| 1 | **Lagna Filter** | Evaluates each candidate's Lagna + Moon nakshatra against anchor life events |
| 2 | **Dasha Filter** | Cross-references Vimshottari Dasha periods with event timing |
| 3 | **Varga Filter** | Validates divisional chart consistency (D9, D10, D60) |
| 4 | **Forensic Filter** | Deep astrological forensic analysis (Shadbala, Yogas, transits) |
| 5 | **Critic** | Reviews all evidence, can route back to any earlier stage (up to 3 iterations) |

Each node uses an LLM agent to score and prune candidates. The critic can reject the results and send the pipeline back to an earlier stage for re-evaluation — creating a **self-correcting, debate-driven** rectification process.

**ToolRegistry** provides 18+ astrological tools (planetary snapshot, sign/nakshatra, aspects, dignity, dashas, Vargas, Shadbala, Yogas, KP sub-lords, etc.) that agents call during evaluation.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.12+, FastAPI, LangGraph, SQLAlchemy 2.0 (async), Alembic |
| **LLM Agents** | Groq (cheap), Anthropic Claude (mid), DeepSeek (premium fallback) |
| **Database** | PostgreSQL 16 (async via psycopg) |
| **Cache/Queue** | Redis 7 (event store, rate limiting, SSE pub/sub) |
| **Auth** | Clerk (JWT verification) |
| **Ephemeris** | HTTP service → JPL DE440 via Skyfield |
| **Monitoring** | Prometheus metrics, OpenTelemetry tracing, Sentry error tracking |
| **Frontend** | Next.js 15, React 18, Zustand, TailwindCSS, Framer Motion, Recharts |
| **Deployment** | Docker Compose (local), Google Cloud Run (production) |

---

## 🗺 Repository Map

```
agentic-ai-pandit/
├── backend/
│   ├── app/
│   │   ├── agents/              # LLM agent base + prompts + structured output
│   │   ├── api/                 # FastAPI routers, middleware, dependencies
│   │   ├── config.py            # Pydantic Settings (env-based configuration)
│   │   ├── db/                  # SQLAlchemy models, engine, CRUD operations
│   │   ├── event_store/         # Redis-backed job event store (SSE streaming)
│   │   ├── models/              # Pydantic models (BTR types, events, streams)
│   │   ├── orchestration/       # LangGraph StateGraph + filter nodes
│   │   ├── queue/               # Background job worker (async consumer)
│   │   ├── tools/               # 18+ astrological tool implementations
│   │   └── main.py              # FastAPI app factory
│   ├── migrations/              # Alembic migration scripts
│   ├── tests/                   # 238 unit + integration tests
│   └── Dockerfile               # Multi-stage build
├── frontend/                    # Next.js 15 standalone frontend
│   ├── app/                     # App Router pages (dashboard, rectify, admin, auth)
│   ├── components/              # UI components (rectify flow, events, dashboard, landing)
│   ├── hooks/                   # Custom React hooks (analysis, SSE, auto-save)
│   ├── lib/                     # API client, auth, stores, shared types, utilities
│   └── Dockerfile
├── docker-compose.yml           # Full stack: app + web + postgres + redis
├── Makefile                     # Dev, test, build, lint, migrate commands
└── .env.example                 # Environment variable templates
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.12+, Node.js 20+, Docker (optional)

### Local Development

```bash
# Backend
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # Fill in your keys
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev             # Starts on port 3000

# With Docker (full stack)
docker compose up --build
```

### Run Database Migrations

```bash
cd backend
alembic upgrade head
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/sessions` | List sessions |
| `POST` | `/api/v1/sessions` | Create session |
| `GET` | `/api/v1/sessions/{id}` | Get session |
| `PUT` | `/api/v1/sessions/{id}` | Update session |
| `DELETE` | `/api/v1/sessions/{id}` | Delete session |
| `POST` | `/api/v1/sessions/{id}/clone` | Clone session |
| `POST` | `/api/v1/rectify` | Submit rectification job (returns job_id) |
| `GET` | `/api/v1/rectify/{job_id}` | Poll job status |
| `GET` | `/api/v1/rectify/{job_id}/stream` | SSE event stream |
| `GET` | `/api/v1/rectify/{job_id}/events` | Job event log |
| `POST` | `/api/v1/rectify/{job_id}/cancel` | Cancel job |
| `GET` | `/api/v1/candidate/ephemeris` | Ephemeris lookup |
| `GET` | `/admin/metrics/system` | System metrics |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/docs` | OpenAPI docs (dev only) |

---

## 🧪 Testing

```bash
# Full test suite
cd backend
pytest -x -q            # 238 tests

# Specific test files
pytest tests/unit/test_structured_output.py -v
pytest tests/unit/test_event_store.py -v
pytest tests/unit/test_worker.py -v
pytest tests/unit/test_rate_limit.py -v
pytest tests/unit/test_auth.py -v

# With coverage
pytest --cov=app --cov-report=term-missing

# Lint and type checking
ruff check app/
mypy app/
```

---

## ⚖️ License

Proprietary. See [LICENSE](LICENSE) for full terms.
No license is granted for use, modification, or distribution.

---

**Built with ❤️ for the Vedic astrology community**
