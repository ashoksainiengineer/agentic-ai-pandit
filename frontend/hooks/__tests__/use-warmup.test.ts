import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWarmup } from '../use-warmup';

// Mutable mock env
let mockWarmupEnabled = true;

// Mock env config (no Clerk auth needed — warmup is a public endpoint)
vi.mock('@/lib/config/env', () => ({
    env: {
        api: { backendUrl: 'http://localhost:3001' },
        get warmup() {
            return { enabled: mockWarmupEnabled };
        },
    },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('useWarmup', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.clearAllMocks();
        mockWarmupEnabled = true;
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    });

    afterEach(() => {
        vi.useRealTimers();
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('should be importable and return no values (hook has no return)', () => {
        const { result } = renderHook(() => useWarmup());
        expect(result.current).toBeUndefined();
    });

    it('should ping /api/warmup after 1s delay (no auth headers)', async () => {
        renderHook(() => useWarmup());

        expect(global.fetch).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/warmup',
            expect.objectContaining({
                method: 'GET',
                mode: 'cors',
            })
        );

        // Assert NO auth header is sent (warmup is public)
        const callArgs = (global.fetch as any).mock.calls[0][1];
        expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('should only warm up once across re-renders', async () => {
        const { rerender } = renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        rerender();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Still 1 call (didn't re-warm)
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not warm up when disabled', () => {
        mockWarmupEnabled = false;

        renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch failures gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it('should handle non-OK responses gracefully', async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, status: 429 });

        renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
