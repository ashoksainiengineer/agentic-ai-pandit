/**
 * types.ts
 * Centralized type definitions for the Results Dashboard architecture.
 */

export interface BirthData {
    fullName: string;
    dateOfBirth?: string;
    tentativeTime?: string;
    birthPlace?: string;
}

export interface StageHistory {
    stage1Count?: number;
    stage2Count?: number;
    stage3Count?: number;
    stage4Count?: number;
    stage5Count?: number;
}

export interface MethodScores {
    [key: string]: number;
}

export interface FinalCandidate {
    thinking?: string;
    methodScores?: MethodScores;
}

export interface GodTierData {
    ephemeris?: {
        planets?: {
            sun?: { sign?: string; longitude?: number };
            moon?: { sign?: string; longitude?: number };
            [key: string]: { sign?: string; longitude?: number } | undefined;
        };
        ascendant?: { sign?: string; longitude?: number };
    };
    divCharts?: Record<string, unknown>;
    dasha?: string;
    shuddhi?: Record<string, unknown>;
}

export interface BoundarySafety {
    lagnaSignBoundary: number;
    moonNakshatraBoundary: number;
}

export interface EventMatch {
    event?: string;
    name?: string;
    match?: boolean;
    dasha?: string;
}

export interface AnalysisDetails {
    summary?: string;
    finalCandidate?: FinalCandidate;
    alternatives?: Array<{
        time: string;
        score?: number;
        ephemeris?: Record<string, unknown>;
        [key: string]: unknown;
    }>;
    stageHistory?: StageHistory;
    eventMatches?: EventMatch[];
    boundarySafety?: BoundarySafety;
    godTierData?: GodTierData;
    aiAnalysis?: string;
    [key: string]: unknown;
}

export interface FinalResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    analysisResult: string | AnalysisDetails;
    stagesCompleted: number;
}

export interface ResultsDashboardProps {
    sessionId: string;
    data: FinalResult;
    birthData: BirthData;
    reasoningLogs?: string | AnalysisDetails;
}

export interface Stage {
    id: number;
    name: string;
    candidates: number;
    color: string;
}
