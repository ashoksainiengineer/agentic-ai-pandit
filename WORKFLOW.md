# Agentic AI-Pandit: Developer Workflow Guide

**Version:** 1.0.0
**Stack:** Python 3.12 + LangGraph + FastAPI + Redis + PostgreSQL + Skyfield
**Adopted Standards:** Conventional Commits, Trunk-Based Development, Keep a Changelog

---

## Non-Negotiable Rules

1. Never run `git commit`, `git push`, or `git push --force` without explicit user approval.
2. Keep diffs small and reversible. No broad refactors unless explicitly requested.
3. Do not edit `.env*` files directly. Use `.env.example` as template.
4. Never log secrets, tokens, birth details, or raw PII.
5. Before submitting any code change, run the verification commands for the files you changed.
6. All functions must have type hints. `mypy --strict` must pass with zero errors.
7. All LLM calls must go through `LLMProvider` protocol — never import Groq/Anthropic directly in business logic.
8. Never write `type: ignore` or `as any` without an explicit comment justifying why.

---

## Project Structure

```
agentic-ai-pandit/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app factory
│   │   ├── config.py                  # Pydantic Settings
│   │   ├── models/                    # Pydantic models (PEP 746)
│   │   ├── orchestration/             # LangGraph StateGraph + nodes
│   │   │   ├── state.py               # BTRState TypedDict
│   │   │   ├── graph.py               # Workflow compiler
│   │   │   └── nodes/                 # Lagna, Dasha, Varga, Forensic, Critic
│   │   ├── agents/                    # LLM system prompts + structured output
│   │   │   ├── base.py                # LLMProvider protocol + adapters
│   │   │   └── prompts/               # v1/ Git-tracked markdown prompts
│   │   ├── tools/                     # 18-tool registry
│   │   │   ├── registry.py            # ToolRegistry class
│   │   │   ├── ephemeris_client.py    # HTTP client → Skyfield service
│   │   │   ├── definitions/           # Per-tool implementations
│   │   │   └── cache.py               # Redis-backed LRU cache
│   │   ├── event_store/               # Redis event store (blackboard)
│   │   ├── queue/                     # Async job processing
│   │   ├── db/                        # SQLAlchemy + Alembic
│   │   └── api/                       # FastAPI routes + middleware
│   ├── tests/                         # Mirror src/ structure
│   │   ├── conftest.py                # Shared fixtures (db, redis, mock llm)
│   │   ├── unit/                      # Fast, isolated (milliseconds)
│   │   ├── integration/               # Real DB, Redis, Ephemeris
│   │   └── e2e/                       # Full BTR pipeline
│   ├── pyproject.toml                 # Single config
│   ├── uv.lock                        # COMMIT THIS — reproducibility
│   ├── CHANGELOG.md                   # Keep a Changelog format
│   └── Dockerfile                     # Multi-stage production build
├── IMPLEMENTATION_PLAN.md
├── TECH_STACK_FINAL.md
├── REUSE_ANALYSIS.md
└── WORKFLOW.md                        # This file
```

---

## Day-1 Setup

```bash
# 1. Clone + enter
cd agentic-ai-pandit/backend

# 2. Install uv (if not installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 3. Pin Python version
uv python pin 3.12

# 4. Create virtual environment + install all dependencies
uv sync

# 5. Copy environment template
cp .env.example .env
# Fill in: NEON_DATABASE_URL, REDIS_URL, AI_API_KEY, ENCRYPTION_SECRET, etc.

# 6. Run database migrations
uv run alembic upgrade head

# 7. Start development server
uv run uvicorn app.main:app --reload --port 8000

# 8. Verify
curl http://localhost:8000/health
```

---

## Standard Commands

| Task | Command |
|------|---------|
| Start dev server | `uv run uvicorn app.main:app --reload` |
| Lint | `uv run ruff check app/ tests/` |
| Format | `uv run ruff format app/ tests/` |
| Type check | `uv run mypy app/ --strict` |
| Run all tests | `uv run pytest` |
| Run fast tests only | `uv run pytest -m "not slow"` |
| Run with coverage | `uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=80` |
| Run specific file | `uv run pytest tests/unit/test_models.py` |
| Run specific test | `uv run pytest tests/unit/test_models.py::test_candidate_data_package` |
| Generate migration | `uv run alembic revision --autogenerate -m "description"` |
| Run migrations | `uv run alembic upgrade head` |
| Pre-commit (all files) | `uv run pre-commit run --all-files` |
| Add dependency | `uv add package-name` |
| Add dev dependency | `uv add --dev package-name` |
| Update lockfile | `uv lock` |

