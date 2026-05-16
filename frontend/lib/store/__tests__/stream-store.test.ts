import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock idb-keyval before importing the store
vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
}));

import { useStreamStore, createInitialState } from '../stream-store';

describe('useStreamStore (Zustand State Management)', () => {

    beforeEach(() => {
        // Reset the store before each test
        useStreamStore.setState(createInitialState());
        vi.clearAllMocks();
    });

    // ═════ Init & Defaults ═════

    describe('Initialization', () => {
        it('should initialize with correct default state', () => {
            const state = useStreamStore.getState();
            expect(state.sessionId).toBeNull();
            expect(state.isComplete).toBe(false);
            expect(state.error).toBeNull();
            expect(state.analyzedCount).toBe(0);
        });
    });

    // ═════ Direct Actions ═════

    describe('Direct Actions', () => {
        it('should set sessionId', () => {
            useStreamStore.getState().setSessionId('test-session-123');
            expect(useStreamStore.getState().sessionId).toBe('test-session-123');
        });

        it('should force error state', () => {
            useStreamStore.getState().forceError('Simulated Failure');
            expect(useStreamStore.getState().error).toBe('Simulated Failure');
            expect(useStreamStore.getState().isComplete).toBe(false);
        });

        it('should mark complete', () => {
            useStreamStore.getState().markComplete();
            expect(useStreamStore.getState().isComplete).toBe(true);
        });

        it('should clear store and reset everything', () => {
            const store = useStreamStore.getState();
            store.setSessionId('test-session-123');
            store.forceError('Test error');
            store.markComplete();

            store.clearStore();

            const resetState = useStreamStore.getState();
            expect(resetState.sessionId).toBeNull();
            expect(resetState.error).toBeNull();
            expect(resetState.isComplete).toBe(false);
        });
    });

    // ═════ Dispatch Event (Progress) ═════

    describe('dispatchStreamEvent - Progress', () => {
        it('should successfully handle "initial_state" event', () => {
            useStreamStore.getState().dispatchStreamEvent('initial_state', {
                progress: {
                    currentStep: 1,
                    totalSteps: 5,
                    message: 'Warming up the engines...',
                    steps: [{ id: 'init', name: 'Start' }],
                    candidateScores: [{ time: '12:00', score: 85, stage: 1 }],
                    startedAt: '2026-01-01T00:00:00Z',
                }
            });

            const state = useStreamStore.getState();
            expect(state.progress?.stepIndex).toBe(1);
            expect(state.progress?.totalSteps).toBe(5);
            expect(state.progress?.message).toBe('Warming up the engines...');
            expect(state.candidateScores.length).toBe(1);
            expect(state.startedAt).toBe('2026-01-01T00:00:00Z');
        });

        it('should successfully handle "progress" event', () => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 2,
                totalSteps: 7,
                message: 'Stage 2 Processing',
                percentage: 30,
            });

            const state = useStreamStore.getState();
            expect(state.progress?.stepIndex).toBe(2);
            expect(state.progress?.percentage).toBe(30);
            expect(state.progress?.message).toBe('Stage 2 Processing');
        });
    });

    // ═════ Dispatch Event (AI Thinking / rAF Batching) ═════

    describe('dispatchStreamEvent - AI Thinking', () => {
        it('should buffer "ai_thinking" chunks and flush on requestAnimationFrame', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            useStreamStore.getState().setSessionId('test-session');
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: 'Thinking step 1...',
                stage: 1,
                candidateTime: '12:00'
            });

            // Still buffered
            expect(useStreamStore.getState().candidatesByStage[1]).toBeUndefined();
            expect(rafCallback).toBeTruthy();

            // Trigger rAF
            if (rafCallback) {
                act(() => (rafCallback as any)(0));
            }

            const state = useStreamStore.getState();
            expect(state.candidatesByStage[1]?.['12:00'].fullText).toBe('Thinking step 1...');
        });

        it('should de-duplicate replayed chunks using subset/superset logic', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            useStreamStore.getState().setSessionId('test-session');
            const baseText = "We are testing the deduplication logic.";
            const extendedText = baseText + " Additional text appended later.";

            // Step 1: Initial chunk
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: baseText,
                stage: 1,
                candidateTime: '12:00'
            });
            if (rafCallback) act(() => (rafCallback as any)(0));

            // Step 2: Superset chunk (contains all of base + more)
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: extendedText,
                stage: 1,
                candidateTime: '12:00'
            });
            if (rafCallback) act(() => (rafCallback as any)(16));

            // Superset should replace entirely, not duplicate
            expect(useStreamStore.getState().candidatesByStage[1]?.['12:00'].fullText).toBe(extendedText);
        });
        it('should sync activeAIStage and update displayedCandidate (selection logic)', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            useStreamStore.getState().setSessionId('test-session');
            // Initial state: stage 1
            useStreamStore.setState({ activeAIStage: 1, displayedCandidate: null });

            // Send chunk for stage 2
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: 'Analyzing batch...',
                stage: 2,
                candidateTime: '14:30'
            });

            // 1. activeAIStage should update immediately (synchronously) to trigger panel switch
            expect(useStreamStore.getState().activeAIStage).toBe(2);

            // 2. displayedCandidate and fullText should update AFTER rAF flush
            if (rafCallback) act(() => (rafCallback as any)(0));

            const state = useStreamStore.getState();
            expect(state.candidatesByStage[2]?.['14:30'].fullText).toBe('Analyzing batch...');
            // INDUSTRY FIX: displayedCandidate should be the RAW time, not prefixed
            expect(state.displayedCandidate).toBe('14:30');
        });
    });

    // ═════ Tiered Memory & Pruning ═════

    describe('Tiered Memory & Pruning', () => {
        it('should enforce char limits based on candidate score', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            useStreamStore.getState().setSessionId('test-session');
            // Set a low score (40) for this candidate
            useStreamStore.setState({
                candidateScores: [{ time: '12:00', score: 40, stage: 1 }]
            });

            // Send a large chunk (over 5KB limit)
            const largeText = 'A'.repeat(6000);
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: largeText,
                stage: 1,
                candidateTime: '12:00'
            });

            if (rafCallback) act(() => (rafCallback as any)(0));

            const state = useStreamStore.getState();
            const fullText = state.candidatesByStage[1]?.['12:00'].fullText;

            // 40 score -> 5,000 char limit
            expect(fullText?.length).toBe(5000);
        });

        it('should prune low-score candidates when stage completes', () => {
            // Fill stage with many candidates (over the 500 limit)
            const candidates: Record<string, any> = {};
            const scores: any[] = [];
            for (let i = 0; i < 600; i++) {
                const time = `10:${i.toString().padStart(3, '0')}`;
                // Candidates 0-99 have score 100 (top), 100-599 have score 10 (low)
                candidates[time] = { fullText: 'some data' };
                scores.push({ time, score: i < 100 ? 100 : 10, stage: 1 });
            }

            useStreamStore.setState({
                candidatesByStage: { 1: candidates },
                candidateScores: scores,
                progress: { stepIndex: 1, totalSteps: 7, message: '', step: 'grid', percentage: 10 }
            });

            // Trigger a progress event that moves to stage 2
            act(() => {
                useStreamStore.getState().dispatchStreamEvent('initial_state', {
                    progress: {
                        currentStep: 2,
                        stepIndex: 2,
                        message: 'Moving to Stage 2',
                        candidateScores: scores,
                    }
                });
            });

            const state = useStreamStore.getState();

            // Expected: Only 500 candidates remain (MAX_ACTIVE_ALL)
            expect(state.candidateScores.length).toBe(500);

            // Expected: Top scorers (0-99) are still there
            const candidate0 = state.candidateScores.find(s => s.time === '10:000');
            expect(candidate0).toBeTruthy();
        });
    });

    // ═════ Dispatch Event (Terminal States) ═════

    describe('dispatchStreamEvent - Terminal States', () => {
        it('should handle "result" event', () => {
            useStreamStore.getState().dispatchStreamEvent('result', {
                rectifiedTime: '14:30',
                confidence: 'high'
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(true);
            expect(state.result?.rectifiedTime).toBe('14:30');
            expect(state.result?.confidence).toBe('high');
        });

        it('should handle "error" event', () => {
            useStreamStore.getState().dispatchStreamEvent('error', {
                message: 'Internal server error while processing'
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(false);
            expect(state.error).toBe('Internal server error while processing');
        });

        it('should hydrate terminal complete state from "terminal_state" result payload', () => {
            useStreamStore.getState().dispatchStreamEvent('terminal_state', {
                status: 'complete',
                result: { rectifiedTime: '09:12:44', confidence: 'high', accuracy: 97 }
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(true);
            expect(state.result?.rectifiedTime).toBe('09:12:44');
            expect(state.error).toBeNull();
        });

        it('should fallback to payload.error for "error" event schema compatibility', () => {
            useStreamStore.getState().dispatchStreamEvent('error', {
                error: 'Auth expired'
            });

            const state = useStreamStore.getState();
            expect(state.error).toBe('Auth expired');
            expect(state.isComplete).toBe(false);
        });
    });

    // ═════ Dispatch Event (AI Context) ═════

    describe('dispatchStreamEvent - AI Context', () => {
        it('should handle "ai_context" event and update activeAIStage', () => {
            useStreamStore.getState().dispatchStreamEvent('ai_context', {
                stage: 4,
                candidateTime: '12:30:00',
                planetaryInfo: { sun: 'Gemini 5°', moon: 'Leo 15°', ascendant: 'Aries 10°' },
                dasha: 'Rahu-Saturn',
                lifeEventsCount: 5,
            });

            const state = useStreamStore.getState();
            expect(state.aiContext).toBeTruthy();
            expect(state.aiContext?.stage).toBe(4);
            expect(state.aiContext?.candidateTime).toBe('12:30:00');
            expect(state.aiContext?.planetaryInfo?.sun).toBe('Gemini 5°');
            expect(state.activeAIStage).toBe(4);
        });
    });

    // ═════ Dispatch Event (Analysis Decisions) ═════

    describe('dispatchStreamEvent - Decisions', () => {
        it('should handle "decision" event and append to decisions array', () => {
            useStreamStore.getState().dispatchStreamEvent('decision', {
                stage: 2,
                time: '12:00:00',
                verdict: 'promoted',
                score: 85,
                reason: 'Strong ascendant-dasha correlation'
            });

            const state = useStreamStore.getState();
            expect(state.decisions).toHaveLength(1);
            expect(state.decisions[0].verdict).toBe('promoted');
            expect(state.decisions[0].reason).toBe('Strong ascendant-dasha correlation');
        });

        it('should de-duplicate decisions by time+stage (upsert)', () => {
            const store = useStreamStore.getState();

            store.dispatchStreamEvent('decision', {
                stage: 2, time: '12:00:00', verdict: 'promoted', score: 85, reason: 'Initial pass'
            });
            store.dispatchStreamEvent('decision', {
                stage: 2, time: '12:00:00', verdict: 'rejected', score: 45, reason: 'Revised after D9'
            });

            const state = useStreamStore.getState();
            expect(state.decisions).toHaveLength(1);
            expect(state.decisions[0].verdict).toBe('rejected');
            expect(state.decisions[0].reason).toBe('Revised after D9');
        });

        it('should cap decisions at 100 entries to prevent memory blowup', () => {
            const store = useStreamStore.getState();

            for (let i = 0; i < 110; i++) {
                store.dispatchStreamEvent('decision', {
                    stage: 2, time: `T-${i}`, verdict: 'promoted', score: 50 + i, reason: `Reason ${i}`
                });
            }

            const state = useStreamStore.getState();
            expect(state.decisions).toHaveLength(100);
            // Oldest 10 should be evicted (T-0 through T-9)
            expect(state.decisions.find(d => d.time === 'T-0')).toBeUndefined();
            expect(state.decisions.find(d => d.time === 'T-109')).toBeTruthy();
        });

        it('should ignore decisions with missing time', () => {
            useStreamStore.getState().dispatchStreamEvent('decision', {
                stage: 2, verdict: 'promoted', score: 85, reason: 'No time field'
            });

            expect(useStreamStore.getState().decisions).toHaveLength(0);
        });
    });

    // ═════ Dispatch Event (Stage Stats) ═════

    describe('dispatchStreamEvent - Stage Stats', () => {
        it('should handle "stage_stats" and add to stageStats array', () => {
            useStreamStore.getState().dispatchStreamEvent('stage_stats', {
                stage: 2,
                candidateCount: 45,
                description: 'Batch tournament complete: 45 scored'
            });

            const state = useStreamStore.getState();
            expect(state.stageStats).toHaveLength(1);
            expect(state.stageStats[0].stage).toBe(2);
            expect(state.stageStats[0].candidateCount).toBe(45);
        });

        it('should upsert stage stats (update existing stage entry)', () => {
            const store = useStreamStore.getState();

            store.dispatchStreamEvent('stage_stats', {
                stage: 2, candidateCount: 45, description: 'Initial'
            });
            store.dispatchStreamEvent('stage_stats', {
                stage: 2, candidateCount: 30, description: 'After elimination'
            });

            const state = useStreamStore.getState();
            expect(state.stageStats).toHaveLength(1);
            expect(state.stageStats[0].candidateCount).toBe(30);
            expect(state.stageStats[0].description).toBe('After elimination');
        });
    });

    // ═════ Dispatch Event (Metadata) ═════

    describe('dispatchStreamEvent - Metadata', () => {
        it('should handle "metadata" event and set session metadata', () => {
            useStreamStore.getState().dispatchStreamEvent('metadata', {
                fullName: 'Ashok Saini',
                dateOfBirth: '1990-05-15',
                tentativeTime: '14:30:00',
                birthPlace: 'Jaipur, India',
                timezone: 'Asia/Kolkata',
                aiModel: 'gpt-4o',
            });

            const state = useStreamStore.getState();
            expect(state.metadata?.fullName).toBe('Ashok Saini');
            expect(state.metadata?.dateOfBirth).toBe('1990-05-15');
            expect(state.metadata?.birthPlace).toBe('Jaipur, India');
            expect(state.metadata?.aiModel).toBe('gpt-4o');
        });

        it('should preserve in-flight state when metadata status is "pending"', () => {
            // First set some existing state
            useStreamStore.setState({
                candidateScores: [{ time: '12:00', score: 85, stage: 2 }],
                analyzedCount: 50,
                isComplete: true,
                sessionId: 'existing-session',
            });

            useStreamStore.getState().dispatchStreamEvent('metadata', {
                fullName: 'New User',
                status: 'pending',
            });

            const state = useStreamStore.getState();
            expect(state.sessionId).toBe('existing-session');
            expect(state.candidateScores).toHaveLength(1);
            expect(state.isComplete).toBe(true);
            expect(state.analyzedCount).toBe(50);
            expect(state.metadata?.fullName).toBe('New User');
        });

        it('should merge queued metadata without wiping existing scores', () => {
            useStreamStore.setState({
                candidateScores: [{ time: '12:00', score: 85, stage: 2 }],
                sessionId: 'test-session',
            });

            useStreamStore.getState().dispatchStreamEvent('metadata', {
                status: 'queued',
            });

            const state = useStreamStore.getState();
            expect(state.sessionId).toBe('test-session');
            expect(state.candidateScores).toHaveLength(1);
            expect(state.metadata?.status).toBe('queued');
        });
    });

    // ═════ Dispatch Event (Batch Candidate Scores) ═════

    describe('dispatchStreamEvent - Candidate Scores (batch variants)', () => {
        it('should handle "candidate_scores" with array payload', () => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', [
                { time: '12:00', score: 85, stage: 2 },
                { time: '12:05', score: 72, stage: 2 },
                { time: '12:10', score: 91, stage: 2 },
            ] as any);

            const state = useStreamStore.getState();
            expect(state.candidateScores).toHaveLength(3);
            expect(state.analyzedCount).toBe(3);
            expect(state.activeAIStage).toBe(2);
        });

        it('should handle "candidate_score" (singular) with single object payload', () => {
            useStreamStore.getState().dispatchStreamEvent('candidate_score', {
                time: '14:30', score: 88, stage: 4
            });

            const state = useStreamStore.getState();
            expect(state.candidateScores).toHaveLength(1);
            expect(state.candidateScores[0].time).toBe('14:30');
            expect(state.activeAIStage).toBe(4);
        });

        it('should merge scores across stages without duplicating', () => {
            const store = useStreamStore.getState();

            store.dispatchStreamEvent('candidate_scores', [
                { time: '12:00', score: 85, stage: 2 },
            ] as any);
            store.dispatchStreamEvent('candidate_scores', [
                { time: '12:00', score: 92, stage: 4 }, // Same time, different stage
                { time: '12:05', score: 78, stage: 4 },
            ] as any);

            const state = useStreamStore.getState();
            expect(state.candidateScores).toHaveLength(3); // 1 from S2, 2 from S4
            expect(state.candidateScores.find(s => s.time === '12:00' && s.stage === 2)?.score).toBe(85);
            expect(state.candidateScores.find(s => s.time === '12:00' && s.stage === 4)?.score).toBe(92);
        });
    });
});
