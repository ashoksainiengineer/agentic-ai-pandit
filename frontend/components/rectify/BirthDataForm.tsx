'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { BirthData, SpouseData, TimeOffsetConfig } from '@/lib/types';

const Step1BirthDetails = dynamic(() => import('@/components/rectify/Step1BirthDetails'), {
    loading: () => <div className="animate-pulse bg-[var(--prism-canvas)] h-96 rounded-xl" />,
    ssr: false
});

interface BirthDataFormProps {
    birthData: BirthData;
    offsetConfig: TimeOffsetConfig;
    spouseData: SpouseData;
    onUpdateBirthData: (updates: Partial<BirthData>) => void;
    onUpdateOffset: (config: TimeOffsetConfig) => void;
    onUpdateSpouse: (updates: Partial<SpouseData>) => void;
}

export default function BirthDataForm({
    birthData,
    offsetConfig,
    spouseData,
    onUpdateBirthData,
    onUpdateOffset,
    onUpdateSpouse,
}: BirthDataFormProps) {
    return (
        <Step1BirthDetails
            data={birthData}
            updateData={onUpdateBirthData}
            offsetConfig={offsetConfig}
            updateOffset={onUpdateOffset}
            spouseData={spouseData}
            updateSpouse={onUpdateSpouse}
        />
    );
}
