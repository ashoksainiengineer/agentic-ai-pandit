import { MONTHS } from './constants';

const range = (n: number): string[] =>
    Array.from({ length: n }, (_, i) => (i + 1).toString().padStart(2, '0'));

export const sanitizeInput = (input: string): string => {
    return input
        .normalize('NFKC')
        .replace(/[<>&"'\\]/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .slice(0, 100);
};

export const isValidDate = (year: string, month: string, day: string): boolean => {
    if (!year || !month || !day) return false;

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;

    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

export const getDaysForMonth = (month: string, year: string): string[] => {
    if (!month) return range(31);

    const monthNum = parseInt(month, 10);

    if (!year) {
        const days = MONTHS.find(m => m.val === month)?.days || 31;
        return range(monthNum === 2 ? 28 : days);
    }

    const yearNum = parseInt(year, 10);

    let daysInMonth = MONTHS.find(m => m.val === month)?.days || 31;

    if (monthNum === 2) {
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
        daysInMonth = isLeapYear ? 29 : 28;
    }

    return range(daysInMonth);
};

export const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
    let h = parseInt(hour, 10);
    const m = minute.padStart(2, '0');

    if (period === 'PM' && h !== 12) {
        h += 12;
    } else if (period === 'AM' && h === 12) {
        h = 0;
    }

    return `${h.toString().padStart(2, '0')}:${m}:00`;
};

export const parseTimeToParts = (timeString: string | undefined): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    if (!timeString) return { hour: '', minute: '', period: 'AM' };

    const [h, m] = timeString.split(':');
    let hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' as const : 'AM' as const;

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return {
        hour: hour.toString().padStart(2, '0'),
        minute: m,
        period
    };
};
