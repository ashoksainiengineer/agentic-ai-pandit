import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAuth,
  mockFindFirst,
  mockInsertValues,
  mockResolveSessionOwnershipContext,
  mockBuildOwnedSessionWhereClause,
} = vi.hoisted(() => {
  const auth = vi.fn(async () => ({ userId: 'clerk_test_user' }));
  const findFirst = vi.fn();
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const resolveSessionOwnershipContext = vi.fn();
  const buildOwnedSessionWhereClause = vi.fn(() => ({ owned: true }));

  return {
    mockAuth: auth,
    mockFindFirst: findFirst,
    mockInsertValues: insertValues,
    mockResolveSessionOwnershipContext: resolveSessionOwnershipContext,
    mockBuildOwnedSessionWhereClause: buildOwnedSessionWhereClause,
  };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

vi.mock('crypto', () => {
    const mod = {
        randomUUID: vi.fn(() => 'new-session-id-123'),
    };
    return {
        default: mod,
        ...mod,
    };
});

vi.mock('@ai-pandit/db', () => ({
  db: {
    query: {
      sessions: {
        findFirst: mockFindFirst,
      },
    },
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
  },
}));

vi.mock('@/lib/server/session-ownership', () => ({
  resolveSessionOwnershipContext: mockResolveSessionOwnershipContext,
  buildOwnedSessionWhereClause: mockBuildOwnedSessionWhereClause,
}));

import { POST } from '@/app/api/sessions/[id]/clone/route';

describe('POST /api/sessions/[id]/clone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveSessionOwnershipContext.mockResolvedValue({
      externalId: 'clerk_test_user',
      internalUserId: 'user_internal_1',
    });
  });

  it('returns 404 when source session is not found', async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const res = await POST({} as any, { params: Promise.resolve({ id: 'missing-session' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Session not found');
  });

  it('clones using canonical ownership ids', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'original-session',
      userId: 'legacy-user-id',
      externalId: 'legacy-clerk-id',
      fullName: 'enc-name',
      dateOfBirth: 'enc-dob',
      tentativeTime: 'enc-time',
      birthPlace: 'enc-place',
      latitude: 12.34,
      longitude: 56.78,
      timezone: '5.5',
      gender: 'male',
      lifeEvents: 'enc-events',
      spouseData: 'enc-spouse',
      offsetConfig: 'enc-offset',
      isEncrypted: true,
    });

    const res = await POST({} as any, { params: Promise.resolve({ id: 'original-session' }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('new-session-id-123');
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-session-id-123',
      externalId: 'legacy-clerk-id',
      userId: 'legacy-user-id',
      status: 'draft',
      analysisResult: null,
    }));
  });
});
