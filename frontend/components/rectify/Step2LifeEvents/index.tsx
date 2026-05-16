'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step2Props } from './types';
import { useLifeEvents } from './hooks/useLifeEvents';
import { Header } from './components/Header';
import { EventEditor } from './components/EventEditor';
import { EventTimeline } from './components/EventTimeline';
import { EmptyState } from './components/EmptyState';
import { FormCard } from '@/components/ui/form/FormCard';
import EventSelector from '@/components/events/EventSelector';
import CustomEventModal from '@/components/events/CustomEventModal';
import WhyEventsMatter from '../WhyEventsMatter';

export default function Step2LifeEventsIndex(props: Step2Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const engine = useLifeEvents(props);

    if (!mounted) return null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Header />

            <WhyEventsMatter
                currentEventCount={props.lifeEvents.length}
                categoriesCovered={new Set(props.lifeEvents.map(e => e.category)).size}
            />

            <AnimatePresence mode="wait">
                {engine.editingEvent && engine.editingEventData ? (
                    <EventEditor
                        editingEvent={engine.editingEvent}
                        editingEventData={engine.editingEventData}
                        allCategories={engine.allCategories}
                        errors={engine.errors}
                        setErrors={engine.setErrors}
                        updateEvent={engine.updateEvent}
                        setEditingId={engine.setEditingId}
                        deleteEvent={engine.deleteEvent}
                        updateEventDatePrecision={engine.updateEventDatePrecision}
                    />
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <FormCard className="p-5">
                            <EventSelector
                                existingEvents={props.lifeEvents}
                                onSelectEvent={engine.addLifeEventToTimeline}
                                onCreateCustom={(categoryId?: string) => {
                                    engine.setPreselectedCategoryId(categoryId || '');
                                    engine.setIsCustomModalOpen(true);
                                }}
                            />
                        </FormCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <EventTimeline
                sortedEvents={engine.sortedEvents}
                accuracy={engine.accuracy}
                allCategories={engine.allCategories}
                setEditingId={engine.setEditingId}
            />

            <EmptyState isVisible={engine.sortedEvents.length === 0 && !engine.editingId} />

            <CustomEventModal
                isOpen={engine.isCustomModalOpen}
                onClose={() => engine.setIsCustomModalOpen(false)}
                categories={engine.allCategories}
                onCreateEvent={engine.createCustomLifeEvent}
                preselectedCategoryId={engine.preselectedCategoryId}
            />
        </div>
    );
}
