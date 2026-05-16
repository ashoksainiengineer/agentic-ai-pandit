import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorDisplay } from '../../components/rectify/analysis/ErrorDisplay';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="icon" />,
    RefreshCw: () => <div data-testid="icon" />,
    ServerCrash: () => <div data-testid="icon" />,
}));

describe('ErrorDisplay Component (Dimension 2)', () => {
    it('Displays the provided error message and handles retry clicks', () => {
        const mockRetry = vi.fn();
        const customError = "Server Connection Refused: Engine Timeout";

        render(<ErrorDisplay error={customError} onRetry={mockRetry} />);

        // Verify Title
        expect(screen.getByText('Connection Error')).toBeInTheDocument();

        // Verify Custom Error Text
        expect(screen.getByText(customError)).toBeInTheDocument();

        // Verify Retry Button Trigger
        const retryButton = screen.getByRole('button', { name: /retry connection/i });
        expect(retryButton).toBeInTheDocument();

        fireEvent.click(retryButton);
        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('Displays generic message if no specific error is provided', () => {
        const mockRetry = vi.fn();
        render(<ErrorDisplay onRetry={mockRetry} />);

        expect(screen.getByText(/Unable to establish a stable connection/)).toBeInTheDocument();
    });
});
