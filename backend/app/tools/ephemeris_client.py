"""Ephemeris HTTP client — ported from ai-pandit-app skyfield-client.ts.

Communicates with the Python Skyfield ephemeris microservice
over HTTP.  Supports chart fetching (single + batch), sunrise
lookup, and health checks with retry on 5xx/network errors.
"""

from __future__ import annotations

from typing import Any

import httpx
import structlog
from pydantic import BaseModel, Field

from app.config import get_settings

log = structlog.get_logger()


# ── Request / Response types (ported from shared/types/ephemeris.ts) ──


class EphemerisServiceLocation(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitude_meters: float | None = Field(default=None, ge=-500, le=12_000)


class EphemerisServiceBaseRequest(BaseModel):
    location: EphemerisServiceLocation
    ayanamsha_mode: str = "lahiri"
    house_system: str = "placidus"
    node_mode: str = "true"


class EphemerisServiceSingleRequest(EphemerisServiceBaseRequest):
    timestamp_utc: str  # ISO 8601


class EphemerisServiceBatchRequest(EphemerisServiceBaseRequest):
    timestamps_utc: list[str]  # ISO 8601, 1–500


class EphemerisServiceSunriseRequest(BaseModel):
    start_timestamp_utc: str
    end_timestamp_utc: str
    location: EphemerisServiceLocation


class EphemerisServicePlanetPosition(BaseModel):
    body: str
    tropical_longitude: float
    tropical_latitude: float
    sidereal_longitude: float | None = None
    distance_au: float
    longitude_speed: float
    latitude_speed: float | None = None
    retrograde: bool
    magnitude: float | None = None


class EphemerisServiceHouses(BaseModel):
    ascendant_tropical: float
    mc_tropical: float
    house_cusps_tropical: list[float] = Field(min_length=12, max_length=12)
    ascendant_sidereal: float | None = None
    house_cusps_sidereal: list[float] | None = Field(default=None, min_length=12, max_length=12)


class EphemerisServiceChartResponse(BaseModel):
    timestamp_utc: str
    julian_day_ut: float
    julian_day_tt: float
    ayanamsha: float
    planets: list[EphemerisServicePlanetPosition]
    houses: EphemerisServiceHouses


class EphemerisServiceBatchResponse(BaseModel):
    charts: list[EphemerisServiceChartResponse]


class EphemerisServiceSunriseResponse(BaseModel):
    sunrise_timestamp_utc: str | None


class EphemerisServiceHealthResponse(BaseModel):
    service: str
    status: str
    ready: bool
    kernel_loaded: bool
    kernel_file: str
    timestamp: str
    version: str
    error: str | None = None


# ── errors ──


class EphemerisClientError(Exception):
    """Base for all ephemeris client errors."""


class EphemerisServiceError(EphemerisClientError):
    """The ephemeris service returned an error response."""


class EphemerisTimeoutError(EphemerisClientError):
    """Request exceeded timeout."""


# ── client ──


class EphemerisClient:
    """HTTP client for the Skyfield ephemeris microservice.

    Usage::

        client = EphemerisClient()
        chart = await client.fetch_chart(
            EphemerisServiceSingleRequest(...)
        )
        charts = await client.fetch_charts_batch(
            EphemerisServiceBatchRequest(...)
        )
    """

    def __init__(
        self,
        service_url: str | None = None,
        timeout_s: float | None = None,
        api_key: str | None = None,
        max_retries: int = 2,
    ) -> None:
        settings = get_settings()
        self._service_url = (service_url or settings.ephemeris_service_url).rstrip("/")
        self._timeout_s = timeout_s or settings.ephemeris_service_timeout_s
        self._api_key = api_key
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self._timeout_s),
            headers=self._build_headers(),
        )
        self._log = log.bind(component="EphemerisClient")

    def _build_headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"content-type": "application/json"}
        if self._api_key:
            headers["x-api-key"] = self._api_key
        return headers

    # ── internal ──

    async def _request_json(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        *,
        timeout_s: float | None = None,
    ) -> Any:
        url = f"{self._service_url}{path}"
        last_error: Exception | None = None

        for attempt in range(self._max_retries + 1):
            try:
                if attempt > 0:
                    wait = attempt * 1.0  # 1s, 2s backoff
                    self._log.info("ephemeris_retry", attempt=attempt, path=path)
                    import asyncio
                    await asyncio.sleep(wait)

                response = await self._client.request(
                    method,
                    url,
                    json=body,
                    timeout=timeout_s or self._timeout_s,
                )

                if response.status_code >= 500:
                    raise EphemerisServiceError(
                        f"Ephemeris service returned {response.status_code} for {path}: "
                        f"{response.text[:500]}"
                    )

                if response.status_code >= 400:
                    raise EphemerisServiceError(
                        f"Ephemeris service returned {response.status_code} for {path}: "
                        f"{response.text[:500]}"
                    )

                return response.json()

            except httpx.TimeoutException:
                last_error = EphemerisTimeoutError(
                    f"Ephemeris request timed out for {path} (attempt {attempt + 1})"
                )
                continue
            except httpx.ConnectError as exc:
                last_error = EphemerisClientError(
                    f"Ephemeris connection failed for {path} (attempt {attempt + 1}): {exc}"
                )
                continue
            except EphemerisServiceError:
                raise
            except Exception as exc:
                last_error = EphemerisClientError(
                    f"Ephemeris request failed for {path} (attempt {attempt + 1}): {exc}"
                )
                continue

        raise EphemerisClientError(
            f"Ephemeris request failed after {self._max_retries} retries"
        ) from last_error

    # ── public ──

    async def fetch_chart(self, request: EphemerisServiceSingleRequest) -> EphemerisServiceChartResponse:
        """Fetch a single ephemeris chart."""
        batch_request = EphemerisServiceBatchRequest(
            location=request.location,
            ayanamsha_mode=request.ayanamsha_mode,
            house_system=request.house_system,
            node_mode=request.node_mode,
            timestamps_utc=[request.timestamp_utc],
        )
        batch = await self.fetch_charts_batch(batch_request)
        if not batch.charts:
            raise EphemerisServiceError("Ephemeris batch response contained no charts")
        return batch.charts[0]

    async def fetch_charts_batch(self, request: EphemerisServiceBatchRequest) -> EphemerisServiceBatchResponse:
        """Fetch ephemeris charts for multiple timestamps (POST /v1/positions/batch)."""
        batch_size = len(request.timestamps_utc)
        timeout_s = max(30.0, batch_size * 0.2)  # ~200 ms per chart, min 30 s
        data = await self._request_json(
            "POST",
            "/v1/positions/batch",
            body=request.model_dump(mode="json"),
            timeout_s=timeout_s,
        )
        return EphemerisServiceBatchResponse.model_validate(data)

    async def fetch_sunrise(self, request: EphemerisServiceSunriseRequest) -> EphemerisServiceSunriseResponse:
        """Fetch sunrise time (POST /v1/sunrise)."""
        data = await self._request_json(
            "POST",
            "/v1/sunrise",
            body=request.model_dump(mode="json"),
        )
        return EphemerisServiceSunriseResponse.model_validate(data)

    async def fetch_health(self) -> EphemerisServiceHealthResponse:
        """Check ephemeris service health (GET /health)."""
        data = await self._request_json("GET", "/health")
        return EphemerisServiceHealthResponse.model_validate(data)

    async def close(self) -> None:
        await self._client.aclose()
