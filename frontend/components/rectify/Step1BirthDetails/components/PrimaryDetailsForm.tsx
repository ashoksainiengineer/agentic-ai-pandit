import React from 'react';
import { FormField } from '@/components/ui/form/FormField';
import BirthPlacePicker from '../../BirthPlacePicker';
import { BirthData } from '@/lib/types';
import { MONTHS, YEARS, HOURS, MINUTES, AM_PM_OPTIONS, GENDER_OPTIONS, OFFSET_PRESETS } from '../constants';
import type { OffsetPreset } from '@/lib/types';

interface PrimaryDetailsFormProps {
    data: BirthData;
    dobParts: { day: string; month: string; year: string; };
    timeParts: { hour: string; minute: string; period: 'AM' | 'PM'; };
    availableDays: string[];
    errors: Record<string, string>;
    selectedOffset: string;
    customOffset: number;
    handleNameChange: (val: string) => void;
    handleDateChange: (part: 'day' | 'month' | 'year', val: string) => void;
    handleTimeChange: (part: 'hour' | 'minute' | 'period', val: string) => void;
    handleOffsetChange: (val: OffsetPreset) => void;
    handleCustomOffsetChange: (val: string) => void;
    handlePlaceChange: (updates: Record<string, unknown>) => void;
    updateData: (updates: Partial<BirthData>) => void;
}

export function PrimaryDetailsForm({
    data,
    dobParts,
    timeParts,
    availableDays,
    errors,
    selectedOffset,
    customOffset,
    handleNameChange,
    handleDateChange,
    handleTimeChange,
    handleOffsetChange,
    handleCustomOffsetChange,
    handlePlaceChange,
    updateData
}: PrimaryDetailsFormProps) {
    return (
        <>
            {/* Full Name - Compact */}
            <FormField label="Full Name" required error={errors.fullName}>
                <input
                    type="text"
                    value={data.fullName || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm placeholder-[#959595] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none transition-all"
                    maxLength={100}
                />
            </FormField>

            {/* Date of Birth - Compact */}
            <FormField
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
                description="Select your birth date"
            >
                <div className="grid grid-cols-3 gap-2">
                    <select
                        value={dobParts.day}
                        onChange={(e) => handleDateChange('day', e.target.value)}
                        className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm focus:border-[#000000] outline-none cursor-pointer"
                    >
                        <option value="">Day</option>
                        {availableDays.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={dobParts.month}
                        onChange={(e) => handleDateChange('month', e.target.value)}
                        className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm focus:border-[#000000] outline-none cursor-pointer"
                    >
                        <option value="">Month</option>
                        {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <select
                        value={dobParts.year}
                        onChange={(e) => handleDateChange('year', e.target.value)}
                        className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm focus:border-[#000000] outline-none cursor-pointer"
                    >
                        <option value="">Year</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </FormField>

            {/* Time of Birth - Compact */}
            <FormField
                label="Approximate Birth Time"
                required
                error={errors.tentativeTime}
                description="Don't worry if it's not exact"
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={timeParts.hour}
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-black text-base text-center focus:border-[#000000] outline-none"
                    >
                        <option value="">HH</option>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-xl text-black">:</span>
                    <select
                        value={timeParts.minute}
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-black text-base text-center focus:border-[#000000] outline-none"
                    >
                        <option value="">MM</option>
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex bg-white rounded-lg overflow-hidden border border-[#E8E0D5] h-11">
                        {AM_PM_OPTIONS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleTimeChange('period', p)}
                                className={`px-4 font-medium text-sm transition-all ${timeParts.period === p ? 'bg-[#000000] text-white' : 'text-black/60 hover:text-black'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </FormField>

            {/* Birth Time Window (Offset) - Compact */}
            <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
                <FormField
                    label="Birth Time Window"
                    description="How uncertain is this time?"
                >
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {OFFSET_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleOffsetChange(preset.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedOffset === preset.value
                                        ? 'bg-[#000000] text-white border-[#000000]'
                                        : 'bg-white text-black/60 border-[#E8E0D5] hover:border-[#000000]/50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {selectedOffset === 'custom' && (
                            <div
                                className="flex items-center gap-3 bg-[#ffffff] p-3 rounded-lg border border-[#E8E0D5] animate-fade-in-up"
                            >
                                <label className="text-sm text-black font-medium whitespace-nowrap">
                                    Unknown by ±
                                </label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        min="1"
                                        max="720"
                                        value={customOffset}
                                        onChange={(e) => handleCustomOffsetChange(e.target.value)}
                                        className="w-full h-9 px-2 text-center bg-white border border-[#E8E0D5] rounded-md text-black focus:border-[#000000] outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black/60 pointer-events-none">
                                        min
                                    </span>
                                </div>
                                <span className="text-xs text-black/60">
                                    (Max 720 mins)
                                </span>
                            </div>
                        )}
                    </div>
                </FormField>
            </div>

            {/* Birth Place */}
            <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
                <FormField label="Birth Place" required error={errors.birthPlace}>
                    <BirthPlacePicker
                        birthPlace={data.birthPlace}
                        latitude={data.latitude}
                        longitude={data.longitude}
                        timezone={data.timezone}
                        onUpdate={handlePlaceChange}
                    />
                </FormField>
            </div>

            {/* Gender - Compact */}
            <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
                <FormField label="Gender" required>
                    <div className="grid grid-cols-3 gap-3">
                        {GENDER_OPTIONS.map((g) => (
                            <button
                                key={g.value}
                                type="button"
                                onClick={() => updateData({ gender: g.value })}
                                className={`p-4 rounded-xl text-center transition-all border ${data.gender === g.value ? 'bg-[#000000]/10 border-[#000000] shadow-sm' : 'bg-white border-[#E8E0D5] hover:border-[#000000]/50'}`}
                            >
                                <span className="text-2xl mb-1 block">{g.icon}</span>
                                <div className="text-xs text-black font-medium">{g.label}</div>
                            </button>
                        ))}
                    </div>
                </FormField>
            </div>
        </>
    );
}
