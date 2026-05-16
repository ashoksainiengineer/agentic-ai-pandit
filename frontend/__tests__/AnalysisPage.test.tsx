import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorDisplay } from '../components/rectify/analysis/ErrorDisplay';
import { CancelConfirmation } from '../components/rectify/analysis/CancelConfirmation';
import { CompletionInsights } from '../components/rectify/analysis/CompletionInsights';

// Mock Router for Completion Insights
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AnalysisPage Pure Components (Dimensions 2, 3, 4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Dimension 2: Error Handling', () => {
        it('Displays ErrorDisplay correctly on catastrophic stream failure', () => {
            const mockRetry = vi.fn();

            render(
                <ErrorDisplay
                    error="Server Connection Refused"
                    onRetry={mockRetry}
                />
            );

            expect(screen.getByText('Connection Error')).toBeInTheDocument();
            expect(screen.getByText('Server Connection Refused')).toBeInTheDocument();

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();

            fireEvent.click(retryButton);
            expect(mockRetry).toHaveBeenCalled();
        });
    });

    describe('Dimension 3: User Interaction (Cancel Flow)', () => {
        it('Shows Confirm/Keep Running buttons and triggers respective callbacks', () => {
            const mockConfirm = vi.fn();
            const mockAbort = vi.fn();

            render(
                <CancelConfirmation
                    onConfirm={mockConfirm}
                    onAbort={mockAbort}
                />
            );

            const confirmButton = screen.getByRole('button', { name: /cancel/i });
            const keepRunningButton = screen.getByRole('button', { name: /keep running/i });

            expect(confirmButton).toBeInTheDocument();
            expect(keepRunningButton).toBeInTheDocument();

            fireEvent.click(confirmButton);
            expect(mockConfirm).toHaveBeenCalled();

            fireEvent.click(keepRunningButton);
            expect(mockAbort).toHaveBeenCalled();
        });
    });

    describe('Dimension 4: Finalization and Metrics', () => {
        it('Renders CompletionMatrix and final score correctly when complete', () => {
            render(
                <CompletionInsights
                    result={{ rectifiedTime: '14:24:00', confidence: 'High', accuracy: 98 }}
                    sessionId="test-session-123"
                />
            );

            expect(screen.getByText('Analysis Successfully Completed')).toBeInTheDocument();
            expect(screen.getByText('14:24:00')).toBeInTheDocument();
            expect(screen.getByText(/98%/)).toBeInTheDocument();

            const viewReportBtn = screen.getByRole('button', { name: /view official report/i });
            expect(viewReportBtn).toBeInTheDocument();

            fireEvent.click(viewReportBtn);
            expect(mockPush).toHaveBeenCalledWith(`/rectify/test-session-123/report`);
        });
    });
});
