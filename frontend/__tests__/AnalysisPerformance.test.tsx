/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalysisPage from '../app/rectify/[id]/page';
import { useStreamStore } from '../lib/store/stream-store';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'test-session-123' }),
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: vi.fn(),
        isLoaded: true,
        isSignedIn: true,
    }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock specific components
vi.mock('@/components/rectify/analysis/StageLeaderboard', () => ({
    StageLeaderboard: (props: any) => (
        <div data-testid="leaderboard">
            Top Candidates
            {props.scores?.slice(0, 10).map((s: any) => (
                <div key={s.time}>{s.time} - {s.score}%</div>
            ))}
        </div>
    )
}));

vi.mock('next/dynamic', () => ({
    default: () => (props: any) => (
        <div data-testid="dynamic-mock">
            {props.scores && <span>Top Candidates</span>}
            {props.scores?.slice(0, 10).map((s: any) => (
                <span key={s.time}>{s.time} - {s.score}%</span>
            ))}
        </div>
    )
}));

describe('Analysis Page: Performance & Large Scale Data', () => {
    beforeEach(() => {
        act(() => {
            useStreamStore.getState().clearStore();
            useStreamStore.getState().setSessionId('test-session-123');
        });
    });

    it('renders effectively with extreme candidate volumes (1000+ candidates)', async () => {
        const manyCandidates = Array.from({ length: 1000 }, (_, i) => ({
            time: `12:00:${i.toString().padStart(2, '0').slice(-2)}.${i}`,
            score: Math.floor(Math.random() * 100),
            stage: 2,
            confidence: 'Medium',
        }));

        // Measure time to dispatch and render
        const start = performance.now();

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', manyCandidates);
        });

        render(<AnalysisPage />);

        const end = performance.now();
        console.log(`Render time for 1000 candidates: ${end - start}ms`);

        // Verify that only the top survivors are highlighted (store archives them)
        // Note: stream-store.ts has MAX_ACTIVE_ALL = 500
        const activeScores = useStreamStore.getState().candidateScores;
        expect(activeScores.length).toBeLessThanOrEqual(500);

        // Leaderboard should still be responsive
        expect(screen.getByText(/Top Candidates/i)).toBeInTheDocument();

        // Ensure the UI doesn't freeze (implicitly verified by test not timing out)
        expect(end - start).toBeLessThan(3000); // 3s threshold for "Heavy" render
    });

    it('manages memory by archiving low-scored survivors at high scale', () => {
        // Create 2000 candidates
        const totalCandidates = 2000;
        const manyCandidates = Array.from({ length: totalCandidates }, (_, i) => ({
            time: `T-${i}`,
            score: i / 20, // max 100
            stage: 2,
        }));

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', manyCandidates);
        });

        const state = useStreamStore.getState();

        // Store should have capped the list to 500
        expect(state.candidateScores.length).toBe(500);

        // Capped list should contain the HIGHEST scores
        const minScore = Math.min(...state.candidateScores.map(s => s.score));
        expect(minScore).toBeGreaterThan(70);
    });
});
