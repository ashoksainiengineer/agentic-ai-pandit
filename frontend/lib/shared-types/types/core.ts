/**
 * 🔱 AI-Pandit Core Domain Types
 * ==========================================
 * Fundamental types: birth data, life events, time offsets,
 * session/archive types, and event constants.
 */

import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS (Zod schema utilities)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string to prevent XSS (Internal helper for schemas)
 */
const sanitizeString = (val: string) => {
    return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

const YEAR_PATTERN = /^\d{4}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function isDayLike(value: string): boolean {
    return DATE_PATTERN.test(value);
}

function isMonthLike(value: string): boolean {
    return MONTH_PATTERN.test(value) || DATE_PATTERN.test(value);
}

function isYearLike(value: string): boolean {
    return YEAR_PATTERN.test(value) || MONTH_PATTERN.test(value) || DATE_PATTERN.test(value);
}

function toPrecisionKey(value: string, precision: 'day' | 'month' | 'year'): string | null {
    if (precision === 'day' && isDayLike(value)) return value;
    if (precision === 'month' && isMonthLike(value)) return isDayLike(value) ? value.slice(0, 7) : value;
    if (precision === 'year' && isYearLike(value)) return value.slice(0, 4);
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// CORE ENUM / STRING UNION TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type Gender = 'male' | 'female' | 'other';

export type EventCategory =
  | 'education'
  | 'career'
  | 'marriage'
  | 'children'
  | 'family'
  | 'health'
  | 'financial'
  | 'finance'
  | 'travel'
  | 'spiritual'
  | 'legal'
  | 'public_life'
  | 'karmic_events'
  | 'identity_shifts'
  | 'promotion'
  | 'business'
  | 'property'
  | 'relocation'
  | 'accident'
  | 'death_relative'
  | 'divorce'
  | 'surgery'
  | 'inheritance'
  | 'awards'
  | 'sanskars'
  | 'childhood'
  | 'adolescent'
  | 'teen'
  | 'btr_markers'
  | 'other';

export type DatePrecision =
  | 'exact_date_time'
  | 'exact_date'
  | 'date_range'
  | 'month_year'
  | 'month_range'
  | 'year_range';

export type EventImportance = 'low' | 'medium' | 'high' | 'critical';

export type SessionStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'cancelled';

// ═════════════════════════════════════════════════════════════════════════════
// BIRTH DATA TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Core birth data for rectification
 */
export interface BirthData {
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: Gender;
}

export const BirthDataSchema = z.object({
    fullName: z.string()
        .min(1, "Full name is required")
        .max(100, "Name must be less than 100 characters")
        .transform(sanitizeString),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD required)"),
    tentativeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Invalid time format (HH:MM:SS required)"),
    birthPlace: z.string()
        .min(1, "Birth place is required")
        .max(200, "Birth place must be less than 200 characters")
        .transform(sanitizeString),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.number().min(-12).max(14),
    gender: z.enum(['male', 'female', 'other']),
});


// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Life event for rectification
 */
export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  datePrecision: DatePrecision;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  description: string;
  importance: EventImportance;
  icon?: string;
  ageAtEvent?: number;
  impact?: string;
  type?: string;
  yearOffset?: number;
  color?: string;
}

export const LifeEventSchema = z.object({
    id: z.string()
        .regex(
            /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|evt_[A-Za-z0-9_-]+|custom_[A-Za-z0-9_-]+|[A-Za-z0-9_-]{1,128})$/i,
            'Invalid event id format'
        )
        .optional(),
    eventType: z.string()
        .min(1, "Event type is required")
        .max(100, "Event type must be less than 100 characters")
        .transform(sanitizeString),
    // BUG-FIX: Added missing categories that TypeScript type already includes
    category: z.enum(['education', 'career', 'marriage', 'children', 'family', 'health', 'financial', 'finance', 'travel', 'spiritual', 'legal', 'public_life', 'karmic_events', 'identity_shifts', 'promotion', 'business', 'property', 'relocation', 'accident', 'death_relative', 'divorce', 'surgery', 'inheritance', 'awards', 'sanskars', 'childhood', 'adolescent', 'teen', 'btr_markers', 'other']),
    eventDate: z.string().min(1, "Event date is required"),
    eventTime: z.string().regex(TIME_PATTERN, "Invalid time format (HH:MM or HH:MM:SS required)").optional().nullable(),
    endDate: z.string().optional().nullable(),
    datePrecision: z.enum(['exact_date_time', 'exact_date', 'month_year', 'month_range', 'year_range', 'date_range']),
    description: z.string()
        .max(2000, "Description must be less than 2000 characters")
        .transform(sanitizeString)
        .optional()
        .nullable(),
    importance: z.enum(['high', 'medium', 'low', 'critical']).default('medium'),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}).passthrough().superRefine((event, ctx) => {
    const endDate = event.endDate ?? undefined;

    switch (event.datePrecision) {
        case 'exact_date':
        case 'exact_date_time': {
            if (!isDayLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid date format (YYYY-MM-DD required for exact date)',
                });
            }
            if (event.datePrecision === 'exact_date_time' && !event.eventTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventTime'],
                    message: 'eventTime is required when datePrecision is exact_date_time',
                });
            }
            break;
        }

        case 'date_range': {
            if (!isDayLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid date range start (YYYY-MM-DD required)',
                });
            }
            if (endDate && !isDayLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid date range end (YYYY-MM-DD required)',
                });
            }
            break;
        }

        case 'month_year': {
            if (!isMonthLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid month-year format (YYYY-MM expected)',
                });
            }
            break;
        }

        case 'month_range': {
            if (!isMonthLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid month range start (YYYY-MM expected)',
                });
            }
            if (endDate && !isMonthLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid month range end (YYYY-MM expected)',
                });
            }
            break;
        }

        case 'year_range': {
            if (!isYearLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid year range start (YYYY expected)',
                });
            }
            if (endDate && !isYearLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid year range end (YYYY expected)',
                });
            }
            break;
        }

        default:
            break;
    }

    if (endDate) {
        const precisionKey = event.datePrecision === 'year_range'
            ? 'year'
            : (event.datePrecision === 'month_range' ? 'month' : 'day');
        const startKey = toPrecisionKey(event.eventDate, precisionKey);
        const endKey = toPrecisionKey(endDate, precisionKey);
        if (startKey && endKey && endKey < startKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['endDate'],
                message: 'endDate must be on or after eventDate',
            });
        }
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// TIME OFFSET TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type OffsetPreset =
  | 'seconds-6'
  | 'seconds-30'
  | '30min'
  | '1hour'
  | '2hours'
  | '4hours'
  | '6hours'
  | '12hours'
  | 'custom';

