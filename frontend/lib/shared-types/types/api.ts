/**
 * 🔱 AI-Pandit API / Stream Types
 * ==========================================
 * Queue, job management, progress tracking, SSE session events,
 * AI client interaction, and calculate request/response types.
 */

import { z } from 'zod';
import {
  LifeEvent,
  LifeEventSchema,
  BirthData,
  BirthDataSchema,
  OffsetConfigSchema,
  TimeOffsetConfig,
} from './core.js';

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type QueueStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';

export interface QueuePosition {
  sessionId: string;
  status: QueueStatus;
  position: number;
  estimatedWaitSeconds: number;
  totalInQueue: number;
  createdAt: string;
  session?: Record<string, unknown>;
}

export interface QueueSubmitResult {
  success: boolean;
  sessionId?: string;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
  errorCode?: 'QUEUE_FULL' | 'RATE_LIMIT_EXCEEDED';
  retryAfterSeconds?: number;
}

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'failed'
  | 'completed'
  | 'cancelled';

export const JobStatusSchema = z.enum([
    'queued',
    'running',
    'retrying',
    'failed',
    'completed',
    'cancelled',
]);

export type JobKind = 'btr_rectification';

export const JobKindSchema = z.enum(['btr_rectification']);

export interface JobSummary {
  id: string;
  sessionId: string;
  userId: string;
  kind: JobKind;
  status: JobStatus;
  currentStage?: string | null;
  progressPercent: number;
  attempt: number;
  maxAttempts: number;
  retryCount: number;
  retryReasonCode?: string | null;
  nextRetryAt?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  finishedAt?: string | null;
  cancelRequestedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const JobSummarySchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    kind: JobKindSchema,
    status: JobStatusSchema,
    currentStage: z.string().nullable().optional(),
    progressPercent: z.number().int().min(0).max(100),
    attempt: z.number().int().min(0),
    maxAttempts: z.number().int().min(1),
    retryCount: z.number().int().min(0),
    retryReasonCode: z.string().nullable().optional(),
    nextRetryAt: z.string().datetime().nullable().optional(),
    queuedAt: z.string().datetime(),
    startedAt: z.string().datetime().nullable().optional(),
    heartbeatAt: z.string().datetime().nullable().optional(),
    finishedAt: z.string().datetime().nullable().optional(),
    cancelRequestedAt: z.string().datetime().nullable().optional(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export interface JobDetail extends JobSummary {
  version: number;
  result?: Record<string, unknown> | null;
  checkpoint?: Record<string, unknown> | null;
  cursor?: Record<string, unknown> | null;
  sessionStatus?: string | null;
}

export const JobDetailSchema = JobSummarySchema.extend({
    version: z.number().int().min(0),
    result: z.record(z.unknown()).nullable().optional(),
    checkpoint: z.record(z.unknown()).nullable().optional(),
    cursor: z.record(z.unknown()).nullable().optional(),
    sessionStatus: z.string().nullable().optional(),
});

export interface JobEventRecord {
  id: string;
  jobId: string;
  sessionId: string;
  sequenceNo: number;
  eventType: string;
  stage?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const JobEventRecordSchema = z.object({
    id: z.string().min(1),
    jobId: z.string().min(1),
    sessionId: z.string().min(1),
    sequenceNo: z.number().int().min(0),
    eventType: z.string().min(1),
    stage: z.string().nullable().optional(),
    payload: z.record(z.unknown()),
    createdAt: z.string().datetime(),
});

export interface JobEventsResponse {
  jobId: string;
  sessionId: string;
  since: number;
  events: JobEventRecord[];
}

export const JobEventsResponseSchema = z.object({
    jobId: z.string().min(1),
    sessionId: z.string().min(1),
    since: z.number().int().min(0),
    events: z.array(JobEventRecordSchema),
});

export interface JobSyncResponse {
  job: JobDetail;
  since: number;
  latestSequenceNo: number;
  events: JobEventRecord[];
  recommendedPollIntervalMs: number;
  replayMode: 'incremental' | 'snapshot';
}

export const JobSyncResponseSchema = z.object({
    job: JobDetailSchema,
    since: z.number().int().min(0),
    latestSequenceNo: z.number().int().min(0),
    events: z.array(JobEventRecordSchema),
    recommendedPollIntervalMs: z.number().int().positive(),
    replayMode: z.enum(['incremental', 'snapshot']),
});

export interface DeadLetterArtifactSummary {
  id: string;
  jobId: string;
  sessionId?: string | null;
  uri: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export const DeadLetterArtifactSummarySchema = z.object({
    id: z.string().min(1),
    jobId: z.string().min(1),
    sessionId: z.string().nullable().optional(),
    uri: z.string().min(1),
    createdAt: z.string().datetime(),
    metadata: z.record(z.unknown()).nullable(),
});

export interface CreateJobResponse {
  job: JobDetail;
  idempotentReplay: boolean;
}

export const CreateJobResponseSchema = z.object({
    job: JobDetailSchema,
    idempotentReplay: z.boolean(),
});

export interface CancelJobResponse {
  job: JobDetail;
  cancelled: boolean;
}

export const CancelJobResponseSchema = z.object({
    job: JobDetailSchema,
    cancelled: z.boolean(),
});

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ProgressStep {
  id: string;
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message?: string;
  details?: string[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * AI thinking data for streaming
 */
export interface AIThinkingData {
  stage: number;
  candidateTime?: string;
  chunks: string[];
  fullText: string;
}

export interface AIContextData {
  stage: number;
  candidateTime: string;
  planetaryInfo: {
    ascendant: string;
    sun: string;
    moon: string;
  };
  dasha: string;
  divCharts?: string;
  groundTruth?: Record<string, unknown>;
}

export interface CandidateScore {
  time: string | Date;
  score?: number;
  stage?: number;
  rank?: number;
  batch?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>;
  reason?: string; // AI's one-line astrological verdict per batch

  // Advanced God-Tier Properties
  timeString?: string;
  overallScore?: number;
  confidenceLevel?: 'GOD_TIER' | 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  marginOfErrorSeconds?: number;
  methodScores?: Record<string, number>;
  eventMatches?: Array<Record<string, unknown>>;
  transitMatches?: Array<Record<string, unknown>>;
  redFlags?: string[];
  keyEvidence?: string[];
}

export interface ProgressData {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: ProgressStep[];
  lastUpdate: string;
  liveMessage?: string;
  startedAt?: string;
  candidateScores: CandidateScore[];
  lastAIThinking?: AIThinkingData;
  aiContext?: AIContextData;
  stageHistory?: Record<number, string>;
  calculationLogs?: Array<{ candidateTime: string; log: string }>;
  estimatedTimeRemaining?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION EVENT TYPES (SSE)
// ═════════════════════════════════════════════════════════════════════════════

export interface ProgressEvent {
  type: 'progress';
  step: string;
  stepIndex: number;
  totalSteps: number;
  percentage: number;
  message: string;
  details?: string[];
  startedAt?: string;
}

export interface AIThinkingEvent {
  type: 'ai_thinking';
  chunk: string;
  stage: number;
  candidateTime?: string;
}

export interface EphemerisEvent {
  type: 'ephemeris';
  candidateTime: string;
  ascendant: { sign: string; degree: number };
  moonSign: string;
  moonNakshatra: string;
}

export interface CandidateScoreEvent {
  type: 'candidate_score' | 'candidate_score_v2';
  time: string;
  score: number;
  stage: number;
  batch?: number;
  rank?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>;
  reason?: string; // AI's one-line astrological verdict per batch
}

export interface CandidateScoresEvent {
  type: 'candidate_scores';
  data: CandidateScoreEvent[];
}

export interface CompleteEvent {
  type: 'complete';
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
}

export interface AIContextEvent {
  type: 'ai_context';
  stage: number;
  candidateTime: string;
  planetaryInfo?: {
    sun: string;
    moon: string;
    ascendant: string;
  };
  dasha?: string;
  divCharts?: string;
  contextHits?: string[];
  round?: number;
  batch?: number;
  totalBatches?: number;
  candidatesInBatch?: number | Array<{
    time: string;
    ascendant?: string;
    moon?: string;
  }>;
  lifeEventsCount?: number;
}

export interface DecisionEvent {
  type: 'decision';
  stage: number;
  time: string;
  verdict: 'promoted' | 'rejected';
  score: number;
  reason: string;
  batch?: number;
}

export interface CalculationLogEvent {
  type: 'calculation_log';
  logId: string;
  candidateTime: string;
  sunPos: string;
  moonPos: string;
  ascendant: string;
  dashaObj?: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  stage?: string;
}

export interface StageStatsEvent {
  type: 'stage_stats';
  stage: number;
  candidateCount: number;
  description: string;
}

export interface EstimatedTimeEvent {
  type: 'estimated_time';
  seconds: number;
}

/**
 * Emitted after each batch's AI call completes in stages 2, 4, 6.
 * Contains the final AI conclusion text for that batch — persisted to DB.
 */
export interface BatchConclusionEvent {
  type: 'batch_conclusion';
  stage: number;
  round: number;
  batch: number;
  totalBatches: number;
  /** The final merged AI response (thinking + content) for this batch */
  conclusion: string;
  candidatesInBatch: number;
  survivorsCount: number;
}

/**
 * Emitted when an AI stage (2, 4, 6) completes all rounds.
 * Contains the accumulated reasoning and stage summary — persisted to DB.
 */
export interface StageConclusionEvent {
  type: 'stage_conclusion';
  stage: number;
  stageName: string;
  candidatesIn: number;
  candidatesOut: number;
  /** Accumulated AI reasoning across all rounds/batches for this stage */
  conclusion: string;
  topCandidateTimes: string[];
}

/**
 * Union type of all session events
 */
export type SessionEvent =
  | ProgressEvent
  | AIThinkingEvent
  | EphemerisEvent
  | CandidateScoreEvent
  | CandidateScoresEvent
  | CompleteEvent
  | ErrorEvent
  | AIContextEvent
  | CalculationLogEvent
  | StageStatsEvent
  | EstimatedTimeEvent
  | DecisionEvent
  | BatchConclusionEvent
  | StageConclusionEvent;

// ═════════════════════════════════════════════════════════════════════════════
// AI CLIENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  thinking?: string;
  content: string;
  tokensUsed?: number;
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// API / REQUEST TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface CalculateRequest {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  offsetConfig: TimeOffsetConfig;
}

export const CalculateRequestSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema)
        .min(3, "At least 3 life events are required")
        .max(100, "Maximum 100 life events allowed"),
    offsetConfig: OffsetConfigSchema,
});

export interface CalculateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    position: number;
    estimatedWaitSeconds: number;
    status: string;
  };
  error?: string;
}
