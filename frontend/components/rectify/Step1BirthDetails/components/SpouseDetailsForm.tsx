import React from 'react';
import { motion } from 'framer-motion';
import { FormField } from '@/components/ui/form/FormField';
import BirthPlacePicker from '../../BirthPlacePicker';
import { SpouseData } from '@/lib/types';
import { MONTHS, YEARS, HOURS, MINUTES, AM_PM_OPTIONS } from '../constants';

interface SpouseDetailsFormProps {
    showSpouse: boolean;
    setShowSpouse: (show: boolean) => void;
    spouseData?: SpouseData;
    spouseDobParts: { day: string; month: string; year: string; };
    spouseTimeParts: { hour: string; minute: string; period: 'AM' | 'PM'; };
    spouseAvailableDays: string[];
    handleSpouseDateChange: (part: 'day' | 'month' | 'year', val: string) => void;
    handleSpouseTimeChange: (part: 'hour' | 'minute' | 'period', val: string) => void;
    updateSpouse?: (updates: Partial<SpouseData>) => void;
}

export function SpouseDetailsForm({
    showSpouse,
    setShowSpouse,
    spouseData,
    spouseDobParts,
    spouseTimeParts,
    spouseAvailableDays,
    handleSpouseDateChange,
    handleSpouseTimeChange,
    updateSpouse
}: SpouseDetailsFormProps) {
    return (
        <>
            <button
                type="button"
                onClick={() => setShowSpouse(!showSpouse)}
                className="flex items-center justify-between w-full text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-xl">👩‍❤️‍👨</div>
                    <div>
                        <h4 className=" text-base font-medium text-black">Spouse Details <span className="text-black/60 font-normal text-xs">(Optional)</span></h4>
                        <p className="text-[10px] text-black/60">+15% precision boost</p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-xs transition-all ${showSpouse ? 'rotate-180 bg-[#000000] border-[#000000] text-white' : 'text-black'}`}>▼</div>
            </button>

            {showSpouse && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-4 pt-4 border-t border-[rgba(0,0,0,0.08)]"
                >
                    <FormField label="Spouse Date of Birth">
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                value={spouseDobParts.day}
                                onChange={(e) => handleSpouseDateChange('day', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm outline-none focus:border-[#000000]"
                            >
                                <option value="">Day</option>
                                {spouseAvailableDays.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select
                                value={spouseDobParts.month}
                                onChange={(e) => handleSpouseDateChange('month', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm outline-none focus:border-[#000000]"
                            >
                                <option value="">Month</option>
                                {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                            </select>
                            <select
                                value={spouseDobParts.year}
                                onChange={(e) => handleSpouseDateChange('year', e.target.value)}
                                className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm outline-none focus:border-[#000000]"
                            >
                                <option value="">Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Spouse Birth Time">
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                value={spouseTimeParts.hour}
                                onChange={(e) => handleSpouseTimeChange('hour', e.target.value)}
                                className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-black text-base text-center outline-none focus:border-[#000000]"
                            >
                                <option value="">HH</option>
                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-xl text-black">:</span>
                            <select
                                value={spouseTimeParts.minute}
                                onChange={(e) => handleSpouseTimeChange('minute', e.target.value)}
                                className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-black text-base text-center outline-none focus:border-[#000000]"
                            >
                                <option value="">MM</option>
                                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="flex bg-white rounded-lg overflow-hidden border border-[#E8E0D5] h-11">
                                {AM_PM_OPTIONS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleSpouseTimeChange('period', p as 'AM' | 'PM')}
                                        className={`px-4 font-medium text-sm transition-all ${spouseTimeParts.period === p ? 'bg-[#000000] text-white' : 'text-black/60 hover:text-black'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FormField>

                    <FormField label="Spouse Birth Place">
                        <BirthPlacePicker
                            birthPlace={spouseData?.birthPlace || ''}
                            latitude={spouseData?.latitude || 0}
                            longitude={spouseData?.longitude || 0}
                            timezone={spouseData?.timezone != null ? Number(spouseData.timezone) : 5.5}
                            onUpdate={(updates) => updateSpouse?.(updates)}
                        />
                    </FormField>
                </motion.div>
            )}
        </>
    );
}
