import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CancelConfirmation } from '../../components/rectify/analysis/CancelConfirmation';

vi.mock('lucide-react', () => ({
    XCircle: () => <div data-testid="icon" />,
    Play: () => <div data-testid="icon" />,
}));

// Mock framer-motion to prevent hook issues inside pure React testing
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

describe('CancelConfirmation Component (Dimension 3)', () => {
    it('Renders warning text and correctly separates abort/confirm callbacks', () => {
        const mockConfirm = vi.fn();
        const mockAbort = vi.fn();

        render(<CancelConfirmation onConfirm={mockConfirm} onAbort={mockAbort} />);

        // Verify content
        expect(screen.getByText('Cancel Analysis?')).toBeInTheDocument();
        expect(screen.getByText(/All current progress.*will be lost/)).toBeInTheDocument();

        // Test Confirm
        const confirmButton = screen.getByRole('button', { name: /yes, cancel/i });
        fireEvent.click(confirmButton);
        expect(mockConfirm).toHaveBeenCalledTimes(1);
        expect(mockAbort).not.toHaveBeenCalled();

        // Reset
        vi.clearAllMocks();

        // Test Abort (Keep Running)
        const abortButton = screen.getByRole('button', { name: /keep running/i });
        fireEvent.click(abortButton);
        expect(mockAbort).toHaveBeenCalledTimes(1);
        expect(mockConfirm).not.toHaveBeenCalled();
    });
});
