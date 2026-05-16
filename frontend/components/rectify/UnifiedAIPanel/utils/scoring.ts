import { AIThinking, CandidateScore, GroupedCandidates } from '../types';

export function groupCandidatesByScore(
    candidates: Record<string, AIThinking> | undefined,
    scores: CandidateScore[] | undefined
): GroupedCandidates {
    const result: GroupedCandidates = { top: [], promising: [], exploring: [], rejected: [] };

    if (!candidates || Object.keys(candidates).length === 0) return result;

    const scoreMap = new Map<string, number>();
    if (scores) {
        scores.forEach(s => {
            const existing = scoreMap.get(s.time);
            if (existing === undefined || s.score > existing) {
                scoreMap.set(s.time, s.score);
            }
        });
    }

    Object.entries(candidates).forEach(([key, data]) => {
        const time = data.candidateTime || key.split('_').pop() || key;
        let score = scoreMap.get(time) ?? 0;

        // 🔱 INDUSTRY FIX: Force system batch keys into the top tier so reasoning is always visible
        // Match common system keys or anything that doesn't start with a timestamp like "14:30"
        const isSystemKey = /^(FINAL VERDICT|Deep Final|R\d+-|Batch|general)/i.test(time) || !/^\d{1,2}:\d{2}/.test(time);
        if (isSystemKey) {
            score = 100;
        }

        if (score >= 90) result.top.push({ time, score });
        else if (score >= 40) result.promising.push({ time, score });
        else if (score > 10) result.exploring.push({ time, score });
        else result.rejected.push({ time, score });
    });

    result.top.sort((a, b) => b.score - a.score);
    result.promising.sort((a, b) => b.score - a.score);
    result.exploring.sort((a, b) => b.score - a.score);
    result.rejected.sort((a, b) => b.score - a.score);

    return result;
}
