'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BirthData, LifeEvent, SpouseData } from '@/lib/types';
import { env } from '@/lib/config';
import { useStreamStore } from '@/lib/store/stream-store';
import { waitForAnalysisSessionReady } from '@/lib/analysis-session-readiness';
import { logger } from '@/lib/secure-logger';

import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step2LifeEvents from '@/components/rectify/Step2LifeEvents';
import Step3Review from '@/components/rectify/Step3Review';
import Layout from '@/components/Layout';

import { SecurityBadge } from '@/components/rectify/SecurityBadge';
import { StepIndicator } from '@/components/rectify/StepIndicator';
import RectifySubmitBar from '@/components/rectify/RectifySubmitBar';
import { useWarmup } from '@/hooks/use-warmup';
export interface EditSessionClientProps {
    sessionId: string;
    initialData: {
        birthData: BirthData;
        lifeEvents: LifeEvent[];
        spouseData?: SpouseData;
        offsetConfig?: Record<string, unknown>;
    };
}

export function EditSessionClient({ sessionId, initialData }: EditSessionClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getInitialStep = () => {
        const urlStep = searchParams.get('step');
        if (urlStep) {
            const parsed = parseInt(urlStep, 10);
            if (parsed >= 1 && parsed <= 3) return parsed;
        }
        return 1;
    };

    const [step, setStep] = useState(getInitialStep);
    const [_maxUnlockedStep, setMaxUnlockedStep] = useState(getInitialStep);
    const [birthData, setBirthData] = useState<BirthData | null>(initialData.birthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>(initialData.lifeEvents || []);
    const [offsetConfig, setOffsetConfig] = useState<Record<string, unknown>>(initialData.offsetConfig || { preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [spouseData, setSpouseData] = useState<SpouseData>(initialData.spouseData || {
        dateOfBirth: '',
        birthTime: '',
        latitude: 0,
        longitude: 0,
        timezone: 5.5
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    useWarmup(); // Pre-warm backend for faster analysis start

    const { getToken } = useAuth();

    const toErrorMessage = (value: unknown, fallback: string): string => {
        if (typeof value === 'string' && value.trim()) return value;
        if (value instanceof Error && value.message.trim()) return value.message;
        if (value && typeof value === 'object') {
            const candidate = (value as { message?: unknown; error?: unknown }).message
                ?? (value as { message?: unknown; error?: unknown }).error;
            if (typeof candidate === 'string' && candidate.trim()) return candidate;
        }
        return fallback;
    };

    const updateStep = (newStep: number) => {
        setStep(newStep);
        const urlParams = new URLSearchParams(searchParams.toString());
        urlParams.set('step', newStep.toString());
        router.replace(`/rectify/${sessionId}/edit?${urlParams.toString()}`, { scroll: false });
    };

    // Auto-save effect with debounce
    const [lastSavedData, setLastSavedData] = useState<string>(JSON.stringify(initialData));
    const statusTimerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!birthData || !birthData.fullName || birthData.fullName.trim().length < 2) return;
        if (isSubmitting) return;

        const currentData = JSON.stringify({ birthData, lifeEvents, spouseData, offsetConfig });
        if (currentData === lastSavedData) return;

        const saveDraft = async () => {
            setSavingStatus('saving');
            try {
                const token = await getToken();
                const saveRes = await fetch(`/api/sessions/${sessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        birthData,
                        lifeEvents,
                        spouseData,
                        offsetConfig
                    })
                });

                if (saveRes.status === 409) {
                    setSavingStatus('error');
                    setError('Session is locked and cannot be auto-saved. Please submit to re-analyze.');
                    return;
                }

                if (!saveRes.ok) {
                    throw new Error(`Save failed with status ${saveRes.status}`);
                }

                setLastSavedData(currentData);
                setSavingStatus('saved');
                if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
                statusTimerRef.current = setTimeout(() => setSavingStatus('idle'), 2000);
            } catch (err) {
                logger.error('Auto-save failed', err instanceof Error ? err : new Error(String(err)));
                setSavingStatus('error');
            }
        };

        const timer = setTimeout(saveDraft, 3000);
        return () => { clearTimeout(timer); if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); } };
    }, [birthData, lifeEvents, spouseData, offsetConfig, sessionId, lastSavedData, getToken, isSubmitting]);

    const advanceToNextStep = () => {
        setError(null);
        if (validateStep(step)) {
            const newStep = step + 1;
            window.scrollTo(0, 0);
            setMaxUnlockedStep(prev => Math.max(prev, newStep));
            updateStep(newStep);
        }
    };

    const goToPreviousStep = () => {
        setError(null);
        const newStep = step - 1;
        updateStep(newStep);
        window.scrollTo(0, 0);
    };

    const validateStep = (currentStep: number) => {
        if (!birthData) return false;
        switch (currentStep) {
            case 1:
                if (!birthData.fullName || birthData.fullName.trim().length < 2) {
                    setError('Full Name must be at least 2 characters');
                    return false;
                }
                if (!birthData.dateOfBirth) {
                    setError('Date of Birth is required');
                    return false;
                }
                if (!birthData.tentativeTime) {
                    setError('Birth Time is required');
                    return false;
                }
                if (!birthData.birthPlace?.trim()) {
                    setError('Birth Place is required');
                    return false;
                }
                // Coordinates must be explicitly set (not default 0,0)
                if (birthData.birthPlace?.trim() && !birthData.latitude && !birthData.longitude) {
                    setError('Please select a valid location from the search results to set coordinates');
                    return false;
                }
                if (birthData.timezone === undefined || birthData.timezone === null) {
                    setError('Timezone is required (select a location to auto-fill)');
                    return false;
                }
                if (!birthData.gender) {
                    setError('Gender is required');
                    return false;
                }
                return true;
            case 2:
                if (lifeEvents.length < 3) {
                    setError('Please add at least 3 life events. Currently: ' + lifeEvents.length);
                    return false;
                }
                // Ensure all events have valid dates
                const invalidEvent = lifeEvents.find(e => !e.eventDate);
                if (invalidEvent) {
                    setError('All life events must have a valid date');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const submitEditedSession = async () => {
        if (!birthData) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();

            const updateRes = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    spouseData,
                    offsetConfig
                })
            });

            // 409 means session is locked for direct edit; continue to requeue path.
            if (!updateRes.ok && updateRes.status !== 409) {
                let updateError = 'Failed to update session';
                try {
                    const updateResult = await updateRes.json();
                    updateError = toErrorMessage(updateResult?.error, updateError);
                } catch {
                    // Keep default fallback when non-JSON error body is returned.
                }
                setError(updateError);
                setIsSubmitting(false);
                return;
            }

            const backendUrl = env.api.backendUrl.replace(/\/$/, '');
            try {
                const requeueRes = await fetch('/api/analysis/requeue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ sessionId })
                });
                const requeueResult = await requeueRes.json();
                if (!requeueResult?.success) {
                    setError(toErrorMessage(requeueResult?.error, 'Failed to restart analysis'));
                    setIsSubmitting(false);
                    return;
                }

                const isReady = await waitForAnalysisSessionReady(backendUrl, sessionId, getToken);
                if (!isReady) {
                    setError('Analysis session is still initializing. Please retry in a few seconds.');
                    setIsSubmitting(false);
                    return;
                }
            } catch (err: unknown) {
                setError(toErrorMessage(err, 'Failed to restart analysis'));
                setIsSubmitting(false);
                return;
            }

            // CRITICAL: Clear stale Zustand store before navigating to analysis page.
            // Without this, localStorage-persisted state (isComplete, empty candidatesByStage)
            // from the previous analysis rehydrates and causes empty containers.
            useStreamStore.getState().clearStore();

            router.push(`/rectify/${sessionId}`);

        } catch (err: unknown) {
            setError(toErrorMessage(err, 'Network error'));
            setIsSubmitting(false);
        }
    };

    return (
        <Layout hideFooter>
            <main className="min-h-screen bg-[#FAF8F5] text-[#1A1A1E] pt-16">
                <nav className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-xl border-b border-[rgba(0,0,0,0.06)]">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="font-medium text-xl text-[#1A1A1E] tracking-tight">AI Pandit</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-[#6B6560] hover:text-[#1A1A1E] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <div className="flex items-center gap-2 text-sm">
                                {savingStatus === 'saving' && <span className="text-[#1A1A1E] animate-pulse">Saving...</span>}
                                {savingStatus === 'saved' && <span className="text-[#184131]">Saved</span>}
                                {savingStatus === 'error' && <span className="text-[#D64545]">Save Failed</span>}
                                <span className="text-[#1A1A1E] font-medium opacity-50">|</span>
                                <span className="text-[#1A1A1E] font-medium">Editing Session</span>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Edit header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-medium text-[#1A1A1E] mb-2">Edit &amp; Re-analyze</h1>
                        <p className="text-[#6B6560]">Update your details and run a new analysis</p>
                    </div>

                    <SecurityBadge />

                    {/* Progress stepper */}
                    <StepIndicator
                        step={step}
                        totalSteps={3}
                        labels={['Birth Details', 'Life Events', 'Review']}
                    />

                    <div className="min-h-[400px]">
                        {step === 1 && birthData && (
                            <Step1BirthDetails
                                data={birthData}
                                updateData={(updates: Partial<import('@/lib/types').BirthData>) => setBirthData(prev => prev ? { ...prev, ...updates } : updates as import('@/lib/types').BirthData)}
                                offsetConfig={offsetConfig}
                                updateOffset={(config) => setOffsetConfig(config as Record<string, unknown>)}
                                spouseData={spouseData}
                                updateSpouse={(updates: Partial<SpouseData>) => setSpouseData(prev => ({ ...prev, ...updates }))}
                            />
                        )}
                        {step === 2 && (
                            <Step2LifeEvents
                                lifeEvents={lifeEvents}
                                updateEvents={setLifeEvents}
                                offsetConfig={offsetConfig}
                            />
                        )}
                        {step === 3 && birthData && (
                            <Step3Review
                                data={birthData}
                                events={lifeEvents}
                                spouseData={spouseData}
                                onSubmit={submitEditedSession}
                                isSubmitting={isSubmitting}
                                onEdit={updateStep}
                                offsetConfig={offsetConfig}
                            />
                        )}
                    </div>

                    {step < 3 && (
                        <RectifySubmitBar
                            step={step}
                            totalSteps={3}
                            isSubmitting={isSubmitting}
                            error={error}
                            onBack={goToPreviousStep}
                            onNext={advanceToNextStep}
                            onSubmit={submitEditedSession}
                        />
                    )}
                </div>
            </main>
        </Layout>
    );
}
