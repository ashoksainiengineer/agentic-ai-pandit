import { DatePrecision } from './types';

export const DATE_OPTIONS = [
    { value: 'exact_date_time' as DatePrecision, label: 'Exact Date & Time', desc: 'DD/MM/YYYY HH:MM' },
    { value: 'exact_date' as DatePrecision, label: 'Exact Date', desc: 'DD/MM/YYYY' },
    { value: 'date_range' as DatePrecision, label: 'Date Range', desc: 'DD/MM → DD/MM' },
    { value: 'month_year' as DatePrecision, label: 'Month & Year', desc: 'MM/YYYY' },
    { value: 'month_range' as DatePrecision, label: 'Month Range', desc: 'MM/YYYY → MM/YYYY' },
    { value: 'year_range' as DatePrecision, label: 'Year Range', desc: 'YYYY → YYYY' },
];

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
