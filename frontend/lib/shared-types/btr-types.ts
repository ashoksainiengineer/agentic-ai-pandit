/**
 * BTR (Birth Time Rectification) Type Definitions
 *
 * Centralized types for the seconds-precision BTR system.
 * These types were extracted from seconds-precision-btr.ts for better modularity.
 */

import { LifeEvent, DatePrecision, CandidateScore, CandidateTime as SharedCandidateTime } from './types.js';
export type { DatePrecision, CandidateScore };

// Types internal to the backend calculation engine
type CandidateTime = SharedCandidateTime;
export interface KalachakraPeriod {
  sign: string;
  signIndex: number;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  lord: string;
  kalachakraType: string;
}

type ShadbalaSummary = unknown;
type NadiAmshaData = unknown;
type D150EventAnalysis = unknown;
type D9VerificationResult = unknown;
type GandantaAnalysis = unknown;

export interface PakshiData {
  name: string;
  sanskritName: string;
  element: string;
  rulingHours: number[];
  qualities: string[];
  dominantActivities: string[];
  weakActivities: string[];
}

export interface PakshiAnalysis {
  rulingBird: PakshiData;
  secondaryBird: PakshiData | null;
  birdStrength: 'excellent' | 'good' | 'moderate' | 'weak';
  birthTimeQuality: string;
  activityStrengths: string[];
  activityWeaknesses: string[];
  personalityTraits: string[];
  verificationNotes: string;
}

import { z } from 'zod';

export const ZODIAC_SIGNS: readonly string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/** Mapping of signs to their traditional lords */
export const SIGN_LORDS: Record<string, string> = {
  Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
  Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
  Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter'
};

/** Sequence of Tatwas in a cycle */
export const TATWA_SEQUENCE: string[] = ['prithvi', 'jala', 'agni', 'vayu', 'akasha'];

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export interface Yoga {
  name: string;
  description: string;
  significance: string;
  planetsInvolved: string[];
}

export interface PlanetData {
  longitude?: number;
  sign: string;
  degree: string;
  nakshatra: string;
  house: number;
  dignity: string;
  isRetro: boolean;
  speed: number;
  isCombust: boolean;
  shadbala?: number;
  bav?: number;
  functionalNature?: { role: string; reason: string };
  aspects?: unknown[];
  avastha?: string;
  d60Deity?: string;
  compoundDignity?: string;
  shadbalaBreakdown?: {
    total: number;
    sthana: number;
    dig: number;
    kaala: number;
    cheshta?: number;
  };
  ishtaKashtaPhala?: { ishta: number; kashta: number };
}

export const PlanetDataSchema = z.object({
    sign: z.string(),
    degree: z.union([z.number(), z.string()]),
    nakshatra: z.string().optional(),
    house: z.number().optional(),
}).passthrough(); // passthrough: allows extra planetary fields from ephemeris not in core schema (dignity, isRetro, speed, isCombust, shadbala, aspects, etc.)

/** Special astrological points (AL, UL, BB) */
export interface SpecialPoint {
  sign: string;
  degree: string;
  house: number;
}

/** Vimshottari Dasha entry */
export interface VimshottariDashaEntry {
  maha: string;
  antar: string;
  pratyantar: string;
  sukshma: string;
  prana: string;
  startEnd: string;
}

export const VimshottariDashaEntrySchema = z.object({
    maha: z.string().min(1),
    antar: z.string().min(1),
    pratyantar: z.string().min(1),
    sukshma: z.string().optional(),
    prana: z.string().optional(),
    startEnd: z.string()
});

/** Chara Karaka Definition */
export interface CharaKaraka {
  karakaName: string;
  planet: string;
  degree: number;
}

export interface DivisionalChartData {
  ascendant: string;
  planets: Record<string, string>;
}

/** Panchanga (5 limbs of time) data */
export interface PanchangaData {
  tithi: string;
  vara: string;
  nakshatra: string;
  yoga: string;
  karana: string;
}

/** Spouse synastry match result */
export interface SpouseMatch {
  lagnaMatch: boolean;
  moonMatch: boolean;
  score: number;
  reason: string;
}

/** D60 planetary position with deity */
export interface D60PlanetData {
  sign: string;
  degree: string;
  deity: string;
}

