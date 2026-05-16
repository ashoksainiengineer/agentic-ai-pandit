/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Setup jest-dom matchers with vitest expect
(globalThis as any).expect = expect;
import '@testing-library/jest-dom';
import { AnalysisStatusBanner } from '../components/rectify/analysis/AnalysisStatusBanner';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Dimension 1: AnalysisStatusBanner (State & Rendering)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders initialization state correctly', () => {
        render(
            <AnalysisStatusBanner
                currentStage={0}
                candidateCount={0}
                totalCandidates={100}
                analyzedCount={0}
                elapsedSeconds={0}
                isConnected={true}
                isComplete={false}
            />
        );

        expect(screen.getByText(/Initialization/i)).toBeInTheDocument();
        expect(screen.getByText(/Preparing analysis engine/i)).toBeInTheDocument();
        expect(screen.getByText(/Inference Active/i)).toBeInTheDocument();
    });

    it('updates stage details and phase indicators accurately based on offset', () => {
        render(
            <AnalysisStatusBanner
                currentStage={2} // Amsha-Varga Elimination
                candidateCount={45}
                totalCandidates={100}
                analyzedCount={55}
                elapsedSeconds={120}
                isConnected={true}
                isComplete={false}
                offsetMinutes={240} // > 120 triggers 'Macro Phase: Broad scanning of large time ranges.'
            />
        );

        expect(screen.getByText(/Amsha-Varga Elimination/i)).toBeInTheDocument();
        expect(screen.getByText(/Macro Phase: Broad scanning of large time ranges./i)).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument(); // Candidate count
        expect(screen.getByText('02:00')).toBeInTheDocument(); // Elapsed formatted
        expect(screen.getByText('55%')).toBeInTheDocument(); // Progress % Math.round((55/100)*100)
    });

    it('handles completion state prioritizing "Analysis Complete"', () => {
        render(
            <AnalysisStatusBanner
                currentStage={6}
                candidateCount={1}
                totalCandidates={100}
                analyzedCount={100}
                elapsedSeconds={360}
                isConnected={false}
                isComplete={true}
            />
        );

        expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
        expect(screen.getByText('Results verified & finalized')).toBeInTheDocument();
        expect(screen.getByText('Finalized')).toBeInTheDocument();
        expect(screen.getByText('06:00')).toBeInTheDocument();
    });
});
