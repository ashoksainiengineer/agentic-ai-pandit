import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionCard } from './SessionCard';
import React from 'react';

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

// Mock Clerk useAuth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: () => Promise.resolve('mock-token'),
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        refresh: mockRouterRefresh,
    }),
}));

// Mock next/dynamic to resolve synchronously in tests
vi.mock('next/dynamic', () => ({
    __esModule: true,
    default: (importCallback: any) => {
        const LazyComponent = (props: any) => {
            const [Component, setComponent] = React.useState<any>(null);
            React.useEffect(() => {
                importCallback().then((mod: any) => {
                    setComponent(() => mod.default || mod);
                });
            }, []);
            return Component ? <Component {...props} /> : null;
        };
        return LazyComponent;
    },
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Star: () => <div data-testid="icon-star" />,
    Trash2: () => <div data-testid="icon-trash" />,
    ExternalLink: () => <div data-testid="icon-external" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    MapPin: () => <div data-testid="icon-map-pin" />,
    Clock: () => <div data-testid="icon-clock" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Loader2: () => <div data-testid="icon-loader" />,
    CopyPlus: () => <div data-testid="icon-copy" />,
    Sparkles: () => <div data-testid="icon-sparkles" />,
    X: () => <div data-testid="icon-x" />,
    AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
    Shield: () => <div data-testid="icon-shield" />,
    User: () => <div data-testid="icon-user" />,
    FileText: () => <div data-testid="icon-file-text" />,
    Database: () => <div data-testid="icon-database" />,
}));


// Mock DeleteConfirmModal
vi.mock('./DeleteConfirmModal', () => ({
    DeleteConfirmModal: ({ isOpen, onConfirm, isDeleting }: any) =>
        isOpen ? (
            <div data-testid="delete-modal">
                <button onClick={onConfirm}>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</button>
            </div>
        ) : null,
}));

// Mock ClientOnly
vi.mock('@/components/ui/ClientOnly', () => ({
    ClientOnly: ({ children }: any) => <>{children}</>,
}));
const mockSession = {
    id: 'test-session-123',
    fullName: 'John Doe',
    status: 'complete',
    confidence: 'high',
    accuracy: 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthPlace: 'Mumbai',
    dateOfBirth: '1990-05-20',
    rectifiedTime: '10:30:00',
};

describe('SessionCard', () => {
    const mockOnDelete = vi.fn();
    const mockOnDuplicate = vi.fn();
    const mockOnFavorite = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Don't set global.fetch here - set in individual tests
    });

    it('triggers favorite action when star is clicked', () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onFavorite={mockOnFavorite}
            />
        );

        const favoriteBtn = screen.getByTestId('icon-star').closest('button');
        fireEvent.click(favoriteBtn!);

        expect(mockOnFavorite).toHaveBeenCalledWith(mockSession.id);
    });

    it('opens delete confirmation modal when delete is clicked', async () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDelete={mockOnDelete}
            />
        );

        const deleteBtn = screen.getByTestId('icon-trash').closest('button');
        fireEvent.click(deleteBtn!);

        await waitFor(() => {
            expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
        });
    });

    it('handles successful deletion', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });
        globalThis.fetch = fetchMock;

        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDelete={mockOnDelete}
            />
        );

        // Open modal
        fireEvent.click(screen.getByTestId('icon-trash').closest('button')!);

        // Wait for modal to appear and confirm
        const confirmBtn = await screen.findByText('Confirm Delete');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/test-session-123'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(mockOnDelete).toHaveBeenCalledWith(mockSession.id);
        });
    });
    it('handles successful duplication (clone)', async () => {
        // Mock clone API response + readiness check
        const fetchMock = global.fetch as any;
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: 'new-cloned-id' } }),
            })
            // Readiness check response
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: 'new-cloned-id' } }),
            });

        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDuplicate={mockOnDuplicate}
            />
        );

        const cloneBtn = screen.getByTestId('icon-copy').closest('button');
        fireEvent.click(cloneBtn!);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/test-session-123/clone'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(mockOnDuplicate).toHaveBeenCalledWith('new-cloned-id');
        });
    });

    it('renders session information correctly in list view', () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
            />
        );

        // Use getAllByText for fields that might appear in both mobile/desktop nodes
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getByText('Mumbai')).toBeInTheDocument();
        expect(screen.getByText('10:30:00')).toBeInTheDocument();
    });
});
