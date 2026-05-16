'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { LifeEvent, TimeOffsetConfig } from '@/lib/types';

const Step2LifeEvents = dynamic(() => import('@/components/rectify/Step2LifeEvents'), {
    loading: () => <div className="animate-pulse bg-[var(--prism-canvas)] h-96 rounded-xl" />,
    ssr: false
});

interface LifeEventsEditorProps {
    lifeEvents: LifeEvent[];
    offsetConfig: TimeOffsetConfig;
    onUpdateEvents: (events: LifeEvent[]) => void;
}

export default function LifeEventsEditor({
    lifeEvents,
    offsetConfig,
    onUpdateEvents,
}: LifeEventsEditorProps) {
    return (
        <Step2LifeEvents
            lifeEvents={lifeEvents}
            updateEvents={onUpdateEvents}
            offsetConfig={offsetConfig}
        />
    );
}
