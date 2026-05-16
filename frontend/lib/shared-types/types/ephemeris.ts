/**
 * 🔱 AI-Pandit Ephemeris / Astrology Types
 * ==========================================
 * Planet positions, house cusps, divisional charts, ephemeris data,
 * and all ephemeris service request/response types.
 */

import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// CORE ASTROLOGY DATA TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ShadbalaBreakdown {
  sthana: number;
  dig: number;
  kaala: number;
  cheshta: number;
  naisargika: number;
  total: number;
}

export interface PlanetPosition {
  sign: string;
  degree: number;
  longitude: number;
  latitude: number;
  nakshatra: string;
  nakshatraPada?: number;
  lord: string;
  retro: boolean;
  speed: number;
  longitudeSpeed?: number;
  distance: number;
  isCombust: boolean;
  dignity: string;
  house: number;
}

export interface HousePosition {
  houseNumber: number;
  sign: string;
  degree: number;
  cusp: number;
  lord: string;
  subLord?: string;
}

export interface DivisionalChart {
  id: string;
  planets: Record<string, PlanetPosition>;
  ascendant: {
    sign: string;
    degree: number;
    longitude: number;
  };
}

export interface EphemerisData {
  planets: {
    sun: PlanetPosition;
    moon: PlanetPosition;
    mercury: PlanetPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
    rahu: PlanetPosition;
    ketu: PlanetPosition;
  };
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: string;
    longitude: number;
    subLord?: string;
  };
  houses: HousePosition[];
  divisionalCharts?: Record<string, DivisionalChart>;
  ashtakavarga?: Record<string, number | number[]>;
  shadbala?: Record<string, ShadbalaBreakdown>;
  kpCusps?: number[];
ayanamsa?: number;
  precisionMode?: 'high' | 'algorithmic' | 'algorithmic-fallback';
  vimshottariDasha?: unknown[];
  transitData?: Record<string, unknown>;
  nadiData?: Record<string, unknown>;
  vargaDegrees?: Record<string, Record<string, string>>;
  d60Sign?: string;
  d60Planets?: Record<string, { sign?: string; degree?: string; deity?: string }>;
}

export interface MinifiedEphemeris {
  sun: string;
  moon: string;
  ascendant: string;
}

export type EphemerisAyanamsaMode = 'lahiri' | 'raman' | 'kp' | 'krishnamurti';

export type EphemerisHouseSystem = 'whole_sign' | 'equal' | 'placidus' | 'koch';

export type EphemerisNodeMode = 'true' | 'mean';

export type EphemerisServiceBodyName =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'rahu'
  | 'ketu';

// ═════════════════════════════════════════════════════════════════════════════
// EPHEMERIS SERVICE TYPES (Python Skyfield service)
// ═════════════════════════════════════════════════════════════════════════════

export interface EphemerisServiceLocation {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export const EphemerisServiceLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitudeMeters: z.number().min(-500).max(12000).optional(),
});

export interface EphemerisServiceBaseRequest {
  location: EphemerisServiceLocation;
  ayanamshaMode?: EphemerisAyanamsaMode;
  houseSystem?: EphemerisHouseSystem;
  nodeMode?: EphemerisNodeMode;
}

export const EphemerisServiceBaseRequestSchema = z.object({
    location: EphemerisServiceLocationSchema,
    ayanamshaMode: z.enum(['lahiri']).default('lahiri'),
    houseSystem: z.enum(['whole_sign', 'equal', 'placidus']).default('placidus'),
    nodeMode: z.enum(['true', 'mean']).default('true'),
});

export interface EphemerisServiceSingleRequest extends EphemerisServiceBaseRequest {
  timestampUtc: string;
}

export const EphemerisServiceSingleRequestSchema = EphemerisServiceBaseRequestSchema.extend({
    timestampUtc: z.string().datetime(),
});

export interface EphemerisServiceBatchRequest extends EphemerisServiceBaseRequest {
  timestampsUtc: string[];
}

export const EphemerisServiceBatchRequestSchema = EphemerisServiceBaseRequestSchema.extend({
    timestampsUtc: z.array(z.string().datetime()).min(1).max(500),
});

export interface EphemerisServiceSunriseRequest {
  startTimestampUtc: string;
  endTimestampUtc: string;
  location: EphemerisServiceLocation;
}

export const EphemerisServiceSunriseRequestSchema = z.object({
    startTimestampUtc: z.string().datetime(),
    endTimestampUtc: z.string().datetime(),
    location: EphemerisServiceLocationSchema,
});

export interface EphemerisServicePlanetPosition {
  body: EphemerisServiceBodyName;
  tropicalLongitude: number;
  tropicalLatitude: number;
  siderealLongitude?: number;
  distanceAu: number;
  longitudeSpeed: number;
  latitudeSpeed?: number;
  retrograde: boolean;
}

export const EphemerisServicePlanetPositionSchema = z.object({
    body: z.enum(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu']),
    tropicalLongitude: z.number(),
    tropicalLatitude: z.number(),
    siderealLongitude: z.number().optional(),
    distanceAu: z.number(),
    longitudeSpeed: z.number(),
    latitudeSpeed: z.number().optional(),
    retrograde: z.boolean(),
});

export interface EphemerisServiceHouses {
  ascendantTropical: number;
  mcTropical: number;
  houseCuspsTropical: number[];
  ascendantSidereal?: number;
  houseCuspsSidereal?: number[];
}

export const EphemerisServiceHousesSchema = z.object({
    ascendantTropical: z.number(),
    mcTropical: z.number(),
    houseCuspsTropical: z.array(z.number()).length(12),
    ascendantSidereal: z.number().optional(),
    houseCuspsSidereal: z.array(z.number()).length(12).optional(),
});

export interface EphemerisServiceChartResponse {
  timestampUtc: string;
  julianDayUt: number;
  julianDayTt: number;
  ayanamsha: number;
  planets: EphemerisServicePlanetPosition[];
  houses: EphemerisServiceHouses;
}

export const EphemerisServiceChartResponseSchema = z.object({
    timestampUtc: z.string().datetime(),
    julianDayUt: z.number(),
    julianDayTt: z.number(),
    ayanamsha: z.number(),
    planets: z.array(EphemerisServicePlanetPositionSchema),
    houses: EphemerisServiceHousesSchema,
});

export interface EphemerisServiceBatchResponse {
  charts: EphemerisServiceChartResponse[];
}

export const EphemerisServiceBatchResponseSchema = z.object({
    charts: z.array(EphemerisServiceChartResponseSchema),
});

export interface EphemerisServiceSunriseResponse {
  sunriseTimestampUtc: string | null;
}

export const EphemerisServiceSunriseResponseSchema = z.object({
    sunriseTimestampUtc: z.string().datetime().nullable(),
});

export interface EphemerisServiceHealthResponse {
  service: 'ephemeris';
  status: 'healthy' | 'degraded' | 'unhealthy';
  ready: boolean;
  kernelLoaded: boolean;
  kernelFile: string;
  timestamp: string;
  version: string;
  error?: string | null;
}

export const EphemerisServiceHealthResponseSchema = z.object({
    service: z.literal('ephemeris'),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    ready: z.boolean(),
    kernelLoaded: z.boolean(),
    kernelFile: z.string(),
    timestamp: z.string().datetime(),
    version: z.string(),
    error: z.string().nullable().optional(),
});
