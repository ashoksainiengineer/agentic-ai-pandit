'use client';

import { memo, useMemo } from 'react';
import { Activity, Gem } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CandidateScore, StreamProgress, StreamStep, AIThinking } from '@/lib/store/stream-types';
import type { IAdvancedSignals } from '@/components/rectify/advanced-signals/types';
import { SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';

const SimplifiedPipeline = dynamic(() => import('@/components/rectify/analysis/SimplifiedPipeline').then(mod => mod.SimplifiedPipeline), { ssr: false });
const StageLeaderboard = dynamic(() => import('@/components/rectify/analysis/StageLeaderboard').then(mod => mod.StageLeaderboard), { ssr: false });
const AnalysisTriPanel = dynamic(() => import('@/components/rectify/analysis/AnalysisTriPanel').then(mod => mod.AnalysisTriPanel), { ssr: false });
const AdvancedSignalsDashboard = dynamic(() => import('@/components/rectify/advanced-signals/AdvancedSignalsDashboard'), { ssr: false });

interface StageStats {
    stage: number;
    candidateCount: number;
}

interface RectifyResultsPanelProps {
    progress: StreamProgress | null;
    isComplete: boolean;
    isConnected: boolean;
    cancelled: boolean;
    candidateScores: CandidateScore[];
    sortedCandidateScores: CandidateScore[];
    candidatesByStage: Record<number, Record<string, AIThinking>>;
    stageHistory: Record<number, string>;
    stageStats: StageStats[];
    allSteps: StreamStep[];
    activeAIStage: number | null;
    offsetMinutes: number;
    sessionId: string;
    advancedSignals: IAdvancedSignals | null;
    onStageClick: (stageId: number) => void;
}

export const RectifyResultsPanel = memo(function RectifyResultsPanel({
    progress,
    isComplete,
    isConnected,
    cancelled,
    candidateScores,
    sortedCandidateScores,
    candidatesByStage,
    stageHistory,
    allSteps,
    activeAIStage,
    offsetMinutes,
    sessionId,
    advancedSignals,
    onStageClick,
}: RectifyResultsPanelProps) {
    const currentStageIndex = Math.max(progress?.stepIndex ?? 0, activeAIStage ?? 0);

    const incomingStageNumbers = Object.keys(candidatesByStage).map(Number).filter(n => n > 0);

    // Determine the current active stage for the tri-panel
    const triPanelStage = useMemo(() => {
        // Prefer the activeAIStage if available
        if (activeAIStage && activeAIStage >= 1 && activeAIStage <= 6) return activeAIStage;
        // Fallback to progress index (0-based: stage 1 = index 0, etc.)
        const stageFromProgress = (progress?.stepIndex ?? 0) + 1;
        if (stageFromProgress >= 1 && stageFromProgress <= 6) return stageFromProgress;
        // Last resort: use the highest incoming stage number
        if (incomingStageNumbers.length > 0) return Math.max(...incomingStageNumbers);
        return 1;
    }, [activeAIStage, progress, incomingStageNumbers]);

    const isTriPanelStageCompleted = triPanelStage < currentStageIndex;
    const triPanelStageCandidates = candidatesByStage?.[triPanelStage] || {};

    return (
        <>
            {!cancelled && (
                <SectionErrorBoundary sectionName="Pipeline" icon={<Activity className="w-5 h-5" />}>
                    <SimplifiedPipeline
                        currentStage={progress?.stepIndex ?? 0}
                        isComplete={isComplete}
                        isConnected={isConnected}
                        activeAIStage={activeAIStage}
                        offsetMinutes={offsetMinutes}
                        onStageClick={onStageClick}
                    />
                </SectionErrorBoundary>
            )}

            {!cancelled && sortedCandidateScores.length > 0 && (
                <SectionErrorBoundary sectionName="Top Candidates" icon={<Activity className="w-5 h-5" />}>
                    <StageLeaderboard
                        stage={Math.max(...sortedCandidateScores.map(s => s.stage))}
                        scores={sortedCandidateScores}
                        isCompleted={isComplete}
                        sessionId={sessionId}
                    />
                </SectionErrorBoundary>
            )}

            {/* Tri-Panel: AI Reasoning | Candidate Times | Ephemeris */}
            {!cancelled && ((Object.keys(candidatesByStage).length > 0) || (progress?.stepIndex ?? 0) >= 1) && (
                <SectionErrorBoundary sectionName="Analysis Tri-Panel" icon={<Activity className="w-5 h-5" />}>
                    <AnalysisTriPanel
                        stage={triPanelStage}
                        candidateScores={candidateScores}
                        sortedCandidateScores={sortedCandidateScores}
                        stageCandidates={triPanelStageCandidates}
                        stageHistory={stageHistory}
                        isActive={!isTriPanelStageCompleted && !isComplete}
                        isCompleted={isTriPanelStageCompleted || isComplete}
                        allSteps={allSteps}
                        sessionId={sessionId}
                        title={allSteps?.[triPanelStage]?.name}
                    />
                </SectionErrorBoundary>
            )}

            {advancedSignals && (
                <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
                    <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                </SectionErrorBoundary>
            )}
        </>
    );
});
