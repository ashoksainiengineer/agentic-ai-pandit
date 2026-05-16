import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useClipboard', () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
        Object.assign(navigator, { clipboard: originalClipboard });
        document.execCommand = originalExecCommand;
    });

    it('should copy text using navigator.clipboard if available', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(true);
        Object.assign(navigator, {
            clipboard: {
                writeText: mockWriteText,
            },
        });

        const { result } = renderHook(() => useClipboard());

        await act(async () => {
            const success = await result.current.copyToClipboard('test text');
            expect(success).toBe(true);
        });

        expect(mockWriteText).toHaveBeenCalledWith('test text');
        expect(result.current.hasCopied).toBe(true);
        expect(result.current.error).toBeNull();

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(result.current.hasCopied).toBe(false);
    });

    it('should fallback to document.execCommand if navigator.clipboard fails', async () => {
        // Mock navigator.clipboard to throw
        const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard API failed'));
        Object.assign(navigator, {
            clipboard: {
                writeText: mockWriteText,
            },
        });

        // Mock execCommand
        const mockExecCommand = vi.fn().mockReturnValue(true);
        document.execCommand = mockExecCommand;

        const { result } = renderHook(() => useClipboard());

        await act(async () => {
            const success = await result.current.copyToClipboard('fallback text');
            expect(success).toBe(true);
        });

        expect(mockWriteText).toHaveBeenCalledWith('fallback text');
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
        expect(result.current.hasCopied).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('should return false and set error if both methods fail', async () => {
        // Mock navigator.clipboard to throw
        const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard API failed'));
        Object.assign(navigator, {
            clipboard: {
                writeText: mockWriteText,
            },
        });

        // Mock execCommand to fail
        const mockExecCommand = vi.fn().mockReturnValue(false);
        document.execCommand = mockExecCommand;

        const { result } = renderHook(() => useClipboard());

        await act(async () => {
            const success = await result.current.copyToClipboard('fail text');
            expect(success).toBe(false);
        });

        expect(result.current.hasCopied).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Fallback copy command failed');
    });
});
