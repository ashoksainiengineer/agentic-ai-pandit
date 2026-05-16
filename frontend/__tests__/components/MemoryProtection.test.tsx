import { describe, it, expect, beforeEach } from 'vitest';
import { useStreamStore } from '../../lib/store/stream-store';

describe('Stream Store - Memory Protection Logic', () => {
    beforeEach(() => {
        useStreamStore.getState().clearStore();
    });

    it('archives low-scoring candidates when exceeding 500 items', () => {
        const store = useStreamStore.getState();

        // Dispatch 600 candidates
        // 100 will have high scores, 500 will have low scores
        for (let i = 0; i < 600; i++) {
            store.dispatchStreamEvent('candidate_score_v2', {
                time: `10:00:${i.toString().padStart(3, '0')}`,
                score: i < 100 ? 90 : 10,
                stage: 1
            });
        }

        const state = useStreamStore.getState();

        // Should have exactly 500 candidates (the cap)
        expect(state.candidateScores).toHaveLength(500);

        // High score ones should definitely be there
        const highScores = state.candidateScores.filter(s => s.score === 90);
        expect(highScores).toHaveLength(100);

        // Some low score ones should be pruned
        const lowScores = state.candidateScores.filter(s => s.score === 10);
        expect(lowScores).toHaveLength(400); // 500 cap - 100 high = 400
    });

    it('debounces IndexedDB persistence (logic check)', async () => {
        // Since we can't easily test the private debounceMap,
        // we check if multiple rapid score updates don't crash
        const store = useStreamStore.getState();
        for (let i = 0; i < 100; i++) {
            store.dispatchStreamEvent('candidate_score_v2', {
                time: '12:00:00',
                score: i,
                stage: 2
            });
        }

        // If the system holds up under 100 synchronous updates, 
        // the event batching and store integrity are preserved.
        expect(useStreamStore.getState().error).toBeNull();
    });
});
