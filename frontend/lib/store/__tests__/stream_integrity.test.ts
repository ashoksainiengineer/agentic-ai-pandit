import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStreamStore } from '../stream-store';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
}));

// Mock Zustand persist middleware to avoid IndexedDB issues during test
vi.mock('zustand/middleware', async (importOriginal) => {
    const original = await importOriginal<any>();
    return {
        ...original,
        persist: (config: any) => (set: any, get: any, api: any) => config(set, get, api),
    };
});

describe('Chapter 5: Stream Store Integrity (Zustand)', () => {
    beforeEach(() => {
        useStreamStore.getState().clearStore();
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with default state', () => {
        const state = useStreamStore.getState();
        expect(state.error).toBe(null);
        expect((state as any).currentStep).toBeUndefined(); // It's progress.step or progress.stepIndex
        expect(state.candidateScores).toHaveLength(0);
        expect(state.isComplete).toBe(false);
    });

    it('should handle session ID updates', () => {
        useStreamStore.getState().setSessionId('test-session-123');
        expect(useStreamStore.getState().sessionId).toBe('test-session-123');

        useStreamStore.getState().clearStore();
        expect(useStreamStore.getState().sessionId).toBe(null);
    });

    describe('Event Dispatching (dispatchStreamEvent)', () => {
        it('should handle "progress" events', () => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 3,
                percentage: 45,
                message: 'Processing fine grid...'
            });

            const state = useStreamStore.getState();
            expect(state.progress?.stepIndex).toBe(3);
            expect(state.progress?.percentage).toBe(45);
            expect(state.progress?.message).toBe('Processing fine grid...');
        });

        it('should handle "candidate_score" events and maintain top scores', () => {
            const store = useStreamStore.getState();

            // Add a few scores
            store.dispatchStreamEvent('candidate_score', { time: '12:00:00', score: 85, stage: 2 });
            store.dispatchStreamEvent('candidate_score', { time: '12:05:00', score: 92, stage: 2 });

            const state = useStreamStore.getState();
            expect(state.candidateScores).toHaveLength(2);
            expect(state.candidateScores.find(s => s.time === '12:05:00')?.score).toBe(92);
        });

        it('should handle "complete" event and set terminal state', () => {
            useStreamStore.getState().dispatchStreamEvent('complete', {
                rectifiedTime: '12:04:30',
                accuracy: 95,
                confidence: 'HIGH'
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(true);
            expect(state.result?.rectifiedTime).toBe('12:04:30');
            expect(state.result?.confidence).toBe('HIGH');
        });

        it('should handle "error" events', () => {
            useStreamStore.getState().dispatchStreamEvent('error', {
                message: 'AI Model Timeout'
            });

            const state = useStreamStore.getState();
            expect(state.error).toBe('AI Model Timeout');
        });
    });

    describe('AI Thinking Buffer (Throttling)', () => {
        it('should buffer "ai_thinking" events and flush them via RAF', () => {
            // Mock requestAnimationFrame and cancelAnimationFrame
            const rafCallbacks: any[] = [];
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb: any) => {
                rafCallbacks.push(cb);
                return 1;
            }));
            vi.stubGlobal('cancelAnimationFrame', vi.fn());

            const store = useStreamStore.getState();
            store.setSessionId('test-session-raf');

            // Dispatch multiple thinking chunks rapidly
            store.dispatchStreamEvent('ai_thinking', {
                stage: 2,
                candidateTime: '12:00:00',
                chunk: 'Analysis '
            });
            store.dispatchStreamEvent('ai_thinking', {
                stage: 2,
                candidateTime: '12:00:00',
                chunk: 'started...'
            });

            // State should NOT be updated immediately for thinking (due to buffering)
            let state = useStreamStore.getState();
            expect(state.candidatesByStage[2]?.['12:00:00']).toBeUndefined();

            // Manually execute rAF callbacks
            rafCallbacks.forEach(cb => cb());

            state = useStreamStore.getState();
            expect(state.candidatesByStage[2]?.['12:00:00']?.fullText).toContain('Analysis started...');

            vi.unstubAllGlobals();
        });
    });
});
