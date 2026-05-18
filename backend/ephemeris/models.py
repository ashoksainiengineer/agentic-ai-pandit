"""Request/response models for the ephemeris HTTP service.

Mirrors the interface expected by ``EphemerisClient`` in ``app.tools.ephemeris_client``.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


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
    timestamp_utc: str


class EphemerisServiceBatchRequest(EphemerisServiceBaseRequest):
    timestamps_utc: list[str]


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
