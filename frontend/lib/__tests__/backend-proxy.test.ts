import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({
    mockAuth: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: mockAuth,
}));

vi.mock('@/lib/config/env', () => ({
    env: {
        api: {
            backendUrl: 'https://api.example.com',
        },
    },
}));

import { proxyBackendJson } from '../server/backend-proxy.js';
import { NextRequest } from 'next/server';

function makeNextRequest(url = 'http://localhost/test'): NextRequest {
    return new NextRequest(url);
}

describe('backend-proxy - proxyBackendJson', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when userId is null', async () => {
        mockAuth.mockResolvedValue({ userId: null, getToken: vi.fn() });

        const req = makeNextRequest();
        const res = await proxyBackendJson(req, { path: '/test' });

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toBe('Unauthorized');
    });

    it('should return 401 when token is null', async () => {
        mockAuth.mockResolvedValue({ userId: 'user_1', getToken: vi.fn().mockResolvedValue(null) });

        const req = makeNextRequest();
        const res = await proxyBackendJson(req, { path: '/test' });

        expect(res.status).toBe(401);
    });

    it('should forward GET request to backend successfully', async () => {
        mockAuth.mockResolvedValue({
            userId: 'user_1',
            getToken: vi.fn().mockResolvedValue('test-token'),
        });
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: vi.fn().mockResolvedValue('{"success":true}'),
        } as unknown as Response);

        const req = makeNextRequest();
        const res = await proxyBackendJson(req, { path: '/api/data' });

        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBe('{"success":true}');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/api/data',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                }),
            })
        );
    });

    it('should forward POST request with body', async () => {
        mockAuth.mockResolvedValue({
            userId: 'user_1',
            getToken: vi.fn().mockResolvedValue('test-token'),
        });
        global.fetch = vi.fn().mockResolvedValue({
            status: 201,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: vi.fn().mockResolvedValue('{"id":"123"}'),
        } as unknown as Response);

        const req = makeNextRequest();
        const res = await proxyBackendJson(req, {
            method: 'POST',
            path: '/api/data',
            body: { name: 'test' },
        });

        expect(res.status).toBe(201);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/api/data',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'test' }),
            })
        );
    });

    it('should append search params to URL', async () => {
        mockAuth.mockResolvedValue({
            userId: 'user_1',
            getToken: vi.fn().mockResolvedValue('test-token'),
        });
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: vi.fn().mockResolvedValue('[]'),
        } as unknown as Response);

        const req = makeNextRequest();
        const params = new URLSearchParams({ page: '1', limit: '10' });
        await proxyBackendJson(req, { path: '/api/data', searchParams: params });

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/api/data?page=1&limit=10',
            expect.any(Object)
        );
    });

    it('should return 502 when backend is unreachable', async () => {
        mockAuth.mockResolvedValue({
            userId: 'user_1',
            getToken: vi.fn().mockResolvedValue('test-token'),
        });
        global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

        const req = makeNextRequest();
        const res = await proxyBackendJson(req, { path: '/api/data' });

        expect(res.status).toBe(502);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toContain('Backend unreachable');
    });

    it('should default to GET when method is not provided', async () => {
        mockAuth.mockResolvedValue({
            userId: 'user_1',
            getToken: vi.fn().mockResolvedValue('test-token'),
        });
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: vi.fn().mockResolvedValue('{}'),
        } as unknown as Response);

        const req = makeNextRequest();
        await proxyBackendJson(req, { path: '/api/data' });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ method: 'GET' })
        );
    });
});
