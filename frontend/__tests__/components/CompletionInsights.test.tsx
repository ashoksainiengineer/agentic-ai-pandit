import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompletionInsights } from '../../components/rectify/analysis/CompletionInsights';

vi.mock('lucide-react', () => ({
    Brain: () => <div data-testid="icon" />,
    Trophy: () => <div data-testid="icon" />,
    CheckCircle2: () => <div data-testid="icon" />,
    Copy: () => <div data-testid="icon" />,
}));

// Mock Next.js Navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

describe('CompletionInsights Component (Dimension 4)', () => {
    it('Displays the final rectified result and routes to the official report correctly', () => {
        const mockResult = {
            rectifiedTime: '18:45:00',
            confidence: 'Very High',
            accuracy: 99.5
        };
        const sessionId = "final-test-sess-999";

        render(<CompletionInsights result={mockResult} sessionId={sessionId} />);

        // Verify Titles and Information
        expect(screen.getByText('Analysis Successfully Completed')).toBeInTheDocument();
        expect(screen.getByText('18:45:00')).toBeInTheDocument();
        expect(screen.getByText(/99\.5%/)).toBeInTheDocument();

        // Verify the navigation trigger
        const reportButton = screen.getByRole('button', { name: /view official report/i });
        fireEvent.click(reportButton);

        expect(mockPush).toHaveBeenCalledWith(`/rectify/${sessionId}/report`);
    });
});
