import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageLeaderboard } from '../StageLeaderboard';
import React from 'react';

// Mock lib/store/stream-store
const mockFetchCandidateEphemeris = vi.fn();
const mockClearExpandedCandidate = vi.fn();

vi.mock('@/lib/store/stream-store', () => ({
    useStreamStore: (selector: any) => selector({
        expandedCandidate: null,
        fetchCandidateEphemeris: mockFetchCandidateEphemeris,
        clearExpandedCandidate: mockClearExpandedCandidate,
    }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('StageLeaderboard (Heavy Testing)', () => {
    const generateScores = (count: number, stage: number) => {
        return Array.from({ length: count }, (_, i) => ({
            time: `12:${i.toString().padStart(2, '0')}`,
            score: 100 - i,
            stage,
            minifiedEph: {
                ascendant: 'Aries 10°',
                moon: 'Leo 15°',
                sun: 'Gemini 5°'
            }
        }));
    };

    const defaultProps = {
        stage: 2,
        scores: generateScores(10, 2),
        isCompleted: false,
        sessionId: 'test-session',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with multiple candidates and shows the leader', () => {
        render(<StageLeaderboard {...defaultProps} />);

        expect(screen.getByText(/Amsha-Varga Elimination/i)).toBeInTheDocument();
        expect(screen.getByText('10 candidates scored')).toBeInTheDocument();
        expect(screen.getByText(/LEADER/i)).toBeInTheDocument();
        expect(screen.getByText('12:00')).toBeInTheDocument(); // Top score
    });

    it('sorts candidates by score descending', () => {
        const scores = [
            { time: '12:00', score: 50, stage: 2 },
            { time: '12:01', score: 90, stage: 2 },
            { time: '12:02', score: 75, stage: 2 },
        ];
        render(<StageLeaderboard {...defaultProps} scores={scores as any} stage={2} />);

        const timeElements = screen.getAllByText(/12:0\d/);
        expect(timeElements[0]).toHaveTextContent('12:01'); // 90
        expect(timeElements[1]).toHaveTextContent('12:02'); // 75
        expect(timeElements[2]).toHaveTextContent('12:00'); // 50
    });

    it('filters candidates based on search query', () => {
        render(<StageLeaderboard {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText(/Search candidate/i);
        fireEvent.change(searchInput, { target: { value: '12:05' } });

        expect(screen.getByText('12:05')).toBeInTheDocument();
        expect(screen.queryByText('12:00')).not.toBeInTheDocument();
    });

    it('switches stages when a stage tab is clicked', () => {
        const multiStageScores = [
            ...generateScores(5, 2),
            ...generateScores(5, 4),
        ];
        render(<StageLeaderboard {...defaultProps} scores={multiStageScores as any} stage={4} />);

        // Default is S4 because it's the max navSTAGE with scores
        expect(screen.getByText(/Divisional Analysis/i)).toBeInTheDocument();

        // Click S2 tab
        const s2Tab = screen.getByText(/S2/i);
        fireEvent.click(s2Tab);

        expect(screen.getByText(/Amsha-Varga Elimination/i)).toBeInTheDocument();
    });

    it('calls fetchCandidateEphemeris when a candidate is expanded', () => {
        render(<StageLeaderboard {...defaultProps} />);

        const candidateRow = screen.getByText('12:03');
        fireEvent.click(candidateRow);

        expect(mockFetchCandidateEphemeris).toHaveBeenCalledWith('test-session', '12:03', 2);
    });

    it('returns null if no data for non-initial stage', () => {
        const { container } = render(<StageLeaderboard {...defaultProps} scores={[]} stage={2} />);
        expect(container.firstChild).toBeNull();
    });
});
