'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FormCard } from '@/components/ui/form/FormCard';
import { Step1Props } from './types';
import { useBirthDetails } from './hooks/useBirthDetails';
import { Header } from './components/Header';
import { PrimaryDetailsForm } from './components/PrimaryDetailsForm';
import { SpouseDetailsForm } from './components/SpouseDetailsForm';

export default function Step1BirthDetailsIndex(props: Step1Props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const engine = useBirthDetails(props);

    if (!isMounted) return null;

    return (
        <motion.div
            className="space-y-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Header />

            <FormCard className="space-y-5 p-5 md:p-6">
                <PrimaryDetailsForm
                    data={props.data}
                    dobParts={engine.dobParts}
                    timeParts={engine.timeParts}
                    availableDays={engine.availableDays}
                    errors={engine.errors}
                    selectedOffset={engine.selectedOffset}
                    customOffset={engine.customOffset}
                    handleNameChange={engine.handleNameChange}
                    handleDateChange={engine.handleDateChange}
                    handleTimeChange={engine.handleTimeChange}
                    handleOffsetChange={engine.handleOffsetChange}
                    handleCustomOffsetChange={engine.handleCustomOffsetChange}
                    handlePlaceChange={engine.handlePlaceChange}
                    updateData={props.updateData}
                />
            </FormCard>

            <FormCard variant="subtle" className="p-5">
                <SpouseDetailsForm
                    showSpouse={engine.showSpouse}
                    setShowSpouse={engine.setShowSpouse}
                    spouseData={props.spouseData}
                    spouseDobParts={engine.spouseDobParts}
                    spouseTimeParts={engine.spouseTimeParts}
                    spouseAvailableDays={engine.spouseAvailableDays}
                    handleSpouseDateChange={engine.handleSpouseDateChange}
                    handleSpouseTimeChange={engine.handleSpouseTimeChange}
                    updateSpouse={props.updateSpouse}
                />
            </FormCard>
        </motion.div>
    );
}
