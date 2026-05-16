export interface PlanetaryInfo {
    sun: string;
    moon: string;
    ascendant: string;
}

export interface AIThinking {
    stage: number;
    candidateTime?: string;
    chunks?: string[];
    fullText: string;
    updatedAt?: number;
    startedAt?: number;
}

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    offsetMinutes?: number;
    minifiedEph?: PlanetaryInfo;
}

export interface UnifiedAIPanelProps {
    thinking: AIThinking | null;
    stageHistory?: Record<number, string>;
    isActive: boolean;
    stage?: number;
    allCandidates?: Record<string, AIThinking>;
    displayedCandidate?: string | null;
    onSelectCandidate?: (time: string) => void;
    candidateScores?: CandidateScore[];
    unifiedMode?: boolean;
    isComplete?: boolean;
    title?: string;
    isCompleted?: boolean;
    offsetMinutes?: number;
}

export type ScoreTier = 'top' | 'promising' | 'exploring' | 'rejected';

export interface GroupedCandidates {
    top: Array<{ time: string; score: number }>;
    promising: Array<{ time: string; score: number }>;
    exploring: Array<{ time: string; score: number }>;
    rejected: Array<{ time: string; score: number }>;
}
