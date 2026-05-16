'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import type { BirthData, LifeEvent, TimeOffsetConfig, SpouseData } from '@/lib/types';
import { useWarmup } from '@/hooks/use-warmup';
import { useAutoSave } from '@/hooks/use-auto-save';
import { env } from '@/lib/config';
import { waitForAnalysisSessionReady } from '@/lib/analysis-session-readiness';
import { logger } from '@/lib/secure-logger';

const initialBirthData: BirthData = {
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5,
    gender: 'male'
};


const initialSpouseData: SpouseData = {
    dateOfBirth: '',
    birthTime: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5
};

export interface StepValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    progress: number;
}

const FRONTEND_MUTABLE_SESSION_STATUSES = new Set(['draft', 'failed', 'pending']);

function canMutateSessionInForm(status: unknown): boolean {
    return typeof status === 'string' && FRONTEND_MUTABLE_SESSION_STATUSES.has(status);
}

export function useRectifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isNewPerson = searchParams.get('new') === 'true';
    const draftIdFromUrl = searchParams.get('draft_id');
    const { getToken, userId } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [birthData, setBirthData] = useState<BirthData>(initialBirthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [spouseData, setSpouseData] = useState<SpouseData>(initialSpouseData);
    const [offsetConfig, setOffsetConfig] = useState<TimeOffsetConfig>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
    const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedData, setLastSavedData] = useState<string>('');
    const [draftLoaded, setDraftLoaded] = useState(false);
    // ════════════════════════════════════════════
    // Navigation state
    // ════════════════════════════════════════════
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);

    useWarmup();

    const toErrorMessage = useCallback((value: unknown, fallback: string): string => {
        if (typeof value === 'string' && value.trim()) return value;
        if (value instanceof Error && value.message.trim()) return value.message;
        if (value && typeof value === 'object') {
            const asRecord = value as { message?: unknown; error?: unknown };
            if (typeof asRecord.message === 'string' && asRecord.message.trim()) return asRecord.message;
            if (typeof asRecord.error === 'string' && asRecord.error.trim()) return asRecord.error;
            if (asRecord.error && typeof asRecord.error === 'object') {
                const nestedMessage = (asRecord.error as { message?: unknown }).message;
                if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
            }
        }
        return fallback;
    }, []);

    useEffect(() => {
        if (isNewPerson) {
            localStorage.removeItem('btr_draft_id');
            setDraftSessionId(null);
            setBirthData(initialBirthData);
            setLifeEvents([]);
            setSpouseData(initialSpouseData);
            setStep(1);
            setMaxUnlockedStep(1);
            setOffsetConfig({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
            setError(null);
            setDraftLoaded(true);
        }
    }, [isNewPerson]);

    const validateStep1 = useCallback((): StepValidation => {
        const errors: string[] = [];
        let filledFields = 0;
        const totalFields = 7;

        if (!birthData.fullName || birthData.fullName.trim().length < 2) errors.push("Full Name must be at least 2 characters"); else filledFields++;
        if (!birthData.dateOfBirth) errors.push("Date of Birth is required"); else filledFields++;
        if (!birthData.tentativeTime) errors.push("Tentative Birth Time is required"); else filledFields++;
        if (!birthData.birthPlace?.trim()) errors.push("Birth Place is required"); else filledFields++;
        if (!birthData.gender) errors.push("Gender is required"); else filledFields++;
        // Coordinates must be explicitly set (not default 0,0 with empty place)
        if (birthData.birthPlace?.trim() && !birthData.latitude && !birthData.longitude) {
            errors.push("Please select a valid location from the search results to set coordinates");
        } else if (birthData.birthPlace?.trim()) {
            filledFields++;
        }
        if (birthData.timezone === undefined || birthData.timezone === null) {
            errors.push("Timezone is required (select a location to auto-fill)");
        } else {
            filledFields++;
        }

        return { isValid: errors.length === 0, errors, warnings: [], progress: Math.round((filledFields / totalFields) * 100) };
    }, [birthData]);


    const validateStep3 = useCallback((): StepValidation => {
        const errors: string[] = [];
        if (lifeEvents.length < 3) errors.push(`Minimum 3 life events required. Currently: ${lifeEvents.length}`);

        const invalidEvents = lifeEvents.filter(e => !e.eventDate || e.eventDate.trim() === '');
        if (invalidEvents.length > 0) {
            errors.push(`Please set dates for ${invalidEvents.length} event(s).`);
        }

        return { isValid: errors.length === 0, errors, warnings: [], progress: lifeEvents.length >= 3 ? 100 : Math.round((lifeEvents.length / 3) * 100) };
    }, [lifeEvents]);

    const validateAllSteps = useCallback((): { isValid: boolean; errors: string[] } => {
        const allErrors: string[] = [];
        if (!validateStep1().isValid) allErrors.push('Step 1: Birth details are incomplete.');
        if (!validateStep3().isValid) allErrors.push('Step 3: Life events are incomplete.');
        return { isValid: allErrors.length === 0, errors: allErrors };
    }, [validateStep1, validateStep3]);

    const handleNext = useCallback(() => {
        if (isSubmitting) return;
        if (step >= 3) { setError('Already at the last step'); return; }

        if (step === 1) {
            const v = validateStep1();
            if (!v.isValid) { setError(v.errors.join(', ')); return; }
        } else if (step === 2) {
            const v = validateStep3();
            if (!v.isValid) { setError(v.errors.join(', ')); return; }
        }

        const nextStep = step + 1;
        setMaxUnlockedStep(prev => Math.max(prev, nextStep));
        setStep(nextStep);
        setError(null);
        window.scrollTo(0, 0);
    }, [step, isSubmitting, validateStep1, validateStep3]);

    const handleSubmit = useCallback(async () => {
        const fullValidation = validateAllSteps();
        if (!fullValidation.isValid) {
            setError(fullValidation.errors.join('. '));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');

            const payload = {
                birthData,
                lifeEvents,
                spouseData,
                offsetConfig,
                consentConfirmed: true
            };

            let result: { success?: boolean; error?: unknown; data?: { sessionId?: string }; sessionId?: string };
            if (draftSessionId) {
                const updateRes = await fetch(`/api/sessions/${draftSessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ birthData, lifeEvents, spouseData, offsetConfig })
                });
                if (!updateRes.ok && updateRes.status !== 409) {
                    let updateError = 'Failed to save latest draft';
                    try {
                        const updateJson = await updateRes.json();
                        updateError = toErrorMessage(updateJson?.error, updateError);
                    } catch {
                        // Keep default error if response body is not JSON.
                    }
                    throw new Error(updateError);
                }

                const requeueRes = await fetch('/api/analysis/requeue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ sessionId: draftSessionId })
                });
                result = await requeueRes.json();
            } else {
                const queueRes = await fetch('/api/analysis/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                result = await queueRes.json();
            }

            if (!result?.success) {
                throw new Error(toErrorMessage(result?.error, 'Failed to start analysis'));
            }
            localStorage.removeItem('btr_draft_id');

            const newSessionId = result.data?.sessionId || result.sessionId || draftSessionId;
            if (!newSessionId) {
                throw new Error('Analysis session ID was not returned');
            }

            const isReady = await waitForAnalysisSessionReady(backendUrl, newSessionId, getToken);
            if (!isReady) {
                throw new Error('Analysis session is still initializing. Please try again in a few seconds.');
            }

            router.push(`/rectify/${newSessionId}`);

        } catch (err: unknown) {
            setError(toErrorMessage(err, 'An unexpected error occurred. Please try again.'));
            setIsSubmitting(false);
        }
    }, [toErrorMessage, validateAllSteps, getToken, draftSessionId, birthData, lifeEvents, spouseData, offsetConfig, router]);

    const updateBirthData = useCallback((updates: Partial<BirthData>) => {
        setBirthData(prev => ({ ...prev, ...updates }));
    }, []);


    const updateSpouseData = useCallback((updates: Partial<SpouseData>) => {
        setSpouseData(prev => ({ ...prev, ...updates }));
    }, []);


    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
            window.scrollTo(0, 0);
        }
    }, [step]);

    useEffect(() => {
        if (isNewPerson) {
            setIsLoading(false);
            setDraftLoaded(true);
            return;
        }
        const savedDraftId = draftIdFromUrl || localStorage.getItem('btr_draft_id');
        if (!savedDraftId) {
            setDraftLoaded(true);
        }
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
    }, [isNewPerson, draftIdFromUrl]);

    const currentDataString = useMemo(() =>
        JSON.stringify({ birthData, lifeEvents, spouseData, offsetConfig }),
        [birthData, lifeEvents, spouseData, offsetConfig]
    );

    useAutoSave({
        userId,
        draftSessionId,
        dataString: currentDataString,
        lastSavedData,
        isSubmitting,
        getToken,
        onSaveStatusChange: setCloudSaveStatus,
        onDraftSessionIdChange: setDraftSessionId,
        onLastSavedDataChange: setLastSavedData,
        onLocalBackup: () => {},
    });

    useEffect(() => {
        const loadDraft = async () => {
            const savedDraftId = draftIdFromUrl || localStorage.getItem('btr_draft_id');
            if (!savedDraftId) {
                setDraftLoaded(true);
                return;
            }

            try {
                const token = await getToken();
                const res = await fetch(`/api/sessions/${savedDraftId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success && result.data) {
                        const session = result.data;
                        const canMutateLoadedSession = canMutateSessionInForm(session.status);

                        if (canMutateLoadedSession) {
                            setDraftSessionId(savedDraftId);
                            localStorage.setItem('btr_draft_id', savedDraftId);
                        } else {
                            setDraftSessionId(null);
                            localStorage.removeItem('btr_draft_id');
                        }

                        if (session.birthData) setBirthData(session.birthData);
                        if (session.lifeEvents && Array.isArray(session.lifeEvents)) setLifeEvents(session.lifeEvents);
                        if (session.spouseData) setSpouseData(session.spouseData);

                        if (session.offsetConfig) {
                            try {
                                setOffsetConfig(typeof session.offsetConfig === 'string'
                                    ? JSON.parse(session.offsetConfig)
                                    : session.offsetConfig as TimeOffsetConfig);
                            } catch {
                                logger.warn('Failed to parse offsetConfig from draft, using default');
                                setOffsetConfig({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
                            }
                        }

                        setLastSavedData(JSON.stringify({
                            birthData: session.birthData,
                            lifeEvents: session.lifeEvents,
                            spouseData: session.spouseData,
                            offsetConfig: session.offsetConfig
                        }));

                        setDraftLoaded(true);
                        logger.info('Draft loaded successfully', { draftId: savedDraftId });
                    }
                }
            } catch (err) {
                logger.error('Failed to load draft', err instanceof Error ? err : new Error(String(err)));
                setDraftLoaded(true);
            }
        };

        if (!isNewPerson) {
            loadDraft();
        }
    }, [getToken, draftIdFromUrl, isNewPerson]);

    return {
        isLoading,
        isNewPerson,
        step,
        setStep,
        birthData,
        lifeEvents,
        setLifeEvents,
        spouseData,
        offsetConfig,
        setOffsetConfig,
        isSubmitting,
        error,
        draftSessionId,
        cloudSaveStatus,
        draftLoaded,
        maxUnlockedStep,
        validateStep1,
        validateStep3,
        handleNext,
        handleSubmit,
        updateBirthData,
        updateSpouseData,
        handleBack,
    };
}
