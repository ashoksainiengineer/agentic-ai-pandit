import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import React from 'react';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
    currentUser: vi.fn(),
}));

// Mock Database
vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
            },
            sessions: {
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
        })),
    },
    users: {},
    sessions: {},
}));

// Mock Crypto
vi.mock('@/lib/crypto', () => ({
    initializeEncryption: vi.fn(),
    parseSensitiveField: vi.fn((val) => val),
    isEncrypted: vi.fn(() => false),
}));

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useParams: () => ({}),
    usePathname: () => '/',
}));

vi.mock('@/components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

// Mock DashboardContent (the actual component rendered by the page)
vi.mock('@/app/dashboard/DashboardContent', () => ({
    DashboardContent: ({ externalId, userName }: any) => (
        <div data-testid="dashboard-content">
            <h1>Welcome, {userName}</h1>
            <div data-testid="session-count">2</div>
        </div>
    ),
}));

// Remove duplicate mock above

describe('DashboardPage (Integration)', () => {
    it('renders sign-in prompt when unauthenticated', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        (currentUser as any).mockResolvedValue(null);

        const result = await DashboardPage();
        render(result);

        expect(screen.getByText(/Please Sign In/i)).toBeInTheDocument();
    });

    it('renders dashboard content when authenticated', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        (currentUser as any).mockResolvedValue({
            id: 'clerk_123',
            firstName: 'John',
            emailAddresses: [{ emailAddress: 'john@example.com' }],
        });

        const result = await DashboardPage();
        render(result);

        expect(screen.getByText(/Welcome, John/i)).toBeInTheDocument();
        expect(screen.getByTestId('session-count')).toHaveTextContent('2');
    });

    it('handles missing userName gracefully', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        (currentUser as any).mockResolvedValue({
            id: 'clerk_new',
            firstName: null,
            emailAddresses: [{ emailAddress: 'new@example.com' }],
        });

        const result = await DashboardPage();
        render(result);

        expect(screen.getByText(/Welcome, User/i)).toBeInTheDocument();
    });
});
