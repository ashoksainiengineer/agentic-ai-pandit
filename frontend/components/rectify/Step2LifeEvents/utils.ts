import { LifeEvent } from '@/lib/types';
import { MONTHS } from './constants';

export const generateEventId = (): string => {
    return crypto.randomUUID();
};

export const sanitizeDescription = (desc: string): string => {
    return desc.slice(0, 1000);
};

export const parseDateParts = (dateStr: string): { year: string; month: string; day: string } => {
    if (!dateStr) return { year: '', month: '', day: '' };
    const parts = dateStr.split('-');
    return {
        year: parts[0] || '',
        month: parts[1] || '',
        day: parts[2] || ''
    };
};

export const getMonthName = (monthNum: string): string => {
    const index = parseInt(monthNum, 10) - 1;
    if (isNaN(index) || index < 0 || index >= MONTHS.length) return '';
    return MONTHS[index].slice(0, 3);
};

export const isValidDateString = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 1) return false;
    const year = parseInt(parts[0], 10);
    return !isNaN(year) && year > 1800 && year <= 2030;
};

export const parsePartialDate = (dateStr: string): { year: string; month: string; day: string; isPartial: boolean } => {
    if (!dateStr) return { year: '', month: '', day: '', isPartial: true };
    const parts = dateStr.split('-');
    return {
        year: parts[0] || '',
        month: parts[1] || '',
        day: parts[2] || '',
        isPartial: parts.length < 3 || !parts[1] || !parts[2]
    };
};

export const formatEventDate = (e: LifeEvent): string => {
    if (!e.eventDate || !isValidDateString(e.eventDate)) return 'No date';

    const { year, month, day } = parseDateParts(e.eventDate);
    const mon = getMonthName(month);

    if (e.datePrecision === 'month_year' && mon && year) return `${mon} ${year}`;
    if ((e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time') && mon && day && year) {
        return `${day} ${mon} ${year}`;
    }
    if (e.datePrecision?.includes('range') && e.endDate) {
        const endYear = parseDateParts(e.endDate).year;
        return `${year} → ${endYear || year}`;
    }
    return year || 'No date';
};

export const getAccuracyLabel = (acc: number): { label: string; emoji: string; precision: string } => {
    if (acc >= 96) return { label: 'God Tier', emoji: '🔱', precision: '±1-10 seconds' };
    if (acc >= 90) return { label: 'Master Level', emoji: '⚡', precision: '±10-60 seconds' };
    if (acc >= 80) return { label: 'Professional', emoji: '🌟', precision: '±1-5 minutes' };
    if (acc >= 70) return { label: 'Advanced', emoji: '⭐', precision: '±3-5 minutes' };
    if (acc >= 60) return { label: 'Intermediate', emoji: '📊', precision: '±5-15 minutes' };
    return { label: 'Basic', emoji: '🔍', precision: '±15+ minutes' };
};