/** Vedic signals (vargottama, parivartana, etc.) */
export interface VedicSignals {
  vargottama?: string[];
  parivartana?: Array<{ houses: number[] }>;
  pushkar?: string[];
  charaKarakas?: CharaKaraka[];
  tatwa?: { name: string; element: string; isAuspicious: boolean };
  kundaLagna?: { sign: string; degree: number; matchesMoon: boolean };
}

/** Complete candidate data package for AI analysis */
export interface CandidateDataPackage {
  time: string;
  offsetMinutes: number;
  candidateDate?: string;
  dayOffset?: number;
  candidateKey?: string;
  planets: Record<string, PlanetData>;
  specialPoints?: Record<string, SpecialPoint>;
  ascendant: { sign: string; degree: string; nakshatra: string; longitude?: number };
  houseLords: Record<number, string>;
  moonNakshatra: string;
  ayanamsa?: number;
  vimshottariDasha: VimshottariDashaEntry[];
  yoginiDasha?: Array<{ lord: string; startEnd: string }>;
  charaDasha?: Array<{ sign: string; startEnd: string }>;
  d9Lagna?: string;
  d10Lagna?: string;
  d60Sign?: string;
  d150Sign?: string;
  d9Chart?: DivisionalChartData;
  d10Chart?: DivisionalChartData;
  d150Chart?: DivisionalChartData;
  ashtakavarga?: Record<string, number>;
  panchanga?: PanchangaData;
  yogas?: Yoga[];
  doubleTransitAnalysis?: Record<string, { isTriggered: boolean; details: Array<Record<string, unknown>> }>;
  lifecycleShifts?: Array<{ date: string; event: string; dasha: string }>;
  transitData?: Record<string, {
    dasha: string;
    signatures: string[];
    planets: Record<string, string>;
    doubleTransit: { isTriggered: boolean; details: Array<Record<string, unknown>> };
  }>;
  aiScore?: number;
  aiVerdict?: string;
  rawVimshottari?: unknown[];
  vedicSignals?: VedicSignals;
  charaKarakas?: CharaKaraka[];
  vimsopakaBala?: Record<string, number>;
  chalitDiscrepancies?: Array<{ planet: string; rasiHouse: number; chalitHouse: number }>;
  ishtaKashtaPhala?: Record<string, { ishta: number; kashta: number }>;
  vargaDegrees?: Record<string, Record<string, string>>;
  d60Planets?: Record<string, D60PlanetData>;
  sandhiZones?: string[];
  spouseMatch?: SpouseMatch;
  kalachakraDasha?: KalachakraPeriod[];
  shadbalaSummary?: ShadbalaSummary;
  nadiData?: Record<string, NadiAmshaData>;
  nadiAnalysis?: D150EventAnalysis[];
  spouseD9Verification?: D9VerificationResult;
  gandantaAnalysis?: GandantaAnalysis;
  pakshiAnalysis?: PakshiAnalysis;
  d12Chart?: DivisionalChartData;
  kpData?: {
    planetSubLords?: Record<string, {
      starLord: string;
      subLord: string;
      subSubLord: string;
      subSubSubLord?: string;
    }>;
    cuspalSubLords?: Record<number, {
      house: number;
      cusp: number;
      sign: string;
      starLord: string;
      subLord: string;
      subSubLord: string;
      subSubSubLord?: string;
    }>;
  };
  precision?: {
    kpSubLords?: Record<string, {
      starLord: string;
      subLord: string;
      subSubLord: string;
      subSubSubLord?: string;
    }>;
    cuspalSubLords?: Record<number, {
      house: number;
      cusp: number;
      sign: string;
      starLord: string;
      subLord: string;
      subSubLord: string;
      subSubSubLord?: string;
    }>;
    consensus?: {
      overallConsensus: number;
      confidenceLevel: string;
      marginOfError: number;
      redFlags?: {
        sandhiBirth?: boolean;
        gandanta?: boolean;
        dashaSandhi?: boolean;
        conflictingMethods?: boolean;
        weakSignificators?: boolean;
        d60Instability?: boolean;
      };
      };
    };
  };

