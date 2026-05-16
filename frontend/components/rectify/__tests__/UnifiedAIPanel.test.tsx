import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedAIPanel } from '../UnifiedAIPanel';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
        span: ({ children, className, ...props }: any) => (
            <span className={className} {...props}>
                {children}
            </span>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: () => ({
        getVirtualItems: () => [
            { index: 0, start: 0, size: 200, key: '0' },
            { index: 1, start: 200, size: 200, key: '1' }
        ],
        getTotalSize: () => 400,
    }),
}));

describe('UnifiedAIPanel (Heavy Testing)', () => {
    const generateHeavyCandidates = (count: number) => {
        const candidates: Record<string, any> = {};
        for (let i = 0; i < count; i++) {
            const time = `12:${i.toString().padStart(2, '0')}`;
            candidates[time] = {
                stage: 2,
                candidateTime: time,
                fullText: `Heavy reasoning data for ${time}. `.repeat(100),
                updatedAt: Date.now() - (i * 1000),
            };
        }
        return candidates;
    };

    const defaultProps = {
        thinking: null,
        isActive: true,
        stage: 2,
        allCandidates: {},
        candidateScores: [],
        title: 'Test AI Panel',
        isCompleted: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        window.IntersectionObserver = vi.fn().mockImplementation(function () {
            return {
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn()
            };
        });

        window.ResizeObserver = vi.fn().mockImplementation(function () {
            return {
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn()
            };
        });
    });

    it('renders the header and progress bar with heavy candidate load', () => {
        const heavyCandidates = generateHeavyCandidates(100);
        render(<UnifiedAIPanel {...defaultProps} allCandidates={heavyCandidates} />);

        expect(screen.getByText('Test AI Panel')).toBeInTheDocument();
        expect(screen.getByText('100 Processed')).toBeInTheDocument();
        expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('renders candidates in the grid (first row mock)', () => {
        const heavyCandidates = generateHeavyCandidates(10);
        render(<UnifiedAIPanel {...defaultProps} allCandidates={heavyCandidates} />);

        // Since columns is 4 and mocked rowCount is 2, it should show 8 cards
        // 12:00 to 12:07
        expect(screen.getByText('12:00')).toBeInTheDocument();
        expect(screen.getByText('12:07')).toBeInTheDocument();
    });

    it('renders active search and filters candidates', () => {
        const heavyCandidates = generateHeavyCandidates(10);

        render(
            <UnifiedAIPanel
                {...defaultProps}
                allCandidates={heavyCandidates}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search candidates/i);
        fireEvent.change(searchInput, { target: { value: '12:05' } });

        expect(screen.getByText(/Found 1 results/i)).toBeInTheDocument();
    });

    it('switches to focused view when a candidate is clicked', () => {
        const heavyCandidates = generateHeavyCandidates(4);
        render(<UnifiedAIPanel {...defaultProps} allCandidates={heavyCandidates} />);

        const card = screen.getByText('12:01');
        fireEvent.click(card);

        // Should show the "Back to Grid" button and the focused time
        expect(screen.getByText(/Back to Grid/i)).toBeInTheDocument();

        // Verify ReasoningContent renders the candidate's fullText
        // (highlightKeywords splits text into spans — check via body textContent)
        expect(document.body.textContent).toMatch(/Heavy reasoning data for 12:01/i);
    });

    it('collapses content when isCompleted is true and isActive is false', () => {
        render(<UnifiedAIPanel {...defaultProps} isCompleted={true} isActive={false} />);
        const titleElement = screen.getByText(/Test AI Panel/i);
        expect(titleElement).toHaveClass('text-black/60');
    });
});
