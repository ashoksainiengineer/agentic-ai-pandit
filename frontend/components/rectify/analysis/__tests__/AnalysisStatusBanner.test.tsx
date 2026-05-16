import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisStatusBanner } from '../AnalysisStatusBanner';
import React from 'react';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
    },
}));

describe('AnalysisStatusBanner (Heavy Testing)', () => {
    const defaultProps = {
        currentStage: 1,
        candidateCount: 50,
        totalCandidates: 100,
        analyzedCount: 25,
        elapsedSeconds: 120,
        isConnected: true,
        isComplete: false,
        activeAIStage: 1,
        offsetMinutes: 60,
    };

    it('renders initialization state correctly when stage is 0', () => {
        render(<AnalysisStatusBanner {...defaultProps} currentStage={0} activeAIStage={null} />);
        expect(screen.getByText(/Initialization/i)).toBeInTheDocument();
    });

    it('calculates and displays progress percentage correctly', () => {
        render(<AnalysisStatusBanner {...defaultProps} analyzedCount={50} totalCandidates={200} />);
        // 50 / 200 = 25%
        expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('displays correct time format (MM:SS)', () => {
        render(<AnalysisStatusBanner {...defaultProps} elapsedSeconds={125} />);
        expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('displays correct throughput (candidates per second)', () => {
        // 100 analyzed in 50 seconds = 2.0 c/s
        render(<AnalysisStatusBanner {...defaultProps} analyzedCount={100} elapsedSeconds={50} />);
        expect(screen.getByText('2.0')).toBeInTheDocument();
    });

    it('handles zero elapsed time gracefully for throughput', () => {
        render(<AnalysisStatusBanner {...defaultProps} elapsedSeconds={0} analyzedCount={100} />);
        expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('displays Analysis Complete state', () => {
        render(<AnalysisStatusBanner {...defaultProps} isComplete={true} />);
        expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
        expect(screen.getByText('Results verified & finalized')).toBeInTheDocument();
        expect(screen.getByText('Finalized')).toBeInTheDocument();
    });

    it('displays Reconnecting state when disconnected', () => {
        render(<AnalysisStatusBanner {...defaultProps} isConnected={false} />);
        expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });

    it('renders Phase labels correctly based on offsetMinutes and stage', () => {
        // Stage 1, offset 120 -> Phase B (Meso)
        const { rerender } = render(<AnalysisStatusBanner {...defaultProps} currentStage={1} offsetMinutes={120} />);
        expect(screen.getByText(/Meso Phase: Intermediate narrowing of candidate groups./)).toBeInTheDocument();

        // Stage 1, offset 240 -> Phase A (Macro)
        rerender(<AnalysisStatusBanner {...defaultProps} currentStage={1} offsetMinutes={240} />);
        expect(screen.getByText(/Macro Phase: Broad scanning of large time ranges./)).toBeInTheDocument();

        // Stage 5 -> Phase C (Micro)
        rerender(<AnalysisStatusBanner {...defaultProps} currentStage={5} activeAIStage={5} />);
        expect(screen.getByText(/Micro Phase: Extreme precision testing of remaining winners./)).toBeInTheDocument();
    });

    it('respects activeAIStage over currentStage if higher', () => {
        // Backend reports currentStage 2, but AI payload says activeAIStage 4
        render(<AnalysisStatusBanner {...defaultProps} currentStage={2} activeAIStage={4} />);
        expect(screen.getByText(/Divisional Analysis/)).toBeInTheDocument(); // Stage 4 name
    });
});
