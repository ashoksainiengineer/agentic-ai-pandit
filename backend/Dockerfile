FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS builder
WORKDIR /app

# Install system dependencies for psycopg binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install project dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY . .

# Final stage — slim runtime image
FROM python:3.12-slim-bookworm AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
COPY --from=builder /root/.local /root/.local

ENV PATH="/root/.local/bin:/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