export interface TimeOffsetConfig {
  preset: OffsetPreset;
  customMinutes?: number;
  description: string;
}

export const OffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string(),
});

export interface CandidateTime {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  candidateDate?: string;
  dayOffset?: number;
  candidateKey?: string;
  rank?: number;
  batchIndex?: number;
  priority?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION / DATABASE TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface RectificationSession {
  id: string;
  userId: string;
  externalId: string;
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  gender?: string;
  lifeEvents: LifeEvent[];
  offsetConfig?: TimeOffsetConfig;
  rectifiedTime?: string;
  accuracy?: number;
  confidence?: string;
  analysisResult?: unknown;
  progressData?: string;
  status: SessionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MasterAnalysisArchive {
  version: string;
  sessionId: string;
  generatedAt: string;
  birthContext: {
    name: string;
    originalTime: string;
    location: string;
    offsetScan: string;
  };
  finalResult: {
    time: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    methodsUsed: string[];
  };
  reasoning: {
    discovery: string;
    refinement: string;
    precision: string;
    summary: string;
  };
  technicalProof: {
    ephemeris: import('./ephemeris.js').EphemerisData;
    boundarySafety: {
      nakshatra: { distance: number; warning?: string };
      lagna: { distance: number; warning?: string };
      dasha: { distance: number; warning?: string };
    };
    methodologyBreakdown: {
      [key: string]: { score: number; verdict: string; details?: string };
    };
    contextualCorrelation?: number;
  };
  alternatives: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENT CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Event types by category
 */
export const EVENT_TYPES: Record<EventCategory, string[]> = {
  education: ['School admission', 'College admission', 'Graduation', 'Higher studies'],
  career: ['Job start', 'Job change', 'Promotion', 'Business start'],
  marriage: ['Engagement', 'Wedding', 'Divorce'],
  children: ['Pregnancy', 'Birth', 'Adoption'],
  family: ['Parent death', 'Sibling birth', 'Family event'],
  health: ['Major illness', 'Surgery', 'Recovery', 'Accident'],
  financial: ['Money gain', 'Property purchase', 'Business deal'],
  finance: ['Money gain', 'Property purchase', 'Business deal'],
  travel: ['Long journey', 'Relocation', 'International travel'],
  spiritual: ['Spiritual awakening', 'Meditation retreat', 'Religious event'],
  legal: ['Court case started', 'Legal win', 'Court verdict'],
  public_life: ['Award', 'Fame spike', 'Public recognition'],
  karmic_events: ['Sudden windfall', 'Natural disaster', 'Pet loss'],
  identity_shifts: ['Weight transform', 'Nickname change', 'Appearance shift'],
  promotion: ['Promotion', 'Role expansion', 'Recognition'],
  business: ['Business launch', 'Partnership', 'Major deal'],
  property: ['Property purchase', 'House move', 'Land acquisition'],
  relocation: ['City move', 'Country move', 'Permanent relocation'],
  accident: ['Accident', 'Emergency injury', 'Near-miss'],
  death_relative: ['Parent death', 'Relative death', 'Family bereavement'],
  divorce: ['Separation', 'Divorce filing', 'Divorce finalization'],
  surgery: ['Surgery', 'Procedure', 'Hospital admission'],
  inheritance: ['Inheritance received', 'Estate settlement', 'Will dispute'],
  awards: ['Award', 'Prize', 'Public recognition'],
  sanskars: ['Mundan', 'Upanayan', 'Namkaran', 'Annaprashan'],
  childhood: ['First steps', 'First words', 'School start', 'Milestone event'],
  adolescent: ['Coming of age', 'Identity shift', 'Peer milestone'],
  teen: ['Teen achievement', 'Teen struggle', 'Coming of age'],
  btr_markers: ['Birth time verification', 'Rectification marker'],
  other: ['Custom event'],
};
