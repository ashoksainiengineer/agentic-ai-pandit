.PHONY: dev build test lint migrate reset clean

# ── Development ──────────────────────────────────────────────────────────────

dev:  ## Run the app locally with hot-reload
	cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-docker:  ## Run full stack via docker-compose
	docker compose up --build -d
	docker compose logs -f app

logs:  ## Tail all docker-compose logs
	docker compose logs -f

# ── Docker ───────────────────────────────────────────────────────────────────

build:  ## Build the Docker image without cache
	docker compose build --no-cache app

up:  ## Start all services in background
	docker compose up -d

down:  ## Stop all services
	docker compose down

down-volumes:  ## Stop and remove volumes (resets DB)
	docker compose down -v

# ── Database Migrations ──────────────────────────────────────────────────────

migrate:  ## Run pending Alembic migrations
	cd backend && .venv/bin/alembic upgrade head

migrate-auto:  ## Auto-generate a migration from model changes
	cd backend && .venv/bin/alembic revision --autogenerate -m "$(message)"

migrate-rollback:  ## Rollback one migration
	cd backend && .venv/bin/alembic downgrade -1

# ── Testing & Lint ───────────────────────────────────────────────────────────

test:  ## Run all tests
	cd backend && .venv/bin/pytest -x -q --no-header

test-cov:  ## Run tests with coverage report
	cd backend && .venv/bin/pytest --cov=app --cov-report=term-missing

lint:  ## Run ruff linter
	cd backend && .venv/bin/ruff check app/

typecheck:  ## Run mypy type checker
	cd backend && .venv/bin/mypy app/

check: lint typecheck test  ## Run all checks

format:  ## Auto-format code with ruff
	cd backend && .venv/bin/ruff format app/

# ── Utilities ────────────────────────────────────────────────────────────────

clean:  ## Remove caches and build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf .coverage htmlcov/

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