export const TransitPlanetSchema = z.string().min(1).refine(val => val.includes('| H'), {
    message: 'Transit planet must include house position indicator (| H)'
});

export const TransitDataEntrySchema = z.object({
    dasha: z.string().min(1).refine(val => val !== 'Unknown', {
        message: 'Dasha sequence must not be Unknown'
    }),
    signatures: z.array(z.string()),
    planets: z.record(z.string(), TransitPlanetSchema),
    doubleTransit: z.object({ isTriggered: z.boolean(), details: z.array(z.record(z.unknown())) }),
});


export const CandidateDataPackageSchema = z.object({
    time: z.string(),
    offsetMinutes: z.number(),
    ascendant: z.object({
        sign: z.string(),
        degree: z.string(),
        nakshatra: z.string().optional(),
    }),
    planets: z.record(z.string(), PlanetDataSchema),
    houseLords: z.record(z.union([z.string(), z.number()]), z.string()),
    vimshottariDasha: z.array(VimshottariDashaEntrySchema).min(1),
    transitData: z.record(z.string(), TransitDataEntrySchema).optional(),
    ayanamsa: z.number().optional(),
}).passthrough(); // passthrough: pipeline adds ~50+ optional analysis fields (yoginis, shadbala, nadi, KP data, etc.)

/** Result of a single stage in the BTR process */
export interface StageResult {
  stageNumber: number;
  stageName: string;
  candidatesIn: number;
  candidatesOut: number;
  batchCount?: number;
  aiReasoning?: string;
}

export interface TournamentRound {
  roundNumber: number;
  batchesProcessed: number;
  candidatesIn: number;
  candidatesOut: number;
}

/** Anonymized candidate for blind evaluation */
export interface AnonymizedCandidate {
  id: string;
  time: string;
  originalOffsetDescription: string;
  data: CandidateDataPackage;
}

export interface BatchPromptContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  batchNumber: number;
  totalBatches: number;
  survivorsNeeded: number;
  tentativeTime?: string;
}

export interface DeepAnalysisContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  spouseData: unknown;
}

export interface FinalPrecisionContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  spouseData: unknown;
  currentTransits?: unknown;
}

