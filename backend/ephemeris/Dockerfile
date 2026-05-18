FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir "uvicorn[standard]>=0.34.0" "fastapi>=0.115.0" "pydantic>=2.0.0" "skyfield>=1.49.0" "scipy>=1.14.0" "structlog>=25.0.0" "httpx>=0.28.0"

# Copy service code
COPY ephemeris/ /app/ephemeris/

EXPOSE 8001

CMD ["uvicorn", "ephemeris.main:app", "--host", "0.0.0.0", "--port", "8001"]
