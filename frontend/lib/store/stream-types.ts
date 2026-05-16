import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';

export interface StreamProgress {
    step: string;
    stepIndex: number;
    totalSteps: number;
    percentage: number;
    message: string;
    details?: string[];
    calculationLogs?: Array<Record<string, unknown>>; // For LiveCalculationPanel
}

export interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks: string[];
    fullText: string;
    updatedAt?: number; // Higher-precision sorting and live tracking
    startedAt?: number; // Tracks when reasoning started for the timer
}

export interface AIThinkingEventData {
    chunk: string;
    stage: number;
    candidateTime?: string;
}

export interface PollingProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    liveMessage?: string;
    message?: string;
    steps?: Array<{
        id: string;
        name: string;
        details?: string[];
    }>;
    candidateScores?: CandidateScore[];
    startedAt?: string;
    estimatedTimeRemaining?: number;
}

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo?: { sun: string; moon: string; ascendant: string };
    dasha?: string;
    divCharts?: string;
    candidatesInBatch?: number | Array<{
        time: string;
        ascendant?: string;
        moon?: string;
    }>;
    lifeEventsCount?: number;
    batch?: number;
    totalBatches?: number;
}

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    batch?: number;
    offsetMinutes?: number;
    minifiedEph?: { sun: string; moon: string; ascendant: string };
    fullEph?: Record<string, string>;
    reason?: string; // AI's one-line astrological verdict per batch
}

export interface StageStat {
    stage: number;
    candidateCount: number;
    description: string;
}

export interface AnalysisDecision {
    stage: number;
    time: string;
    verdict: 'promoted' | 'rejected';
    score: number;
    reason: string;
    batch?: number;
}

export interface StreamResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
}

export interface StreamMetadata {
    fullName?: string;
    dateOfBirth?: string;
    tentativeTime?: string;
    birthPlace?: string;
    timezone?: string;
    status?: string;
    errorMessage?: string;
    lifeEvents?: unknown[];
    offsetConfig?: { preset: string; customMinutes?: number; minutes?: number };
    aiModel?: string;
    updatedAt?: string;
}

export interface StreamStep {
    id: string;
    name: string;
    icon?: string;
}

/**
 * 🔱 TIERED LOADING: On-demand data for an expanded candidate card
 * Only ONE candidate's heavy data is in memory at any time.
 */
export interface ExpandedCandidateData {
    time: string;
    stage: number;
    fullEph?: Record<string, string>;
    reasoning?: string;
    loading: boolean;
    error?: string;
}

export interface BatchConclusion {
    stage: number;
    round: number;
    batch: number;
    totalBatches: number;
    conclusion: string;
    candidatesInBatch: number;
    survivorsCount: number;
    receivedAt: number;
}

export interface StageConclusion {
    stage: number;
    stageName: string;
    candidatesIn: number;
    candidatesOut: number;
    conclusion: string;
    topCandidateTimes: string[];
    receivedAt: number;
}

export interface StreamState {
    sessionId: string | null;
    isComplete: boolean;
    error: string | null;
    progress: StreamProgress | null;
    aiContext: AIContextData | null;
    candidateScores: CandidateScore[];
    stageStats: StageStat[];
    result: StreamResult | null;
    metadata?: StreamMetadata;
    candidatesByStage: Record<number, Record<string, AIThinking>>;
    displayedCandidate: string | null;
    persistentCandidates: Array<Record<string, unknown>>;
    stageHistory: Record<number, string>;
    analyzedCount: number;
    totalCandidates: number;
    startedAt?: string;
    estimatedTimeRemaining?: number;
    activeAIStage: number | null;
    allSteps: StreamStep[];
    advancedSignals: IAdvancedSignals | null;
    decisions: AnalysisDecision[];
    lastEventId: number;
    /** 🔱 TIERED LOADING: Currently expanded candidate's heavy data */
    expandedCandidate: ExpandedCandidateData | null;
    /** Persisted batch conclusions (one per batch in stages 2, 4, 6) */
    batchConclusions: BatchConclusion[];
    /** Persisted stage conclusions (one per AI stage 2, 4, 6) */
    stageConclusions: StageConclusion[];
}
