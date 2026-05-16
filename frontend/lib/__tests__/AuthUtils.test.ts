import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTokenWithRetry } from '../auth-utils';
import { logger } from '../secure-logger';

// Mock logger
vi.mock('../secure-logger', () => ({
    logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AuthUtils: getTokenWithRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return token immediately if valid', async () => {
        const getToken = vi.fn().mockResolvedValue('valid-token-longer-than-20-chars');
        const result = getTokenWithRetry(getToken);

        const token = await result;
        expect(token).toBe('valid-token-longer-than-20-chars');
        expect(getToken).toHaveBeenCalledTimes(1);
    });

    it('should retry if token is too short or null', async () => {
        const getToken = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('too-short')
            .mockResolvedValueOnce('valid-token-longer-than-20-chars-3');

        const resultPromise = getTokenWithRetry(getToken, {}, 5);

        // Wait for first attempt
        await vi.runAllTimersAsync();

        const token = await resultPromise;
        expect(token).toBe('valid-token-longer-than-20-chars-3');
        expect(getToken).toHaveBeenCalledTimes(3);
    });

    it('should retry if token is the string "null" or "undefined"', async () => {
        const getToken = vi.fn()
            .mockResolvedValueOnce('null')
            .mockResolvedValueOnce('undefined')
            .mockResolvedValueOnce('valid-token-longer-than-20-chars-abc');

        const resultPromise = getTokenWithRetry(getToken, {}, 5);
        await vi.runAllTimersAsync();

        const token = await resultPromise;
        expect(token).toBe('valid-token-longer-than-20-chars-abc');
        expect(getToken).toHaveBeenCalledTimes(3);
    });

    it('should implement exponential backoff', async () => {
        const getToken = vi.fn().mockResolvedValue(null);
        getTokenWithRetry(getToken, {}, 3);

        // 1st retry: ~100ms
        await vi.advanceTimersByTimeAsync(50);
        expect(getToken).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(100);
        expect(getToken).toHaveBeenCalledTimes(2);

        // 2nd retry: ~150ms (100 * 1.5)
        await vi.advanceTimersByTimeAsync(150);
        expect(getToken).toHaveBeenCalledTimes(3);
    });

    it('should fail after maxRetries', async () => {
        const getToken = vi.fn().mockResolvedValue(null);
        const resultPromise = getTokenWithRetry(getToken, {}, 3);

        await vi.runAllTimersAsync();

        const token = await resultPromise;
        expect(token).toBeNull();
        expect(getToken).toHaveBeenCalledTimes(3);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Maximum retries reached'));
    });

    it('should bypass retries in test environment', async () => {
        const getToken = vi.fn().mockResolvedValue(null);

        const token = await getTokenWithRetry(getToken, {}, undefined, true);
        expect(token).toBe('mock-token-123456789012345678901234567890');
        expect(getToken).not.toHaveBeenCalled();
    });
});
