import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisSession } from '../use-analysis-session';

const mockStreamStoreState = {
    isComplete: false,
    error: null,
    progress: null,
    candidateScores: [],
    result: null,
    startedAt: null,
    allSteps: [],
    metadata: null,
    activeAIStage: null,
    candidatesByStage: {},
    stageHistory: [],
    stageStats: [],
};
let mockTestMode = false;

vi.mock('@/lib/use-analysis-sse', () => ({
    useAnalysisSSE: vi.fn(() => ({ isConnected: true, isConnecting: false, connectionState: 'connected' })),
}));

vi.mock('@/lib/store/stream-store', () => ({
    useStreamStore: vi.fn((selector: any) => {
        return selector ? selector(mockStreamStoreState) : mockStreamStoreState;
    }),
}));

vi.mock('zustand/react/shallow', () => ({
    useShallow: (fn: any) => fn,
}));

vi.mock('@/lib/test-mode-context', () => ({
    useTestMode: () => mockTestMode,
}));

describe('useAnalysisSession', () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token');

    beforeEach(() => {
        vi.clearAllMocks();
        mockTestMode = false;
        Object.assign(mockStreamStoreState, {
            isComplete: false,
            error: null,
            progress: null,
            candidateScores: [],
            result: null,
            startedAt: null,
            allSteps: [],
            metadata: null,
            activeAIStage: null,
            candidatesByStage: {},
            stageHistory: {},
        });
    });

    it('should be importable and return expected shape', () => {
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', true, true, mockGetToken)
        );

        expect(result.current).toBeDefined();
        expect(result.current.isComplete).toBe(false);
        expect(result.current.hasError).toBe(false);
        expect(result.current.progress).toBeNull();
        expect(result.current.candidateScores).toEqual([]);
        expect(result.current.result).toBeNull();
        expect(result.current.startedAt).toBeNull();
        expect(result.current.allSteps).toEqual([]);
        expect(result.current.metadata).toBeNull();
        expect(result.current.activeAIStage).toBeNull();
        expect(result.current.candidatesByStage).toEqual({});
        expect(result.current.stageHistory).toEqual({});
        expect(result.current.elapsedSeconds).toBe(0);
        expect(result.current.hasData).toBe(false);
    });

    it('should not connect when not loaded or signed in and not in test mode', () => {
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', false, false, mockGetToken)
        );
        expect(result.current.hasError).toBe(false);
    });

    it('should render in test mode even when not signed in', () => {
        mockTestMode = true;
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', false, false, mockGetToken)
        );
        expect(result.current.hasError).toBe(false);
    });
});
