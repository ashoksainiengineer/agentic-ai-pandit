import { OffsetPreset } from '@/lib/types';

export const OFFSET_PRESETS: { value: OffsetPreset; label: string; minutes: number }[] = [
    { value: '5min', label: '±5 min', minutes: 5 },
    { value: '15min', label: '±15 min', minutes: 15 },
    { value: '30min', label: '±30 min', minutes: 30 },
    { value: '1hour', label: '±1 hr', minutes: 60 },
    { value: '2hours', label: '±2 hrs', minutes: 120 },
    { value: '4hours', label: '±4 hrs', minutes: 240 },
    { value: '6hours', label: '±6 hrs', minutes: 360 },
    { value: '12hours', label: '±12 hrs', minutes: 720 },
    { value: 'custom', label: 'Custom', minutes: 0 },
];

export const MONTHS = [
    { val: '01', label: 'Jan', days: 31 },
    { val: '02', label: 'Feb', days: 28 },
    { val: '03', label: 'Mar', days: 31 },
    { val: '04', label: 'Apr', days: 30 },
    { val: '05', label: 'May', days: 31 },
    { val: '06', label: 'Jun', days: 30 },
    { val: '07', label: 'Jul', days: 31 },
    { val: '08', label: 'Aug', days: 31 },
    { val: '09', label: 'Sep', days: 30 },
    { val: '10', label: 'Oct', days: 31 },
    { val: '11', label: 'Nov', days: 30 },
    { val: '12', label: 'Dec', days: 31 }
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 100 }, (_, i) => (CURRENT_YEAR - i).toString());

export const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
export const AM_PM_OPTIONS = ['AM', 'PM'] as const;

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' }
] as const;
