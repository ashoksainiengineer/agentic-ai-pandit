/**
 * 🔱 EXHAUSTIVE DEBOUNCE UTILITY TESTS
 * Tests debounce with cancel, flush, and timer behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../debounce.js';

describe('Debounce - Basic Behavior', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not call function immediately', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();
    });

    it('should call function after delay', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('hello', 42);
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledWith('hello', 42);
    });

    it('should reset timer on rapid calls (only last call fires)', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('first');
        vi.advanceTimersByTime(50);
        debounced('second');
        vi.advanceTimersByTime(50);
        debounced('third');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('third');
    });

    it('should fire multiple times if delay elapses between calls', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('first');
        vi.advanceTimersByTime(100);
        debounced('second');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('Debounce - Cancel', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should prevent execution when cancelled', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced.cancel();
        vi.advanceTimersByTime(200);

        expect(fn).not.toHaveBeenCalled();
    });

    it('should allow new calls after cancel', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('first');
        debounced.cancel();
        debounced('second');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('second');
    });
});

describe('Debounce - Flush', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should execute immediately when flushed', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced.flush('immediate');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('immediate');
    });

    it('should cancel pending timer when flushed', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced('pending');
        debounced.flush('flushed');
        vi.advanceTimersByTime(200);

        // Only flush call should fire, not the pending one
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('flushed');
    });
});

describe('Debounce - Edge Cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should handle zero delay', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 0);

        debounced();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid-fire 100 calls (only last executes)', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        for (let i = 0; i < 100; i++) {
            debounced(i);
        }
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(99);
    });
});
