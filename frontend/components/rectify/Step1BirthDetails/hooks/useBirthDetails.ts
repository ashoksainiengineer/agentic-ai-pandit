import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { OffsetPreset } from '@/lib/types';
import { Step1Props } from '../types';
import { OFFSET_PRESETS } from '../constants';
import { getDaysForMonth, isValidDate, convertTo24Hour, parseTimeToParts, sanitizeInput } from '../utils';

function parseDateParts(dateStr: string | undefined): { day: string; month: string; year: string } {
    if (!dateStr) return { day: '', month: '', year: '' };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { day: '', month: '', year: '' };
    return { year: parts[0], month: parts[1], day: parts[2] };
}

export function useBirthDetails({
    data,
    updateData,
    offsetConfig,
    updateOffset,
    spouseData,
    updateSpouse
}: Step1Props) {
    const [showSpouse, setShowSpouse] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const isUpdatingFromParent = useRef(false);

    // Date of birth parts - sync from external data changes
    const [dobParts, setDobParts] = useState(() => parseDateParts(data.dateOfBirth));

    useEffect(() => {
        const parts = parseDateParts(data.dateOfBirth);
        setDobParts(prev => {
            if (prev.day === parts.day && prev.month === parts.month && prev.year === parts.year) return prev;
            return parts;
        });
    }, [data.dateOfBirth]);

    // Time parts
    const [timeParts, setTimeParts] = useState(() => parseTimeToParts(data.tentativeTime));

    useEffect(() => {
        isUpdatingFromParent.current = true;
        setTimeParts(parseTimeToParts(data.tentativeTime));
        isUpdatingFromParent.current = false;
    }, [data.tentativeTime]);

    // Offset state
    const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
    const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 60);

    useEffect(() => {
        if (offsetConfig?.preset) setSelectedOffset(offsetConfig.preset);
        if (offsetConfig?.customMinutes !== undefined) setCustomOffset(offsetConfig.customMinutes);
    }, [offsetConfig?.preset, offsetConfig?.customMinutes]);

    // Spouse date parts - sync from external data
    const [spouseDobParts, setSpouseDobParts] = useState(() => parseDateParts(spouseData?.dateOfBirth));

    useEffect(() => {
        const parts = parseDateParts(spouseData?.dateOfBirth);
        setSpouseDobParts(prev => {
            if (prev.day === parts.day && prev.month === parts.month && prev.year === parts.year) return prev;
            return parts;
        });
    }, [spouseData?.dateOfBirth]);

    // Spouse time parts
    const [spouseTimeParts, setSpouseTimeParts] = useState(() => parseTimeToParts(spouseData?.birthTime));

    useEffect(() => {
        setSpouseTimeParts(parseTimeToParts(spouseData?.birthTime));
    }, [spouseData?.birthTime]);

    const availableDays = useMemo(() =>
        getDaysForMonth(dobParts.month, dobParts.year),
        [dobParts.month, dobParts.year]
    );

    const spouseAvailableDays = useMemo(() =>
        getDaysForMonth(spouseDobParts.month, spouseDobParts.year),
        [spouseDobParts.month, spouseDobParts.year]
    );

    // Validation - checks ALL fields regardless of touched state
    const errors = useMemo(() => {
        const newErrors: Record<string, string> = {};

        // Full Name (show error if touched OR if there's partial content to correct)
        if (touched.fullName || data.fullName) {
            if (!data.fullName?.trim()) {
                newErrors.fullName = 'Full name is required';
            } else if (data.fullName.trim().length < 2) {
                newErrors.fullName = 'Name must be at least 2 characters';
            }
        }

        // Date of Birth
        if (touched.dateOfBirth || dobParts.day || dobParts.month || dobParts.year) {
            if (!dobParts.day || !dobParts.month || !dobParts.year) {
                newErrors.dateOfBirth = 'Complete date of birth is required';
            } else if (!isValidDate(dobParts.year, dobParts.month, dobParts.day)) {
                newErrors.dateOfBirth = 'Invalid date (e.g., Feb 30 doesn\'t exist)';
            }
        }

        // Tentative Time
        if (touched.tentativeTime || timeParts.hour || timeParts.minute) {
            if (!timeParts.hour || !timeParts.minute) {
                newErrors.tentativeTime = 'Approximate birth time is required';
            }
        }

        // Birth Place
        if (touched.birthPlace || data.birthPlace) {
            if (!data.birthPlace?.trim()) {
                newErrors.birthPlace = 'Birth place is required';
            }
        }

        return newErrors;
    }, [data.fullName, data.birthPlace, dobParts, timeParts, touched]);

    // Full validation for step submission - checks EVERYTHING
    const isStepComplete = useMemo(() => {
        if (!data.fullName?.trim() || data.fullName.trim().length < 2) return false;
        if (!dobParts.day || !dobParts.month || !dobParts.year) return false;
        if (!isValidDate(dobParts.year, dobParts.month, dobParts.day)) return false;
        if (!timeParts.hour || !timeParts.minute) return false;
        if (!data.birthPlace?.trim()) return false;
        // Coordinates must be explicitly set by place picker (not default 0,0)
        if (!data.latitude || !data.longitude) return false;
        if (data.latitude === 0 && data.longitude === 0 && !data.timezone) return false;
        return true;
    }, [data.fullName, data.birthPlace, data.latitude, data.longitude, data.timezone, dobParts, timeParts]);

    const handleDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
        setTouched(prev => ({ ...prev, dateOfBirth: true }));
        const newParts = { ...dobParts, [part]: value };

        if (part === 'month' || part === 'year') {
            const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
            if (parseInt(newParts.day, 10) > maxDays) {
                newParts.day = '';
            }
        }

        setDobParts(newParts);

        if (newParts.year && newParts.month && newParts.day &&
            isValidDate(newParts.year, newParts.month, newParts.day)) {
            updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        } else if (!newParts.day || !newParts.month || !newParts.year) {
            // Clear parent when date becomes incomplete (e.g., day reset on month change)
            updateData({ dateOfBirth: '' });
        }
    }, [dobParts, updateData]);

    const handleTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
        setTouched(prev => ({ ...prev, tentativeTime: true }));
        setTimeParts(prevParts => {
            const newParts = { ...prevParts, [part]: value } as typeof prevParts;
            if (newParts.hour && newParts.minute) {
                const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
                updateData({ tentativeTime: time24 });
            }
            return newParts;
        });
    }, [updateData]);

    const handleNameChange = useCallback((value: string) => {
        setTouched(prev => ({ ...prev, fullName: true }));
        updateData({ fullName: sanitizeInput(value) });
    }, [updateData]);

    const handlePlaceChange = useCallback((updates: Record<string, unknown>) => {
        setTouched((prev: Record<string, boolean>) => ({ ...prev, birthPlace: true }));
        updateData(updates);
    }, [updateData]);

    const handleOffsetChange = useCallback((preset: OffsetPreset) => {
        setSelectedOffset(preset);
        const presetData = OFFSET_PRESETS.find(p => p.value === preset);
        if (preset !== 'custom' && presetData) {
            updateOffset?.({ preset, customMinutes: presetData.minutes, description: presetData.label });
        } else {
            updateOffset?.({ preset: 'custom', customMinutes: customOffset, description: `±${customOffset} min` });
        }
    }, [customOffset, updateOffset]);

    const handleCustomOffsetChange = useCallback((valStr: string) => {
        let val = parseInt(valStr, 10);
        if (isNaN(val)) val = 60;
        if (val < 1) val = 1;
        if (val > 720) val = 720;
        setCustomOffset(val);
        updateOffset?.({
            preset: 'custom',
            customMinutes: val,
            description: `±${val} min`
        });
    }, [updateOffset]);

    const handleSpouseDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
        const newParts = { ...spouseDobParts, [part]: value };

        if (part === 'month' || part === 'year') {
            const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
            if (parseInt(newParts.day, 10) > maxDays) {
                newParts.day = '';
            }
        }

        setSpouseDobParts(newParts);

        if (newParts.year && newParts.month && newParts.day &&
            isValidDate(newParts.year, newParts.month, newParts.day)) {
            updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        }
    }, [spouseDobParts, updateSpouse]);

    const handleSpouseTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
        setSpouseTimeParts(prevParts => {
            const newParts = { ...prevParts, [part]: value } as typeof prevParts;
            if (newParts.hour && newParts.minute) {
                const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
                updateSpouse?.({ birthTime: time24 });
            }
            return newParts;
        });
    }, [updateSpouse]);

    return {
        showSpouse,
        setShowSpouse,
        dobParts,
        timeParts,
        selectedOffset,
        customOffset,
        spouseDobParts,
        spouseTimeParts,
        availableDays,
        spouseAvailableDays,
        errors,
        isStepComplete,
        handleNameChange,
        handlePlaceChange,
        handleDateChange,
        handleTimeChange,
        handleOffsetChange,
        handleCustomOffsetChange,
        handleSpouseDateChange,
        handleSpouseTimeChange
    };
}
