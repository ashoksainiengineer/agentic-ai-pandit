import React from 'react';
import { motion } from 'framer-motion';
import { FormField } from '@/components/ui/form/FormField';
import DateInput from '@/components/events/DateInput';
import { EventCategory, IMPORTANCE_OPTIONS } from '@/lib/events/types';
import { getCategoryById } from '@/lib/events/utils';
import { isPrecisionSatisfied, type DatePrecision as DatePrecisionUtil } from '@/lib/date-utils';
import { LifeEvent } from '@/lib/types';
import { DatePrecision } from '../types';
import { DATE_OPTIONS } from '../constants';

interface EventEditorProps {
    editingEvent: LifeEvent;
    editingEventData: Record<string, unknown>;
    allCategories: EventCategory[];
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateEvent: (id: string, updates: Partial<LifeEvent>) => void;
    setEditingId: (id: string | null) => void;
    deleteEvent: (id: string) => void;
    updateEventDatePrecision: (id: string, precision: DatePrecision) => void;
}

export function EventEditor({
    editingEvent,
    editingEventData,
    allCategories,
    errors,
    setErrors,
    updateEvent,
    setEditingId,
    deleteEvent,
    updateEventDatePrecision
}: EventEditorProps) {
    if (!editingEvent || !editingEventData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-2 border-[#000000] rounded-xl overflow-hidden shadow-lg"
        >
            {/* Event Editor Header */}
            <div className="bg-gradient-to-r from-[#000000]/10 to-[#ffffff] px-5 py-4 flex items-center justify-between border-b border-[#000000]/20">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{editingEvent.icon}</span>
                    <div>
                        <h2 className=" text-xl font-medium text-black">
                            {editingEvent.eventType}
                        </h2>
                        <p className="text-xs text-black/60">
                            {getCategoryById(allCategories, editingEvent.category)?.label}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(() => {
                        const hasEventType = !!editingEvent.eventType?.trim();
                        const isDateSatisfied = isPrecisionSatisfied(
                            editingEvent.datePrecision as DatePrecisionUtil,
                            editingEvent.eventDate,
                            editingEvent.endDate,
                            editingEvent.eventTime
                        );
                        const hasSignificance = !!editingEvent.importance;
                        const hasDescription = !!editingEvent.description?.trim() && editingEvent.description.trim().length >= 10;
                        const isFormComplete = hasEventType && isDateSatisfied && hasSignificance && hasDescription;

                        return (
                            <button
                                onClick={() => setEditingId(null)}
                                disabled={!isFormComplete}
                                className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors ${isFormComplete
                                    ? 'bg-[#184131] text-white hover:bg-[#236B4F]'
                                    : 'bg-[#184131]/30 text-white/50 cursor-not-allowed'
                                    }`}
                                title={!isFormComplete ? 'Please fill all required fields' : 'Save event'}
                            >
                                ✓ Save
                            </button>
                        );
                    })()}
                    <button
                        onClick={() => deleteEvent(editingEvent.id)}
                        className="px-4 py-2 border-2 border-[#C65D3B] text-[#C65D3B] rounded-lg hover:bg-[#C65D3B]/10 font-medium text-sm transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Event Editor Body */}
            <div className="p-5 space-y-4">
                {editingEvent.isCustom && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Event Name" required>
                            <input
                                type="text"
                                value={editingEvent.eventType}
                                onChange={(e) => updateEvent(editingEvent.id, { eventType: e.target.value })}
                                className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-black focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none transition-all"
                                placeholder="e.g. Graduation"
                            />
                        </FormField>

                        <FormField label="Category">
                            <select
                                value={editingEvent.category}
                                onChange={(e) => updateEvent(editingEvent.id, { category: e.target.value })}
                                className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-black focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none cursor-pointer appearance-none"
                            >
                                {allCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                )}

                <FormField label="When did this happen?">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {DATE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateEventDatePrecision(editingEvent.id, opt.value)}
                                className={`py-3 px-2 rounded-lg text-center transition-all border ${editingEvent.datePrecision === opt.value
                                    ? 'bg-[#000000] text-white border-[#000000] shadow-md'
                                    : 'bg-white border-[#E8E0D5] text-black/60 hover:border-[#000000] hover:bg-[#ffffff]'
                                    }`}
                            >
                                <div className="font-medium text-[10px] leading-tight">{opt.label}</div>
                                <div className={`text-[9px] mt-1 ${editingEvent.datePrecision === opt.value ? 'text-white/80' : 'text-black/60'}`}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </FormField>

                <DateInput
                    precision={editingEvent.datePrecision as DatePrecisionUtil}
                    eventDate={editingEvent.eventDate}
                    endDate={editingEvent.endDate}
                    eventTime={editingEvent.eventTime}
                    onUpdate={(updates) => updateEvent(editingEvent.id, updates)}
                />

                <FormField label="How significant was this event?" required>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {IMPORTANCE_OPTIONS.map((opt) => {
                            const isSelected = editingEvent.importance === opt.level;
                            return (
                                <button
                                    key={opt.level}
                                    onClick={() => updateEvent(editingEvent.id, { importance: opt.level })}
                                    className={`p-3 rounded-lg text-left transition-all border ${isSelected
                                        ? 'bg-[#000000]/10 border-[#000000]'
                                        : 'bg-white border-[#E8E0D5] hover:border-[#000000]/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-base">{opt.icon}</span>
                                        <span className={`font-medium text-xs ${isSelected ? 'text-black' : 'text-black/60'}`}>
                                            {opt.label}
                                        </span>
                                    </div>
                                    <div className={`text-[10px] ${isSelected ? 'text-black' : 'text-black/60'}`}>
                                        {opt.desc}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </FormField>

                <FormField
                    label="Describe your experience"
                    required
                    error={errors.description}
                >
                    <textarea
                        value={editingEvent.description || ''}
                        onChange={(e) => {
                            updateEvent(editingEvent.id, { description: e.target.value });
                            if (errors.description) {
                                setErrors(prev => ({ ...prev, description: '' }));
                            }
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                        }}
                        placeholder="What happened? How did you feel?..."
                        className={`w-full h-24 p-4 bg-white border-2 rounded-lg text-sm text-black placeholder-[#959595] resize-none focus:ring-2 outline-none transition-all ${editingEvent.description && editingEvent.description.length >= 10
                            ? 'border-[#184131]/50 focus:border-[#184131]'
                            : 'border-[#C65D3B]/50 focus:border-[#C65D3B]'
                            }`}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-black/30">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            <span>Encrypted</span>
                        </div>
                        <div className={`text-[10px] ${(editingEvent.description?.length || 0) < 10 ? 'text-[#C65D3B]' : 'text-black/60'}`}>
                            {editingEvent.description?.length || 0} / 1000 chars (min 10)
                        </div>
                    </div>
                </FormField>
            </div>
        </motion.div>
    );
}
