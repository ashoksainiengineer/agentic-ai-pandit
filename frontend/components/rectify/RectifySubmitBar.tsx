'use client';

import React from 'react';

interface RectifySubmitBarProps {
    step: number;
    totalSteps: number;
    isSubmitting: boolean;
    error: string | null;
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export default function RectifySubmitBar({
    step,
    totalSteps,
    isSubmitting,
    error,
    onBack,
    onNext,
    onSubmit: _onSubmit,
}: RectifySubmitBarProps) {
    return (
        <>
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-black/[0.08]">
                <button
                    onClick={onBack}
                    disabled={step === 1}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${step === 1 ? 'opacity-0 pointer-events-none' : 'border border-black/[0.12] text-black/60 hover:bg-black/5 hover:text-black'}`}
                >
                    ← Back
                </button>
                {step < totalSteps && (
                    <button
                        onClick={onNext}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-black/85 transition-all duration-200 disabled:opacity-50"
                    >
                        Next Step →
                    </button>
                )}
            </div>
        </>
    );
}
