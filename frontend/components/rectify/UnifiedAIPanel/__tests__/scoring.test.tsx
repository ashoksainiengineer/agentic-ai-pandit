import { describe, it, expect } from 'vitest';
import { groupCandidatesByScore } from '../utils/scoring';
import { AIThinking, CandidateScore } from '../types';

describe('groupCandidatesByScore', () => {
    it('groups candidates into correct tiers based on score map', () => {
        const candidates: Record<string, AIThinking> = {
            c1: { stage: 2, candidateTime: '10:00', fullText: 'test1' },
            c2: { stage: 2, candidateTime: '11:00', fullText: 'test2' },
            c3: { stage: 2, candidateTime: '12:00', fullText: 'test3' },
            c4: { stage: 2, candidateTime: '13:00', fullText: 'test4' },
        };

        const scores: CandidateScore[] = [
            { time: '10:00', score: 95, stage: 2 },
            { time: '11:00', score: 50, stage: 2 },
            { time: '12:00', score: 25, stage: 2 },
            { time: '13:00', score: 5, stage: 2 },
        ];

        const result = groupCandidatesByScore(candidates, scores);

        expect(result.top).toHaveLength(1);
        expect(result.top[0].time).toBe('10:00');
        expect(result.top[0].score).toBe(95);

        expect(result.promising).toHaveLength(1);
        expect(result.promising[0].time).toBe('11:00');

        expect(result.exploring).toHaveLength(1);
        expect(result.exploring[0].time).toBe('12:00');

        expect(result.rejected).toHaveLength(1);
        expect(result.rejected[0].time).toBe('13:00');
    });

    it('forces system keys into the top tier automatically', () => {
        const candidates: Record<string, AIThinking> = {
            sys1: { stage: 2, candidateTime: 'FINAL VERDICT', fullText: 'system output' },
            sys2: { stage: 2, candidateTime: 'Batch Summary', fullText: 'system output' },
        };

        const result = groupCandidatesByScore(candidates, []);

        expect(result.top).toHaveLength(2);
        expect(result.top[0].score).toBe(100);
        expect(result.top[1].score).toBe(100);
    });
});
