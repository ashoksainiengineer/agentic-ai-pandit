import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindFirst } = vi.hoisted(() => ({
    mockFindFirst: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: 'clerk_favorite_user' })),
}));

vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            sessions: {
                findFirst: mockFindFirst,
            },
        },
    },
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: {
        id: 'id',
        externalId: 'externalId',
    },
}));

vi.mock('drizzle-orm', () => ({
    and: vi.fn((...args: unknown[]) => args),
    eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/lib/server/favorite-store', () => ({
    setFavorite: vi.fn((_externalId: string, _sessionId: string, value: boolean) => value),
    toggleFavorite: vi.fn(() => true),
}));

import { POST } from '@/app/api/sessions/[id]/favorite/route';

function makeRequest(body?: Record<string, unknown>): any {
    return {
        json: async () => body ?? {},
    } as unknown as Request;
}

describe('POST /api/sessions/[id]/favorite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 404 when session is not owned by user', async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'sess_404' }) });
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.success).toBe(false);
    });

    it('should toggle favorite when no explicit value is sent', async () => {
        mockFindFirst.mockResolvedValueOnce({ id: 'sess_1' });

        const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'sess_1' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.isFavorite).toBe(true);
    });

    it('should honor explicit isFavorite boolean in request body', async () => {
        mockFindFirst.mockResolvedValueOnce({ id: 'sess_2' });

        const res = await POST(makeRequest({ isFavorite: false }), { params: Promise.resolve({ id: 'sess_2' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.isFavorite).toBe(false);
    });
});
