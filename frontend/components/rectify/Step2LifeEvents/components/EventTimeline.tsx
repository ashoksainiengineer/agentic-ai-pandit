'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LifeEvent } from '@/lib/types';
import { FormCard } from '@/components/ui/form/FormCard';
import { IMPORTANCE_OPTIONS, EventCategory } from '@/lib/events/types';
import { getCategoryById } from '@/lib/events/utils';
import { formatEventDate, parseDateParts, getMonthName, getAccuracyLabel, isValidDateString } from '../utils';
import { Calendar, Clock } from 'lucide-react';

interface EventTimelineProps {
    sortedEvents: LifeEvent[];
    accuracy: number;
    allCategories: EventCategory[];
    setEditingId: (id: string | null) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryColor(categories: EventCategory[], categoryId: string): string {
    const cat = getCategoryById(categories, categoryId);
    return cat?.color || '#184131';
}

function getCategoryIcon(categories: EventCategory[], categoryId: string): string {
    const cat = getCategoryById(categories, categoryId);
    return cat?.icon || '📅';
}

function getEventDecade(event: LifeEvent): number | null {
    if (!event.eventDate || !isValidDateString(event.eventDate)) return null;
    const year = parseInt(parseDateParts(event.eventDate).year, 10);
    if (isNaN(year)) return null;
    return Math.floor(year / 10) * 10;
}

function formatTimelineDate(event: LifeEvent): { primary: string; secondary: string; hasTime: boolean } {
    if (!event.eventDate || !isValidDateString(event.eventDate)) {
        return { primary: '—', secondary: '', hasTime: false };
    }
    const { year, month, day } = parseDateParts(event.eventDate);
    const mon = getMonthName(month);
    const hasTime = !!event.eventTime;

    if (event.datePrecision === 'exact_date' || event.datePrecision === 'exact_date_time') {
        return {
            primary: day && mon ? `${day} ${mon}` : year,
            secondary: year,
            hasTime,
        };
    }
    if (event.datePrecision === 'month_year') {
        return {
            primary: mon ? `${mon}` : year,
            secondary: year,
            hasTime: false,
        };
    }
    return { primary: year, secondary: '', hasTime: false };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventTimeline({
    sortedEvents,
    accuracy,
    allCategories,
    setEditingId,
}: EventTimelineProps) {
    const accuracyInfo = useMemo(() => getAccuracyLabel(accuracy), [accuracy]);

    const eventsWithDividers = useMemo(() => {
        const result: Array<{ event: LifeEvent; showDivider: boolean; decadeLabel: string | null }> = [];
        let lastDecade: number | null = null;

        sortedEvents.forEach((event, i) => {
            const decade = getEventDecade(event);
            const showDivider = i > 0 && decade !== null && lastDecade !== null && decade !== lastDecade;
            const decadeLabel = showDivider ? `${decade}s` : null;
            result.push({ event, showDivider, decadeLabel });
            if (decade !== null) lastDecade = decade;
        });

        return result;
    }, [sortedEvents]);

    const categoriesCovered = useMemo(
        () => new Set(sortedEvents.map(e => e.category)).size,
        [sortedEvents]
    );

    if (sortedEvents.length === 0) return null;

    const importanceConfig = IMPORTANCE_OPTIONS;

    return (
        <FormCard className="p-6">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-black">
                    📜 Your Life Timeline
                </h3>
                <span className="text-xs text-black/40 bg-black/[0.04] px-2.5 py-1 rounded-full font-medium">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Compact Accuracy Bar ────────────────────────────────────────── */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">{accuracyInfo.emoji}</span>
                        <span className="text-xs font-semibold text-black/70">
                            {accuracyInfo.label} Accuracy
                        </span>
                    </div>
                    <span className="text-xs font-bold text-black tabular-nums">{accuracy}%</span>
                </div>
                <div className="w-full h-1 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-[#184131]"
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-[10px] text-black/35 mt-1.5">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} · {categoriesCovered} categor{categoriesCovered !== 1 ? 'ies' : 'y'} · {accuracyInfo.precision} precision
                </p>
            </div>

            {/* ── Timeline ─────────────────────────────────────────────────────── */}
            <div className="relative">
                {/* Vertical timeline line — matches StepIndicator style: w-1, gray, rounded */}
                <div className="absolute left-[17px] top-1 bottom-1 w-1 bg-[rgba(0,0,0,0.08)] rounded-full" />

                <div className="space-y-1">
                    {eventsWithDividers.map(({ event, showDivider, decadeLabel }, index) => {
                        const catColor = getCategoryColor(allCategories, event.category);
                        const catIcon = getCategoryIcon(allCategories, event.category);
                        const isCritical = event.importance === 'critical';
                        const dateInfo = formatTimelineDate(event);

                        return (
                            <React.Fragment key={event.id}>
                                {/* ── Decade divider ──────────────────────────── */}
                                {showDivider && decadeLabel && (
                                    <div className="flex items-center my-3 pl-10">
                                        <span className="text-[10px] font-semibold text-black/25 uppercase tracking-[0.15em]">
                                            {decadeLabel}
                                        </span>
                                        <div className="flex-1 ml-3 border-t border-dashed border-black/[0.06]" />
                                    </div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.06,
                                        duration: 0.35,
                                        ease: 'easeOut',
                                    }}
                                    className="flex gap-4 group"
                                >
                                    {/* ── Date column ────────────────────────── */}
                                    <div className="w-[72px] flex-shrink-0 text-right pt-1">
                                        <div className="text-xs font-semibold text-black/60 leading-tight">
                                            {dateInfo.primary}
                                        </div>
                                        {dateInfo.secondary && (
                                            <div className="text-[10px] text-black/30 leading-tight">
                                                {dateInfo.secondary}
                                            </div>
                                        )}
                                        {dateInfo.hasTime && event.eventTime && (
                                            <div className="text-[10px] text-black/30 mt-0.5 flex items-center justify-end gap-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                {event.eventTime}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Timeline dot + line segment ────────── */}
                                    <div className="relative flex-shrink-0 flex flex-col items-center">
                                        {/* Dot — StepIndicator style: rounded-full, border-2 */}
                                        <div
                                            className={`rounded-full border-2 border-white transition-all mt-0.5 ${
                                                isCritical ? 'w-4 h-4' : 'w-3.5 h-3.5'
                                            }`}
                                            style={{
                                                backgroundColor: catColor,
                                                boxShadow: isCritical
                                                    ? `0 0 0 2px ${catColor}20`
                                                    : `0 0 0 1px ${catColor}10`,
                                            }}
                                        />
                                    </div>

                                    {/* ── Event card ─────────────────────────── */}
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(event.id)}
                                        className="flex-1 text-left p-3.5 rounded-xl border border-transparent hover:border-black/[0.06] hover:bg-black/[0.02] transition-all duration-200"
                                    >
                                        {/* Icon + Title + Badges */}
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-lg flex-shrink-0">
                                                {catIcon}
                                            </span>
                                            <span className="text-sm font-semibold text-black">
                                                {event.eventType}
                                            </span>
                                            {event.isCustom && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.04] text-black/45 font-medium flex-shrink-0">
                                                    Custom
                                                </span>
                                            )}
                                            {event.importance && (
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                                                        event.importance === 'critical'
                                                            ? 'bg-[#C65D3B]/10 text-[#C65D3B]'
                                                            : event.importance === 'high'
                                                                ? 'bg-black/[0.06] text-black/70'
                                                                : event.importance === 'medium'
                                                                    ? 'bg-[#184131]/8 text-[#184131]'
                                                                    : 'bg-black/[0.04] text-black/40'
                                                    }`}
                                                >
                                                    {importanceConfig.find((i) => i.level === event.importance)?.icon}
                                                </span>
                                            )}
                                        </div>

                                        {/* Date display row */}
                                        <div className="flex items-center gap-1.5 mt-1.5 ml-[30px]">
                                            <Calendar className="w-3 h-3 text-black/25 flex-shrink-0" />
                                            <span className="text-xs text-black/45">
                                                {formatEventDate(event)}
                                            </span>
                                            {event.datePrecision && (
                                                <span className="text-[10px] text-black/25">
                                                    · {event.datePrecision === 'exact_date_time'
                                                        ? 'Exact time'
                                                        : event.datePrecision === 'exact_date'
                                                            ? 'Exact date'
                                                            : event.datePrecision === 'month_year'
                                                                ? 'Month/Year'
                                                                : event.datePrecision}
                                                </span>
                                            )}
                                        </div>

                                        {/* Description — always visible */}
                                        {event.description && (
                                            <p className="text-xs text-black/50 leading-relaxed mt-1.5 ml-[30px] line-clamp-3">
                                                {event.description}
                                            </p>
                                        )}
                                    </button>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}

                    {/* ── Present marker ────────────────────────────────────── */}
                    <div className="flex gap-4 pl-0">
                        <div className="w-[72px] flex-shrink-0" />
                        <div className="relative flex-shrink-0 flex flex-col items-center">
                            {/* Hollow dashed dot for Present */}
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-black/20 bg-transparent mt-0.5" />
                        </div>
                        <div className="flex-1 py-1.5">
                            <span className="text-xs font-medium text-black/30">
                                Present
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </FormCard>
    );
}