export interface FinalVerdict {
  time: string;
  accuracy: number;
  confidence: number | string;
  margin: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// PRECISION BTR ENHANCEMENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type ConfidenceLevel = 'GOD_TIER' | 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EventSource = 'document' | 'memory' | 'approximate' | 'calculated';

export type TatwaType = 'prithvi' | 'jala' | 'agni' | 'vayu' | 'akasha';

export type DoshaType = 'vata' | 'pitta' | 'kapha';

export interface TimeWindow {
  baseTime: Date;
  rangeMinutes: number;
  stepSeconds: number;
}

export interface ScanConfiguration {
  maxCandidates: number;
  minConsensusScore: number;
  parallelProcessing: boolean;
  cacheEphemeris: boolean;
  eventWeightThreshold: number;
}

export interface EventConfidence {
  level: 'high' | 'medium' | 'low';
  source: EventSource;
  datePrecision: DatePrecision;
  weight: number;
  reliabilityScore: number;
}

export interface BtrEvent {
  id: string;
  type: string;
  category: string;
  eventDate: Date;
  datePrecision: DatePrecision;
  description: string;
  impact: 'critical' | 'major' | 'moderate' | 'minor';
  confidence: EventConfidence;
  eventHouse: number;
  significators: string[];
}

export interface MethodScores {
  vimshottari: number;
  yogini: number;
  chara: number;
  kalachakra: number;
  kp: number;
  varga: number;
  transit: number;
  boundary: number;
  tatwa: number;
  shadbala: number;
  nadi: number;
  spouseD9: number;
}

export interface EventMatchResult {
  eventId: string;
  eventType: string;
  expectedHouse: number;
  dashaLord: string;
  significatorMatch: boolean;
  houseMatch: boolean;
  kpMatch: boolean;
  vargaMatch: boolean;
  score: number;
  details: string;
}

export interface TransitMatchResult {
  eventId: string;
  eventDate: Date;
  eventHouse: number;
  saturnAspect: boolean;
  jupiterAspect: boolean;
  rahuInfluence: boolean;
  doubleTransit: boolean;
  score: number;
  details: string;
}

export interface TatwaResult {
  tatwa: TatwaType;
  element: string;
  startTime: Date;
  endTime: Date;
  cycleNumber: number;
  matchesKnownTatwa: boolean;
  correctionMinutes: number;
  correctedWindows: TatwaWindow[];
}

export interface TatwaWindow {
  startTime: Date;
  endTime: Date;
  tatwa: TatwaType;
  confidence: number;
}

export interface BoundaryAnalysis {
  lagnaSignBoundary: number;
  moonNakshatraBoundary: number;
  moonNavamshaBoundary: number;
  d60ChangeWindow: number;
  isCriticalZone: boolean;
  dangerLevel: 'safe' | 'caution' | 'critical';
  details: string;
}

export interface ScanResult {
  success: boolean;
  candidates: CandidateScore[];
  bestCandidate: CandidateScore | null;
  totalScanned: number;
  scanDurationMs: number;
  recommendations: string[];
  errors: string[];
}


export interface RectificationResult {
  rectifiedTime: string;
  rectifiedDate: Date;
  confidenceLevel: ConfidenceLevel;
  confidencePercentage: number;
  marginOfErrorSeconds: number;
  methodConsensus: MethodScores;
  evidence: {
    primary: string[];
    secondary: string[];
    warnings: string[];
  };
  candidateAnalysis: CandidateScore[];
  recommendations: string[];
  processingTimeMs: number;
}

export const DEFAULT_SCAN_CONFIG: ScanConfiguration = {
  maxCandidates: 100,
  minConsensusScore: 50,
  parallelProcessing: true,
  cacheEphemeris: true,
  eventWeightThreshold: 0.3
};

export const EVENT_WEIGHTS = {
  high: { weight: 3.0, reliabilityBase: 0.95 },
  medium: { weight: 1.5, reliabilityBase: 0.70 },
  low: { weight: 0.5, reliabilityBase: 0.40 }
} as const;

export const DATE_PRECISION_MULTIPLIERS = {
  exact_date_time: 1.0,
  exact_date: 0.95,
  date_range: 0.75,
  month_year: 0.8,
  month_range: 0.65,
  year_range: 0.5
} as const;

export const SOURCE_MULTIPLIERS = {
  document: 1.3,
  memory: 1.0,
  approximate: 0.7,
  calculated: 0.9
} as const;

export const TATWA_DURATIONS_MINUTES = 26;

export const TATWA_ELEMENTS: Record<TatwaType, string> = {
  prithvi: 'Earth',
  jala: 'Water',
  agni: 'Fire',
  vayu: 'Air',
  akasha: 'Ether'
};

export const TATWA_DOSHA_MAP: Record<TatwaType, DoshaType[]> = {
  prithvi: ['kapha'],
  jala: ['kapha', 'pitta'],
  agni: ['pitta'],
  vayu: ['vata'],
  akasha: ['vata', 'kapha']
};

export const EVENT_HOUSE_MAP: Record<string, number> = {
  marriage: 7,
  career: 10,
  education: 4,
  children: 5,
  health: 6,
  financial: 2,
  finance: 2,
  travel: 9,
  property: 4,
  spiritual: 9,
  legal: 6,
  family: 2,
  relocation: 3,
  accident: 8,
  death_relative: 8,
  public_life: 10,
  karmic_events: 8,
  identity_shifts: 1,
  promotion: 10,
  business: 7,
  divorce: 7,
  surgery: 6,
  inheritance: 8,
  awards: 11,
  other: 1,
  // Missing categories now mapped
  sanskars: 1,        // Life rituals → Ascendant/self
  childhood: 4,       // Early milestones → Education/learning
  adolescent: 4,      // Teen years → Education
  teen: 4,
  btr_markers: 1,
};

export const EVENT_SIGNIFICATORS: Record<string, string[]> = {
  marriage: ['Venus', 'Jupiter', 'Moon', '7th Lord'],
  career: ['Saturn', 'Sun', 'Jupiter', 'Mercury', '10th Lord'],
  education: ['Mercury', 'Jupiter', 'Moon', '4th Lord'],
  children: ['Jupiter', 'Venus', 'Moon', '5th Lord'],
  health: ['Sun', 'Moon', 'Mars', 'Saturn', '6th Lord'],
  financial: ['Jupiter', 'Venus', 'Mercury', '2nd Lord'],
  finance: ['Jupiter', 'Venus', 'Mercury', '2nd Lord'],
  travel: ['Moon', 'Rahu', 'Ketu', '9th Lord', '12th Lord'],
  property: ['Mars', 'Saturn', 'Venus', '4th Lord'],
  spiritual: ['Jupiter', 'Ketu', 'Saturn', '9th Lord'],
  legal: ['Mars', 'Jupiter', 'Saturn', '6th Lord'],
  family: ['Moon', 'Jupiter', 'Venus', '2nd Lord'],
  relocation: ['Moon', 'Rahu', '3rd Lord', '9th Lord'],
  accident: ['Mars', 'Saturn', 'Rahu', '8th Lord'],
  death_relative: ['Saturn', 'Rahu', 'Ketu', '8th Lord'],
  public_life: ['Sun', 'Jupiter', 'Mercury', '10th Lord', '11th Lord'],
  karmic_events: ['Saturn', 'Ketu', '8th Lord', '12th Lord'],
  identity_shifts: ['Sun', 'Moon', '1st Lord'],
  promotion: ['Sun', 'Jupiter', 'Mercury', '10th Lord'],
  business: ['Mercury', 'Venus', '7th Lord'],
  divorce: ['Mars', 'Rahu', 'Saturn', '6th Lord', '7th Lord'],
  surgery: ['Mars', 'Rahu', 'Saturn', '6th Lord', '8th Lord'],
  inheritance: ['Jupiter', 'Saturn', '8th Lord'],
  awards: ['Jupiter', 'Venus', 'Sun', '11th Lord'],
  other: [],
  // Missing categories now mapped
  sanskars: ['Moon', 'Jupiter', 'Sun', '1st Lord'],
  childhood: ['Moon', 'Mercury', 'Jupiter', '4th Lord'],
  adolescent: ['Mercury', 'Mars', 'Venus', '4th Lord', '9th Lord'],
  teen: ['Mercury', 'Mars', 'Venus', '4th Lord', '9th Lord'],
  btr_markers: ['Moon', 'Saturn', 'Jupiter', 'Ketu', '1st Lord'],
};

// ═════════════════════════════════════════════════════════════════════════════
// PER-EVENT SPECIFIC SIGNIFICATORS (overrides category-level for precision)
// When an event ID matches, these planets take priority over the category map
// ═════════════════════════════════════════════════════════════════════════════
export const EVENT_SPECIFIC_SIGNIFICATORS: Record<string, string[]> = {
  // Marriage — different stages = different planets
  marriage: ['Venus', 'Jupiter', 'Moon', '7th Lord'],
  engagement: ['Venus', 'Mercury', '7th Lord'],
  suhaag_raat: ['Venus', 'Moon', '7th Lord'],
  first_meeting_spouse: ['Venus', 'Rahu', '7th Lord'],
  divorce: ['Mars', 'Rahu', 'Saturn', '6th Lord'],
  separation: ['Saturn', 'Rahu', '6th Lord'],
  second_marriage: ['Venus', 'Jupiter', '8th Lord'],

  // Career — specific job types
  first_job: ['Saturn', 'Sun', 'Mercury', '10th Lord'],
  government_job: ['Sun', 'Saturn', '10th Lord'],
  job_promotion: ['Jupiter', 'Sun', 'Mercury', '10th Lord'],
  job_loss: ['Mars', 'Saturn', 'Rahu', '10th Lord'],
  job_change: ['Mercury', 'Rahu', '3rd Lord'],
  business_started: ['Mercury', 'Sun', 'Mars', '7th Lord', '10th Lord'],
  business_loss: ['Saturn', 'Mars', 'Rahu', '7th Lord'],
  freelancing_start: ['Mercury', 'Rahu', '3rd Lord'],
  retirement: ['Saturn', 'Jupiter', '12th Lord'],

  // Education
  graduation_complete: ['Jupiter', 'Mercury', '4th Lord', '9th Lord'],
  board_10th: ['Mercury', 'Jupiter', '4th Lord'],
  board_12th: ['Mercury', 'Jupiter', '9th Lord'],
  study_abroad: ['Rahu', 'Jupiter', '9th Lord', '12th Lord'],
  competitive_exam: ['Mars', 'Mercury', 'Jupiter', '6th Lord'],

  // Health
  surgery: ['Mars', 'Rahu', 'Saturn', '6th Lord', '8th Lord'],
  childhood_illness: ['Moon', 'Mars', '6th Lord'],
  accident: ['Mars', 'Saturn', 'Rahu', '8th Lord'],
  childhood_accident: ['Mars', 'Rahu', '8th Lord'],

  // Children
  first_child_birth: ['Jupiter', 'Venus', 'Moon', '5th Lord'],
  second_child_birth: ['Jupiter', 'Venus', '5th Lord'],
  menarche: ['Moon', 'Venus', 'Mars', '6th Lord'],

  // Financial
  first_income: ['Saturn', 'Sun', '2nd Lord'],
  sudden_wealth: ['Jupiter', 'Rahu', '5th Lord', '11th Lord'],
  inheritance: ['Jupiter', 'Saturn', '8th Lord'],

  // Travel/Relocation
  work_abroad: ['Rahu', 'Saturn', '9th Lord', '12th Lord'],
  first_foreign_travel: ['Rahu', 'Ketu', '9th Lord', '12th Lord'],
  relocation: ['Moon', 'Rahu', 'Mars', '3rd Lord', '4th Lord'],

  // Spiritual / Sanskars
  upanayana: ['Jupiter', 'Sun', 'Mercury', '1st Lord'],
  vivaha: ['Venus', 'Jupiter', 'Moon', '7th Lord'],
  sanyasa: ['Saturn', 'Ketu', 'Jupiter', '12th Lord'],
  namkaran: ['Moon', 'Mercury', '1st Lord'],
  mundan: ['Mars', 'Saturn', '1st Lord', '8th Lord'],
  annaprashan: ['Moon', 'Jupiter', '2nd Lord'],

  // Relationship
  first_love: ['Venus', 'Moon', '5th Lord'],
  first_heartbreak: ['Venus', 'Rahu', '5th Lord'],
  live_in_start: ['Venus', 'Mars', '3rd Lord'],

  // Identity
  name_change: ['Mercury', 'Sun', '1st Lord'],
  identity_shifts: ['Sun', 'Moon', 'Rahu', '1st Lord'],

  // Special BTR-grade events
  dasha_change: ['Moon', 'Saturn'],
  jupiter_return: ['Jupiter'],
  saturn_return: ['Saturn'],
  sade_sati_start: ['Saturn', 'Moon'],
  near_death: ['Mars', 'Saturn', 'Ketu', '8th Lord'],
  spiritual_awakening: ['Ketu', 'Jupiter', '9th Lord', '12th Lord'],
  sudden_opportunity: ['Rahu', 'Jupiter', '5th Lord', '9th Lord'],
  legal_victory: ['Jupiter', 'Mars', 'Sun', '6th Lord'],
  legal_defeat: ['Saturn', 'Mars', 'Rahu', '6th Lord'],
};

// ═════════════════════════════════════════════════════════════════════════════
// DATE PRECISION WEIGHTS — How much an event contributes based on how accurate the date is
// exact_date_time = 1.0 (full weight), year_range = 0.1 (10% weight)
// ═════════════════════════════════════════════════════════════════════════════
export const DATE_PRECISION_WEIGHTS: Record<string, number> = {
  exact_date_time: 1.0,
  exact_date: 0.9,
  date_range: 0.7,
  month_year: 0.5,
  month_range: 0.3,
  year_range: 0.1,
};

export const PARASHARI_ASPECTS: Record<string, number[]> = {
  sun: [7],
  moon: [7],
  mars: [4, 7, 8],
  mercury: [7],
  jupiter: [5, 7, 9],
  venus: [7],
  saturn: [3, 7, 10],
  rahu: [5, 7, 9],
  ketu: [5, 7, 9]
};

// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS (for types without corresponding interfaces)
// ═════════════════════════════════════════════════════════════════════════════

export function validateCandidateDataForAI(pkg: unknown) {
    return CandidateDataPackageSchema.parse(pkg);
}