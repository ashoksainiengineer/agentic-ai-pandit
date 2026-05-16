'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import AnalysisErrorBoundary from '@/components/rectify/AnalysisErrorBoundary';
import RectifyPageSkeleton from '@/components/rectify/RectifyPageSkeleton';
import AutoSaveIndicator from '@/components/rectify/AutoSaveIndicator';
import RectifySubmitBar from '@/components/rectify/RectifySubmitBar';
import { SecurityBadge } from '@/components/rectify/SecurityBadge';
import { StepIndicator } from '@/components/rectify/StepIndicator';
import BirthDataForm from '@/components/rectify/BirthDataForm';
import LifeEventsEditor from '@/components/rectify/LifeEventsEditor';
import { useRectifyForm } from '@/hooks/use-rectify-form';

const Step3Review = dynamic(() => import('@/components/rectify/Step3Review'), {
    loading: () => <div className="animate-pulse bg-[var(--prism-canvas)] h-96 rounded-xl" />,
    ssr: false
});

function RectifyPageContent() {
    const form = useRectifyForm();

    if (form.isLoading || (!form.isNewPerson && !form.draftLoaded)) {
        return <RectifyPageSkeleton />;
    }

    return (
        <Layout hideFooter>
            <AnalysisErrorBoundary>
                <AutoSaveIndicator status={form.cloudSaveStatus} />

                <div className="pt-28 pb-24">
                    <SecurityBadge />
                    <StepIndicator step={form.step} totalSteps={3} labels={['Birth Details', 'Life Events', 'Review']} />
                    <div className="min-h-[400px]">
                        {form.step === 1 && (
                            <BirthDataForm
                                birthData={form.birthData}
                                offsetConfig={form.offsetConfig}
                                spouseData={form.spouseData}
                                onUpdateBirthData={form.updateBirthData}
                                onUpdateOffset={form.setOffsetConfig}
                                onUpdateSpouse={form.updateSpouseData}
                            />
                        )}
                        {form.step === 2 && (
                            <LifeEventsEditor
                                lifeEvents={form.lifeEvents}
                                offsetConfig={form.offsetConfig}
                                onUpdateEvents={form.setLifeEvents}
                            />
                        )}
                        {form.step === 3 && (
                            <Step3Review
                                data={form.birthData}
                                events={form.lifeEvents}
                                spouseData={form.spouseData}
                                onSubmit={form.handleSubmit}
                                isSubmitting={form.isSubmitting}
                                onEdit={form.setStep}
                                offsetConfig={form.offsetConfig}
                            />
                        )}
                    </div>

                    <RectifySubmitBar
                        step={form.step}
                        totalSteps={3}
                        isSubmitting={form.isSubmitting}
                        error={form.error}
                        onBack={form.handleBack}
                        onNext={form.handleNext}
                        onSubmit={form.handleSubmit}
                    />
                </div>
            </AnalysisErrorBoundary>
        </Layout>
    );
}

export default function RectifyPage() {
    return (
        <Suspense fallback={<RectifyPageSkeleton />}>
            <RectifyPageContent />
        </Suspense>
    );
}
