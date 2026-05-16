import { useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '@/lib/secure-logger';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
    userId: string | null | undefined;
    draftSessionId: string | null;
    dataString: string;
    lastSavedData: string;
    isSubmitting: boolean;
    getToken: () => Promise<string | null>;
    onSaveStatusChange: (status: SaveStatus) => void;
    onDraftSessionIdChange: (id: string | null) => void;
    onLastSavedDataChange: (data: string) => void;
    onLocalBackup: (data: Record<string, unknown>) => void;
}

/**
 * Custom hook for robust auto-save with retry, localStorage backup, and offline support.
 * Extracted from page.tsx to separate concerns and keep the component focused on UI.
 */
export function useAutoSave({
    userId,
    draftSessionId,
    dataString,
    lastSavedData,
    isSubmitting,
    getToken,
    onSaveStatusChange,
    onDraftSessionIdChange,
    onLastSavedDataChange,
    onLocalBackup,
}: UseAutoSaveOptions) {
    const saveRetryCount = useRef(0);
    const lastSaveAttemptRef = useRef<string>('');
    const pendingSaveRef = useRef<NodeJS.Timeout | null>(null);
    const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasData = useMemo(() => {
        try {
            const parsed = JSON.parse(dataString) as { birthData?: { fullName?: string } };
            return parsed.birthData?.fullName && parsed.birthData.fullName.trim().length >= 2;
        } catch {
            return false;
        }
    }, [dataString]);

    const saveToLocalStorage = useCallback(() => {
        try {
            const parsed = JSON.parse(dataString) as Record<string, unknown>;
            localStorage.setItem('btr_local_backup', JSON.stringify({
                ...parsed,
                savedAt: new Date().toISOString()
            }));
            onLocalBackup(parsed);
        } catch (e) {
            logger.warn('localStorage save failed', { error: String(e) });
        }
    }, [dataString, onLocalBackup]);

    useEffect(() => {
        // Only save if user has entered meaningful data
        if (!hasData || !userId || isSubmitting) return;
        
        // Skip if nothing changed
        if (dataString === lastSavedData) return;

        // Immediate localStorage backup
        saveToLocalStorage();

        // Clear pending save
        if (pendingSaveRef.current) {
            clearTimeout(pendingSaveRef.current);
        }

        const saveDraft = async (retryCount = 0): Promise<boolean> => {
            // Prevent duplicate save attempts
            if (lastSaveAttemptRef.current === dataString && retryCount === 0) {
                return false;
            }
            lastSaveAttemptRef.current = dataString;

            onSaveStatusChange('saving');

            try {
                const token = await getToken();
                if (!token) throw new Error('No auth token');
                
                const payload = JSON.parse(dataString);

                let success = false;

                if (!draftSessionId) {
                    // Create new session
                    const createRes = await fetch(`/api/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                    if (createRes.ok) {
                        const result = await createRes.json();
                        onDraftSessionIdChange(result.data.id);
                        localStorage.setItem('btr_draft_id', result.data.id);
                        success = true;
                    }
                } else {
                    // Update existing
                    const updateRes = await fetch(`/api/sessions/${draftSessionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });

                    // Existing draft became locked - drop stale reference
                    if (updateRes.status === 409) {
                        onDraftSessionIdChange(null);
                        localStorage.removeItem('btr_draft_id');
                        return true;
                    }

                    success = updateRes.ok;
                }

                if (success) {
                    onLastSavedDataChange(dataString);
                    onSaveStatusChange('saved');
                    saveRetryCount.current = 0;
                    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
                    statusTimeoutRef.current = setTimeout(() => onSaveStatusChange('idle'), 2000);
                    return true;
                } else {
                    throw new Error('Save failed');
                }
            } catch (err) {
                logger.error(`Auto-save failed (attempt ${retryCount + 1})`, err instanceof Error ? err : new Error(String(err)));

                // Retry logic: 3 attempts with exponential backoff
                if (retryCount < 3) {
                    const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                    return saveDraft(retryCount + 1);
                } else {
                    onSaveStatusChange('error');
                    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
                    statusTimeoutRef.current = setTimeout(() => onSaveStatusChange('idle'), 3000);
                    return false;
                }
            }
        };

        // Debounce: Save after 3 seconds of inactivity
        pendingSaveRef.current = setTimeout(() => {
            saveDraft();
        }, 3000);

        return () => {
            if (pendingSaveRef.current) {
                clearTimeout(pendingSaveRef.current);
            }
        };
    }, [hasData, userId, isSubmitting, dataString, lastSavedData, draftSessionId, getToken, onSaveStatusChange, onDraftSessionIdChange, onLastSavedDataChange, saveToLocalStorage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pendingSaveRef.current) {
                clearTimeout(pendingSaveRef.current);
            }
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, []);
}
