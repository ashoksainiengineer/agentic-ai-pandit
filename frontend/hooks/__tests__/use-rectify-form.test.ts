import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRectifyForm } from '../use-rectify-form';

const mockPush = vi.fn();
const mockGetToken = vi.fn().mockResolvedValue('mock-token');
const mockSearchParamsGet = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: (key: string) => mockSearchParamsGet(key),
    }),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: mockGetToken,
        userId: 'user-123',
    }),
}));

// Mock useWarmup
vi.mock('@/hooks/use-warmup', () => ({
    useWarmup: vi.fn(),
}));

// Mock useAutoSave
vi.mock('@/hooks/use-auto-save', () => ({
    useAutoSave: vi.fn(),
}));

// Mock config
vi.mock('@/lib/config', () => ({
    env: {
        api: { backendUrl: 'http://localhost:3001' },
    },
}));

// Mock analysis session readiness
vi.mock('@/lib/analysis-session-readiness', () => ({
    waitForAnalysisSessionReady: vi.fn().mockResolvedValue(true),
}));

// Mock secure-logger
vi.mock('@/lib/secure-logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('useRectifyForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockSearchParamsGet.mockReturnValue(null);
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should be importable and return expected shape', async () => {
        const { result } = renderHook(() => useRectifyForm());

        // Wait for initial loading to complete
        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current).toBeDefined();
        expect(typeof result.current.isLoading).toBe('boolean');
        expect(typeof result.current.isNewPerson).toBe('boolean');
        expect(result.current.step).toBe(1);
        expect(typeof result.current.setStep).toBe('function');
        expect(result.current.birthData).toBeDefined();
        expect(result.current.lifeEvents).toEqual([]);
        expect(typeof result.current.setLifeEvents).toBe('function');
        expect(result.current.spouseData).toBeDefined();
        expect(result.current.offsetConfig).toBeDefined();
        expect(typeof result.current.setOffsetConfig).toBe('function');
        expect(typeof result.current.isSubmitting).toBe('boolean');
        expect(result.current.error).toBeNull();
        expect(result.current.draftSessionId).toBeNull();
        expect(result.current.cloudSaveStatus).toBe('idle');
        expect(typeof result.current.draftLoaded).toBe('boolean');
        expect(result.current.maxUnlockedStep).toBe(1);
        expect(typeof result.current.validateStep1).toBe('function');
        expect(typeof result.current.validateStep3).toBe('function');
        expect(typeof result.current.handleNext).toBe('function');
        expect(typeof result.current.handleSubmit).toBe('function');
        expect(typeof result.current.updateBirthData).toBe('function');
        expect(typeof result.current.updateSpouseData).toBe('function');
        expect(typeof result.current.handleBack).toBe('function');
    });

    it('should initialize with default birth data', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.birthData.fullName).toBe('');
        expect(result.current.birthData.dateOfBirth).toBe('');
        expect(result.current.birthData.tentativeTime).toBe('');
        expect(result.current.birthData.birthPlace).toBe('');
        expect(result.current.birthData.latitude).toBe(0);
        expect(result.current.birthData.longitude).toBe(0);
        expect(result.current.birthData.timezone).toBe(5.5);
        expect(result.current.birthData.gender).toBe('male');
    });

    it('should update birth data via updateBirthData', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.updateBirthData({ fullName: 'John Doe' });
        });

        expect(result.current.birthData.fullName).toBe('John Doe');
    });

    it('should validate step 1 with errors when empty', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const validation = result.current.validateStep1();
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.progress).toBe(29); // gender+timezone default → 2/7 fields filled
    });

    it('should validate step 1 as valid when all fields filled', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.updateBirthData({
                fullName: 'John Doe',
                dateOfBirth: '1990-01-01',
                tentativeTime: '12:00',
                birthPlace: 'Delhi',
                latitude: 28.6139,
                longitude: 77.209,
                gender: 'male',
            });
        });

        const validation = result.current.validateStep1();
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
        expect(validation.progress).toBe(100);
    });

    it('should validate step 3 with errors when fewer than 3 life events', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const validation = result.current.validateStep3();
        expect(validation.isValid).toBe(false);
        expect(validation.errors[0]).toContain('Minimum 3 life events required');
    });

    it('should advance step via handleNext when validation passes', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.updateBirthData({
                fullName: 'John Doe',
                dateOfBirth: '1990-01-01',
                tentativeTime: '12:00',
                birthPlace: 'Delhi',
                latitude: 28.6139,
                longitude: 77.209,
                gender: 'male',
            });
        });

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.step).toBe(2);
        expect(result.current.maxUnlockedStep).toBe(2);
    });
    it('should not advance step via handleNext when validation fails', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.step).toBe(1);
        expect(result.current.error).not.toBeNull();
    });

    it('should go back via handleBack', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Move to step 2 first
        act(() => {
            result.current.updateBirthData({
                fullName: 'John Doe',
                dateOfBirth: '1990-01-01',
                tentativeTime: '12:00',
                birthPlace: 'Delhi',
                latitude: 28.6139,
                longitude: 77.209,
                gender: 'male',
            });
        });

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.step).toBe(2);

        act(() => {
            result.current.handleBack();
        });

        expect(result.current.step).toBe(1);
    });

    it('should not go back from step 1', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.handleBack();
        });

        expect(result.current.step).toBe(1);
    });

    it('should handle new person query param by resetting state', async () => {
        mockSearchParamsGet.mockImplementation((key: string) => {
            if (key === 'new') return 'true';
            return null;
        });

        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isNewPerson).toBe(true);
        expect(result.current.draftSessionId).toBeNull();
    });



    it('should update spouse data via updateSpouseData', async () => {
        const { result } = renderHook(() => useRectifyForm());

        act(() => {
            vi.advanceTimersByTime(200);
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.updateSpouseData({ latitude: 28.6 });
        });

        expect(result.current.spouseData.latitude).toBe(28.6);
    });
});
