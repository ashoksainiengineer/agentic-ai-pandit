'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStreamStore } from '@/lib/store/stream-store';
import { logger } from '@/lib/secure-logger';
import { cancelAnalysis, restartAnalysis } from '@/app/rectify/[id]/actions';

export function useAnalysisActions(sessionId: string) {
    const router = useRouter();
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = useCallback(async () => {
        if (isCancelling || cancelled) return;
        setIsCancelling(true);
        setError(null);
        try {
            const res = await cancelAnalysis(sessionId);
            if (res.success) {
                setCancelled(true);
                useStreamStore.getState().clearStore();
            } else {
                setError(`Failed to cancel: ${res.error || 'Unknown error'}`);
            }
        } catch (err: unknown) {
            logger.error('Cancel call failed', err);
            setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsCancelling(false);
            setShowCancelConfirm(false);
        }
    }, [sessionId, isCancelling, cancelled]);

    const handleRestart = useCallback(async () => {
        setIsCancelling(true);
        setError(null);
        try {
            const res = await restartAnalysis(sessionId);
            if (res.success) {
                useStreamStore.getState().clearStore();
                setCancelled(false);
                router.refresh();
            } else {
                setError(`Failed to restart: ${res.error}`);
            }
        } catch (err: unknown) {
            logger.error('Restart call failed', err instanceof Error ? err.message : String(err));
            setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId, router]);

    return {
        isCancelling,
        cancelled,
        showCancelConfirm,
        setShowCancelConfirm,
        setCancelled,
        handleCancel,
        handleRestart,
        error,
        clearError: () => setError(null),
    };
}
