import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardClient } from './DashboardClient';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="icon-sparkles" />,
    Search: () => <div data-testid="icon-search" />,
    BarChart3: () => <div data-testid="icon-barchart" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    Activity: () => <div data-testid="icon-activity" />,
    Star: () => <div data-testid="icon-star" />,
    Trash2: () => <div data-testid="icon-trash" />,
    ExternalLink: () => <div data-testid="icon-external" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    MapPin: () => <div data-testid="icon-map-pin" />,
    Clock: () => <div data-testid="icon-clock" />,
    Loader2: () => <div data-testid="icon-loader" />,
    CopyPlus: () => <div data-testid="icon-copy" />,
}));

// Mock components
vi.mock('@/components/dashboard/SessionCard', () => ({
    SessionCard: ({ session, onDelete }: any) => (
        <div data-testid="session-card">
            <span>{session.fullName}</span>
            <button onClick={() => onDelete(session.id)}>Delete</button>
        </div>
    ),
}));

vi.mock('@/components/ui/Breadcrumbs', () => ({
    Breadcrumbs: () => <div data-testid="breadcrumbs" />,
    predefinedBreadcrumbs: {
        dashboard: () => [],
    },
}));

const mockSessions = [
    {
        id: '1',
        fullName: 'John Doe',
        status: 'complete',
        confidence: 'high',
        accuracy: 95,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        birthPlace: 'New York',
        dateOfBirth: '1990-01-01',
    },
    {
        id: '2',
        fullName: 'Jane Smith',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        birthPlace: 'London',
        dateOfBirth: '1992-05-05',
    },
];

describe('DashboardClient', () => {
    it('renders stats correctly', () => {
        render(<DashboardClient initialSessions={mockSessions as any} userName="Test User" />);

        expect(screen.getByText('2')).toBeInTheDocument(); // Total
        expect(screen.getByText('1')).toBeInTheDocument(); // Done
        expect(screen.getByText('95%')).toBeInTheDocument(); // Accuracy (only for completed)
    });

    it('filters sessions by search query', () => {
        render(<DashboardClient initialSessions={mockSessions as any} userName="Test User" />);

        const searchInput = screen.getByPlaceholderText(/Search by name/i);
        fireEvent.change(searchInput, { target: { value: 'Jane' } });

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('handles session deletion', () => {
        render(<DashboardClient initialSessions={mockSessions as any} userName="Test User" />);

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]); // Delete John Doe

        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Total updated
    });

    it('shows empty state when no sessions match search', () => {
        render(<DashboardClient initialSessions={mockSessions as any} userName="Test User" />);

        const searchInput = screen.getByPlaceholderText(/Search by name/i);
        fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

        expect(screen.getByText(/No matches found/i)).toBeInTheDocument();
    });

    it('shows empty state when initial sessions are empty', () => {
        render(<DashboardClient initialSessions={[]} userName="Test User" />);

        expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument();
    });
});