---

## Verification Matrix

Only run the checks relevant to the files you changed:

| If you changed... | Run these commands |
|-------------------|--------------------|
| `app/models/**` | `uv run ruff check app/models/` + `uv run pytest tests/unit/test_models* -v` |
| `app/orchestration/**` | `uv run ruff check app/orchestration/` + `uv run pytest tests/unit/ -v` |
| `app/tools/**` | `uv run ruff check app/tools/` + `uv run pytest tests/unit/test_tools* -v` |
| `app/agents/**` | `uv run ruff check app/agents/` + `uv run pytest -m "not slow"` |
| `app/api/**` | `uv run ruff check app/api/` + `uv run pytest tests/integration/test_api* -v` |
| `app/db/**` | `uv run ruff check app/db/` + `uv run pytest tests/integration/test_database* -v` |
| `app/event_store/**` | `uv run ruff check app/event_store/` + `uv run pytest tests/integration/test_redis* -v` |
| `app/queue/**` | `uv run ruff check app/queue/` + `uv run pytest tests/integration/ -v` |
| Multiple areas | `uv run ruff check . && uv run mypy app/ --strict && uv run pytest` |
| Db schema changed | `uv run alembic upgrade head` + `uv run pytest tests/integration/ -v` |
| Prompt files (`prompts/v1/*.md`) | `uv run pytest tests/unit/test_prompts* -v` |

---

## Git Workflow (Trunk-Based Development)

```bash
# 1. Start fresh from main
git checkout main
git pull origin main

# 2. Create short-lived branch (initials + description, max 2 days)
git checkout -b nb/phase-1-pydantic-models

# 3. Make small, focused commits using Conventional Commits
git add app/models/btr.py tests/unit/test_models.py
git commit -m "feat(models): port CandidateDataPackage from TypeScript to Pydantic

Ported all ~50 fields from btr-types.ts.
Added Zod-equivalent validators for date precision, coordinate bounds.
Zodiac sign enum preserved as StrEnum."

# 4. Push + open PR (one PR = one concern, < 400 lines ideal)
git push origin nb/phase-1-pydantic-models

# 5. After review + CI passes, squash merge, delete branch
```

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body — what and why, not how]

