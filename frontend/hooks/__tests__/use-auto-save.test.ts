import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave, type SaveStatus } from '../use-auto-save';

// Mock secure-logger
vi.mock('@/lib/secure-logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('useAutoSave', () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token');
    const mockOnSaveStatusChange = vi.fn();
    const mockOnDraftSessionIdChange = vi.fn();
    const mockOnLastSavedDataChange = vi.fn();
    const mockOnLocalBackup = vi.fn();

    const defaultOptions = {
        userId: 'user-123',
        draftSessionId: null as string | null,
        dataString: JSON.stringify({ birthData: { fullName: 'Test User' } }),
        lastSavedData: '',
        isSubmitting: false,
        getToken: mockGetToken,
        onSaveStatusChange: mockOnSaveStatusChange,
        onDraftSessionIdChange: mockOnDraftSessionIdChange,
        onLastSavedDataChange: mockOnLastSavedDataChange,
        onLocalBackup: mockOnLocalBackup,
    };

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.clearAllMocks();
        global.fetch = vi.fn();
        localStorage.setItem = vi.fn();
        localStorage.removeItem = vi.fn();
        localStorage.getItem = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should be importable and return no values (hook has no return)', () => {
        const { result } = renderHook(() => useAutoSave(defaultOptions));
        expect(result.current).toBeUndefined();
    });

    it('should call onSaveStatusChange with saving then saved on successful create', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: 'new-draft-123' } }),
        });

        renderHook(() => useAutoSave(defaultOptions));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(mockOnSaveStatusChange).toHaveBeenCalledWith('saving');
        });

        await waitFor(() => {
            expect(mockOnSaveStatusChange).toHaveBeenCalledWith('saved');
        });

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/sessions',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer mock-token',
                }),
            })
        );
    });

    it('should update existing draft when draftSessionId is provided', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
        });

        const options = {
            ...defaultOptions,
            draftSessionId: 'draft-456',
        };

        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/sessions/draft-456',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token',
                    }),
                })
            );
        });
    });

    it('should clear draft session id on 409 conflict', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 409,
        });

        const options = {
            ...defaultOptions,
            draftSessionId: 'draft-456',
        };

        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(mockOnDraftSessionIdChange).toHaveBeenCalledWith(null);
        });
    });

    it('should not save when userId is missing', () => {
        const options = { ...defaultOptions, userId: null };
        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not save when isSubmitting is true', () => {
        const options = { ...defaultOptions, isSubmitting: true };
        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not save when data has not changed', () => {
        const options = {
            ...defaultOptions,
            lastSavedData: defaultOptions.dataString,
        };
        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not save when data lacks meaningful birthData.fullName', () => {
        const options = {
            ...defaultOptions,
            dataString: JSON.stringify({ birthData: { fullName: '' } }),
        };
        renderHook(() => useAutoSave(options));

        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should attempt save and enter error state on persistent failure', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        renderHook(() => useAutoSave(defaultOptions));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // After initial attempt fails, backoffs are scheduled (1s, 2s, 4s)
        // Run all pending timers to flush retries
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // Should have called 'saving' at least once, and eventually 'error'
        expect(mockOnSaveStatusChange).toHaveBeenCalledWith('saving');
        expect(mockOnSaveStatusChange).toHaveBeenCalledWith('error');
        expect(global.fetch).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should save to localStorage as backup', () => {
        renderHook(() => useAutoSave(defaultOptions));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(localStorage.setItem).toHaveBeenCalledWith(
            'btr_local_backup',
            expect.stringContaining('Test User')
        );
    });
});
