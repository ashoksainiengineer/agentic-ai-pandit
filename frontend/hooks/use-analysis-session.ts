'use client';

import { useState, useEffect } from 'react';
import { useAnalysisSSE } from '@/lib/use-analysis-sse';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import { useTestMode } from '@/lib/test-mode-context';

export function useAnalysisSession(
    sessionId: string | null,
    isLoaded: boolean,
    isSignedIn: boolean,
    getToken: () => Promise<string | null>
) {
    const isTestMode = useTestMode();

    const { isConnected, isConnecting } = useAnalysisSSE(
        (isLoaded && isSignedIn) || isTestMode ? sessionId : null
    );

    const {
        isComplete,
        streamError,
        progress,
        candidateScores,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        candidatesByStage,
        stageHistory,
        batchConclusions,
        stageConclusions,
    } = useStreamStore(useShallow(state => ({
        isComplete: state.isComplete,
        streamError: state.error,
        progress: state.progress,
        candidateScores: state.candidateScores,
        result: state.result,
        startedAt: state.startedAt,
        allSteps: state.allSteps,
        metadata: state.metadata,
        activeAIStage: state.activeAIStage,
        candidatesByStage: state.candidatesByStage,
        stageHistory: state.stageHistory,
        batchConclusions: state.batchConclusions,
        stageConclusions: state.stageConclusions,
    })));

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    useEffect(() => {
        if (!startedAt) { setElapsedSeconds(0); return; }
        const startMs = new Date(startedAt).getTime();
        if (isNaN(startMs)) { setElapsedSeconds(0); return; }
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
        const interval = setInterval(() => {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    const hasError = !!streamError;
    const errorMessage = streamError || 'Unknown error';
    const hasData = !!(progress || candidateScores.length > 0 || Object.keys(candidatesByStage).length > 0);

    return {
        isComplete,
        hasError,
        errorMessage,
        progress,
        candidateScores,
        result,
        startedAt,
        allSteps,
        metadata,
        activeAIStage,
        candidatesByStage,
        stageHistory,
        batchConclusions,
        stageConclusions,
        elapsedSeconds,
        hasData,
        isConnected,
        isConnecting,
    };
}