[optional footer — BREAKING CHANGE, Closes #issue]
```

| Type | When to Use | SemVer Bump |
|------|-------------|-------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `refactor` | Code restructuring (no behavior change) | None |
| `perf` | Performance improvement | PATCH |
| `test` | Adding or updating tests | None |
| `docs` | Documentation only | None |
| `chore` | Maintenance, tooling | None |
| `feat!` or `fix!` | Breaking change | MAJOR |

**Examples:**
```
feat(orchestration): add Lagna filter node with scoring-based pruning
fix(db): handle connection pool timeout with automatic retry
refactor(tools): extract ephemeris client into separate module
test(agents): add mock LLM integration tests for Dasha expert
chore: update ruff to v0.15.10
```

---

## Coding Standards

### Type Hints (MANDATORY)
```python
# ✅ CORRECT
def get_dasha_for_date(
    periods: list[DashaPeriod],
    event_date: datetime,
) -> DashaAtDate | None:
    ...

# ❌ WRONG
def get_dasha_for_date(periods, event_date):
    ...
```

### Pythonic Patterns
```python
# ✅ Use pathlib
from pathlib import Path
prompt_path = Path("prompts/v1/lagna_expert.md")

# ✅ Use context managers
async with AsyncSessionLocal() as session:
    result = await session.execute(query)

# ✅ Use guard clauses (early returns)
def validate_event(event: LifeEvent) -> None:
    if not event.id:
        raise ValidationError("Event ID required")
    if event.date_precision == "exact_date" and not event.event_date:
        raise ValidationError("Exact date requires event_date")
    # happy path continues...

# ✅ Use specific exceptions
try:
    await redis_client.ping()
except redis.ConnectionError as e:
    logger.error("Redis unavailable", error=str(e))
    raise ServiceUnavailableError("Redis") from e

# ❌ NEVER bare except
try:
    risky_operation()
except:  # ← BANNED
    pass
```

### Pydantic Models
```python
# ✅ v2-style with field validators
from pydantic import BaseModel, field_validator

class BirthData(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    date_of_birth: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()[:200]
```

### Logging
```python
# ✅ Structured logging (structlog)
import structlog
logger = structlog.get_logger()

logger.info("btr_session_started",
    session_id=session_id,
    candidate_count=len(candidates),
    anchor_events=[e.id for e in anchor_events],
)

# ❌ NEVER log PII
logger.info(f"User {user.full_name} born on {user.date_of_birth}")  # ← BANNED

# ✅ Redact PII
logger.info("user_session_created", user_id=user.id)
```

### LLM Calls
```python
# ✅ Through LLMProvider protocol only
async def lagna_node(state: BTRState, llm: LLMProvider) -> dict:
    prompt = prompt_manager.get_prompt("lagna_expert", "v1")
    response = await llm.generate(
        system_prompt=prompt,
        messages=format_candidates(state.candidates),
        structured_output_schema=AgentVerdict,
    )
    return process_verdict(response)

# ❌ NEVER import Groq/Anthropic directly in business logic
from langchain_groq import ChatGroq  # ← BANNED in orchestration/tools/agents
```

---

## Testing Standards

### Test File Naming
- `test_<module_name>.py` in corresponding `tests/` subdirectory
- Test functions: `test_<behavior>_<scenario>()`
- Test classes: `Test<Component>`

### Test Organization
```python
# tests/conftest.py — Shared fixtures
@pytest.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session

@pytest.fixture
def mock_llm():
    """Returns a MockLLM with scripted responses."""
    llm = MockLLM()
    llm.add_response(content=json.dumps({"candidate_id": "1", "score": 85, "reasoning": "..."}))
    return llm

# tests/unit/test_models.py — Unit tests (fast, no I/O)
class TestCandidateDataPackage:
    def test_validates_required_fields(self):
        with pytest.raises(ValidationError):
            CandidateDataPackage(time="")  # Missing required fields

    def test_parses_from_json(self):
        data = CandidateDataPackage.model_validate(sample_json)
        assert data.time == "09:45:00"

# tests/integration/test_api.py — Integration tests (real DB, Redis)
@pytest.mark.integration
async def test_rectify_endpoint_returns_job_id(client: AsyncClient):
    response = await client.post("/api/v1/rectify", json=valid_request)
    assert response.status_code == 202
    assert "job_id" in response.json()
```

### Test Pyramid Ratios
- **Unit tests:** 70% — fast, isolated (mock LLM, mock DB)
- **Integration tests:** 25% — real DB, Redis, ephemeris service
- **E2E tests:** 5% — full pipeline with known birth times

### Coverage Targets
- `app/models/` — 90%
- `app/orchestration/` — 85%
- `app/tools/` — 85%
- `app/agents/` — 80%
- `app/api/` — 80%
- `app/db/` — 80%
- Total: >80% (enforced by `--cov-fail-under=80`)

---

## Code Review Checklist

Before submitting a PR, verify:

### Self-Review (Author)
- [ ] `ruff check .` passes with zero errors
- [ ] `ruff format .` applied
- [ ] `mypy app/ --strict` passes with zero errors
- [ ] `pytest` passes (all tests)
- [ ] `pytest --cov=app --cov-fail-under=80` passes
- [ ] PR is atomic (single concern, < 500 lines new code)
- [ ] PR description: what changed, why, how to test
- [ ] No unrelated files modified
- [ ] No `type: ignore` without justification comment
- [ ] No bare `except:`

### Reviewer Checklist
- [ ] All functions have type hints
- [ ] No mutable default arguments (`def func(items=None)` not `def func(items=[])`)
- [ ] Context managers used for resources (`async with`, `with`)
- [ ] Specific exceptions caught (no bare `except`)
- [ ] No hardcoded secrets (use `config.py` / env vars)
- [ ] No f-strings in SQL (use parameterized queries)
- [ ] LLM calls go through `LLMProvider` protocol
- [ ] Test coverage for new code (happy path + edge cases + failure cases)
- [ ] Documentation updated if behavior changed
- [ ] Prompts versioned in `prompts/v1/` if modified

---

## High-Risk Areas

These files affect the core BTR correctness. Prefer test-first edits and avoid behavior drift:

- `app/orchestration/graph.py` — Main LangGraph workflow compiler
- `app/orchestration/nodes/critic.py` — Critic loop (must respect max_iterations)
- `app/orchestration/state.py` — BTRState schema (every node depends on this)
- `app/tools/registry.py` — ToolRegistry (all 18 tools depend on this)
- `app/models/btr.py` — CandidateDataPackage (all agents depend on this)
- `app/event_store/store.py` — RedisEventStore (blackboard communication)
- `app/queue/lifecycle.py` — Job state transitions (must be atomic)
- `app/db/operations.py` — DB CRUD (optimistic locking)

---

## Deployment Safety

- Cloud Run deploy via `gcloud builds submit --config cloudbuild.yaml`
- Never change scaling defaults without discussion:
  - `min-instances=1` for API (prevents cold starts during processing)
  - `min-instances=0` for ephemeris (cost optimization when idle)
  - `timeout=3600` for API (BTR sessions can run up to 5 minutes)
- Canary deploy: test with 1 instance first, then scale
- Rollback: `gcloud run deploy --image <previous-image-digest>`

---

## Dependency Management

```bash
# Add runtime dependency (auto-updates pyproject.toml + uv.lock)
uv add httpx

# Add dev dependency
uv add --dev pytest-cov

# Update all dependencies
uv lock --upgrade

# Check for security vulnerabilities
uv run pip-audit

# See what's installed
uv tree

# Export for deployment
uv export --format requirements-txt --no-dev > requirements.txt
```

**Critical: Always commit `uv.lock`.** It is the foundation of reproducible builds. CI uses `--frozen` to fail if lockfile is stale.

---

## Environment Variables

Template: `.env.example` (commit this). Actual values: `.env` (NEVER commit).

```bash
# Required
NEON_DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
AI_API_KEY=sk-...
ENCRYPTION_SECRET=<64-char-hex>
CLERK_SECRET_KEY=sk_live_...

# Ephemeris
EPHEMERIS_SERVICE_URL=https://ephemeris-service-xxxxx-as.a.run.app
EPHEMERIS_HOUSE_SYSTEM=whole_sign

# Feature flags
USE_ASYNC_JOB_PIPELINE=true
JOB_EXECUTION_MODE=inline
```

---

## Definition of Done

A task is DONE when:
- [ ] Code compiles / type-checks (`mypy --strict` passes)
- [ ] Linting passes (`ruff check` clean)
- [ ] Formatting applied (`ruff format`)
- [ ] Relevant tests pass (see Verification Matrix above)
- [ ] Coverage target met (`--cov-fail-under=80`)
- [ ] No unrelated files changed
- [ ] Commit message follows Conventional Commits
- [ ] PR description includes: what, why, how to test (follow Prompt Contract below)

---

## Prompt Contract (For AI Coding Agents)

Every implementation task must specify:

1. **Goal** — One specific behavior change (e.g., "Implement Lagna filter node")
2. **Allowed files/areas** — Which directories can be modified
3. **Constraints** — No refactor, no API break, no schema change, etc.
4. **Acceptance checks** — Exact commands to run to verify
5. **Non-goals** — What NOT to do (prevent scope creep)

**Example:**
```
TASK: Implement Lagna filter node in LangGraph
FILES: app/orchestration/nodes/lagna_filter.py, app/orchestration/state.py
CONSTRAINTS: Do not modify graph.py routing logic. Use existing ToolRegistry.
ACCEPTANCE: uv run pytest tests/unit/test_lagna_filter.py -v
NON-GOALS: Do not modify Dasha or Varga nodes.
```

---

## References

- Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/
- Trunk-Based Development: https://trunkbaseddevelopment.com/
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Ruff Rules: https://docs.astral.sh/ruff/rules/
- uv Documentation: https://docs.astral.sh/uv/
- PEP 257 (Docstrings): https://peps.python.org/pep-0257/
- PEP 484 (Type Hints): https://peps.python.org/pep-0484/
