/**
 * Production-Grade Date Utilities
 * Comprehensive date validation, parsing, and formatting for BTR Life Events
 * 
 * Features:
 * - Leap year validation
 * - Days per month calculation
 * - Date range validation (start <= end)
 * - ISO 8601 date string handling
 * - Time parsing and validation
 */

export type DatePrecision =
  | 'exact_date_time'
  | 'exact_date'
  | 'date_range'
  | 'month_year'
  | 'month_range'
  | 'year_range';

export interface DateParts {
  year: string;
  month: string;
  day: string;
}

export interface TimeParts {
  hour: string;
  minute: string;
}

export interface DateValidationResult {
  valid: boolean;
  error?: string;
  normalizedDate?: string; // YYYY-MM-DD
  normalizedTime?: string; // HH:MM
}

export interface RangeValidationResult {
  valid: boolean;
  error?: string;
  normalizedStartDate?: string;
  normalizedEndDate?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear();

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  if (isNaN(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  if (isNaN(year) || isNaN(month)) return 31;
  if (month < 1 || month > 12) return 31;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return daysInMonth[month - 1];
}

/**
 * Parse a date string into parts
 */
export function parseDateParts(dateStr: string | undefined): DateParts {
  if (!dateStr) return { year: '', month: '', day: '' };
  const parts = dateStr.split('-');
  return {
    year: parts[0] || '',
    month: parts[1] || '',
    day: parts[2] || ''
  };
}

/**
 * Parse time string into parts
 */
export function parseTimeParts(timeStr: string | undefined): TimeParts {
  if (!timeStr) return { hour: '', minute: '' };
  const parts = timeStr.split(':');
  return {
    hour: parts[0] || '',
    minute: parts[1] || ''
  };
}

/**
 * Validate a year string
 */
export function validateYear(yearStr: string): { valid: boolean; error?: string; year?: number } {
  if (!yearStr) {
    return { valid: false, error: 'Year is required' };
  }

  const year = parseInt(yearStr, 10);

  if (isNaN(year)) {
    return { valid: false, error: 'Invalid year format' };
  }

  if (year < MIN_YEAR) {
    return { valid: false, error: `Year must be ${MIN_YEAR} or later` };
  }

  if (year > MAX_YEAR) {
    return { valid: false, error: `Year cannot be in the future` };
  }

  return { valid: true, year };
}

/**
 * Validate a month string (1-12)
 */
export function validateMonth(monthStr: string): { valid: boolean; error?: string; month?: number } {
  if (!monthStr) {
    return { valid: false, error: 'Month is required' };
  }

  const month = parseInt(monthStr, 10);

  if (isNaN(month)) {
    return { valid: false, error: 'Invalid month format' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }

  return { valid: true, month };
}

/**
 * Validate a day string for a given year and month
 */
export function validateDay(dayStr: string, year: number, month: number): { valid: boolean; error?: string; day?: number } {
  if (!dayStr) {
    return { valid: false, error: 'Day is required' };
  }

  const day = parseInt(dayStr, 10);

  if (isNaN(day)) {
    return { valid: false, error: 'Invalid day format' };
  }

  const maxDays = getDaysInMonth(year, month);

  if (day < 1 || day > maxDays) {
    return { valid: false, error: `Day must be between 1 and ${maxDays} for ${MONTHS[month - 1]} ${year}` };
  }

  return { valid: true, day };
}

/**
 * Validate hour string (00-23)
 */
export function validateHour(hourStr: string): { valid: boolean; error?: string; hour?: number } {
  if (!hourStr && hourStr !== '0') {
    return { valid: false, error: 'Hour is required' };
  }

  const hour = parseInt(hourStr, 10);

  if (isNaN(hour)) {
    return { valid: false, error: 'Invalid hour format' };
  }

  if (hour < 0 || hour > 23) {
    return { valid: false, error: 'Hour must be between 0 and 23' };
  }

  return { valid: true, hour };
}

/**
 * Validate minute string (00-59)
 */
export function validateMinute(minuteStr: string): { valid: boolean; error?: string; minute?: number } {
  if (!minuteStr && minuteStr !== '0') {
    return { valid: false, error: 'Minute is required' };
  }

  const minute = parseInt(minuteStr, 10);

  if (isNaN(minute)) {
    return { valid: false, error: 'Invalid minute format' };
  }

  if (minute < 0 || minute > 59) {
    return { valid: false, error: 'Minute must be between 0 and 59' };
  }

  return { valid: true, minute };
}

/**
 * Validate a complete date (YYYY-MM-DD)
 */
export function validateDate(dateStr: string): DateValidationResult {
  if (!dateStr) {
    return { valid: false, error: 'Date is required' };
  }

  const parts = parseDateParts(dateStr);

  // Validate year
  const yearValidation = validateYear(parts.year);
  if (!yearValidation.valid) {
    return { valid: false, error: yearValidation.error };
  }

  // Validate month
  const monthValidation = validateMonth(parts.month);
  if (!monthValidation.valid) {
    return { valid: false, error: monthValidation.error };
  }

  // Validate day
  const dayValidation = validateDay(parts.day, yearValidation.year!, monthValidation.month!);
  if (!dayValidation.valid) {
    return { valid: false, error: dayValidation.error };
  }

  // Normalize date string
  const normalizedDate = `${parts.year}-${parts.month.padStart(2, '0')}-${parts.day.padStart(2, '0')}`;

  return {
    valid: true,
    normalizedDate,
    normalizedTime: undefined
  };
}

/**
 * Validate a complete date with time (YYYY-MM-DD HH:MM)
 */
export function validateDateTime(dateStr: string, timeStr: string): DateValidationResult {
  // First validate the date
  const dateValidation = validateDate(dateStr);
  if (!dateValidation.valid) {
    return dateValidation;
  }

  // Validate time
  if (!timeStr) {
    return { valid: false, error: 'Time is required' };
  }

  const timeParts = parseTimeParts(timeStr);

  const hourValidation = validateHour(timeParts.hour);
  if (!hourValidation.valid) {
    return { valid: false, error: hourValidation.error };
  }

  const minuteValidation = validateMinute(timeParts.minute);
  if (!minuteValidation.valid) {
    return { valid: false, error: minuteValidation.error };
  }

  const normalizedTime = `${timeParts.hour.padStart(2, '0')}:${timeParts.minute.padStart(2, '0')}`;

  return {
    valid: true,
    normalizedDate: dateValidation.normalizedDate,
    normalizedTime
  };
}

/**
 * Validate month and year (both required)
 */
export function validateMonthYear(yearStr: string, monthStr: string): DateValidationResult {
  const yearValidation = validateYear(yearStr);
  if (!yearValidation.valid) {
    return { valid: false, error: yearValidation.error };
  }

  const monthValidation = validateMonth(monthStr);
  if (!monthValidation.valid) {
    return { valid: false, error: monthValidation.error };
  }

  const normalizedDate = `${yearStr}-${monthStr.padStart(2, '0')}-01`;

  return { valid: true, normalizedDate };
}

/**
 * Validate year only
 */
export function validateYearOnly(yearStr: string): DateValidationResult {
  const yearValidation = validateYear(yearStr);
  if (!yearValidation.valid) {
    return { valid: false, error: yearValidation.error };
  }

  const normalizedDate = `${yearStr}-01-01`;

  return { valid: true, normalizedDate };
}

/**
 * Compare two dates
 * Returns: negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export function compareDates(date1: string, date2: string): number {
  const parts1 = parseDateParts(date1);
  const parts2 = parseDateParts(date2);

  const year1 = parseInt(parts1.year, 10) || 0;
  const year2 = parseInt(parts2.year, 10) || 0;

  if (year1 !== year2) return year1 - year2;

  const month1 = parseInt(parts1.month, 10) || 0;
  const month2 = parseInt(parts2.month, 10) || 0;

  if (month1 !== month2) return month1 - month2;

  const day1 = parseInt(parts1.day, 10) || 0;
  const day2 = parseInt(parts2.day, 10) || 0;

  return day1 - day2;
}

/**
 * Validate a date range (start must be <= end)
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): RangeValidationResult {
  if (!startDate) {
    return { valid: false, error: 'Start date is required' };
  }

  if (!endDate) {
    return { valid: false, error: 'End date is required' };
  }

  // Validate individual dates
  const startValidation = validateDate(startDate);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  // Check range order
  const comparison = compareDates(startDate, endDate);

  if (comparison > 0) {
    return { valid: false, error: 'End date must be after or equal to start date' };
  }

  return {
    valid: true,
    normalizedStartDate: startValidation.normalizedDate,
    normalizedEndDate: endValidation.normalizedDate
  };
}

/**
 * Validate month range (start must be <= end)
 */
export function validateMonthRange(
  startYear: string,
  startMonth: string,
  endYear: string,
  endMonth: string
): RangeValidationResult {
  // Validate start month/year
  const startValidation = validateMonthYear(startYear, startMonth);
  if (!startValidation.valid) {
    return { valid: false, error: `Start: ${startValidation.error}` };
  }

  // Validate end month/year
  const endValidation = validateMonthYear(endYear, endMonth);
  if (!endValidation.valid) {
    return { valid: false, error: `End: ${endValidation.error}` };
  }

  // Compare
  const startDate = `${startYear}-${startMonth.padStart(2, '0')}-01`;
  const endDate = `${endYear}-${endMonth.padStart(2, '0')}-01`;

  const comparison = compareDates(startDate, endDate);

  if (comparison > 0) {
    return { valid: false, error: 'End month/year must be after or equal to start month/year' };
  }

  return {
    valid: true,
    normalizedStartDate: startValidation.normalizedDate,
    normalizedEndDate: endValidation.normalizedDate
  };
}

/**
 * Validate year range (start must be <= end)
 */
export function validateYearRange(startYear: string, endYear: string): RangeValidationResult {
  // Validate start year
  const startValidation = validateYearOnly(startYear);
  if (!startValidation.valid) {
    return { valid: false, error: `Start: ${startValidation.error}` };
  }

  // Validate end year
  const endValidation = validateYearOnly(endYear);
  if (!endValidation.valid) {
    return { valid: false, error: `End: ${endValidation.error}` };
  }

  // Compare years
  const year1 = parseInt(startYear, 10);
  const year2 = parseInt(endYear, 10);

  if (year2 < year1) {
    return { valid: false, error: 'End year must be after or equal to start year' };
  }

  return {
    valid: true,
    normalizedStartDate: startValidation.normalizedDate,
    normalizedEndDate: endValidation.normalizedDate
  };
}

/**
 * Get available days for a given year and month
 * Accounts for leap years
 */
export function getAvailableDays(yearStr: string, monthStr: string): string[] {
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }

  const daysInMonth = getDaysInMonth(year, month);
  return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
}

/**
 * Check if a date is complete (has all required parts for the precision)
 */
export function isDateComplete(
  precision: DatePrecision,
  dateStr: string,
  timeStr?: string,
  endDateStr?: string
): boolean {
  const parts = parseDateParts(dateStr);

  switch (precision) {
    case 'exact_date_time':
      return !!(
        parts.year &&
        parts.month &&
        parts.day &&
        timeStr &&
        timeStr.includes(':')
      );

    case 'exact_date':
      return !!(parts.year && parts.month && parts.day);

    case 'month_year':
      return !!(parts.year && parts.month);

    case 'year_range':
      const endYearParts = parseDateParts(endDateStr);
      return !!(parts.year && endYearParts.year);

    case 'month_range': {
      const endMonthParts = parseDateParts(endDateStr);
      return !!(
        parts.year &&
        parts.month &&
        endMonthParts.year &&
        endMonthParts.month
      );
    }

    case 'date_range': {
      const endDateParts = parseDateParts(endDateStr);
      return !!(
        parts.year &&
        parts.month &&
        parts.day &&
        endDateParts.year &&
        endDateParts.month &&
        endDateParts.day
      );
    }

    default:
      return false;
  }
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(dateStr: string, precision: DatePrecision): string {
  if (!dateStr) return 'No date';

  const parts = parseDateParts(dateStr);
  const monthName = parts.month ? MONTHS[parseInt(parts.month, 10) - 1]?.slice(0, 3) : '';

  switch (precision) {
    case 'exact_date_time':
    case 'exact_date':
      if (parts.day && monthName && parts.year) {
        return `${parts.day} ${monthName} ${parts.year}`;
      }
      return parts.year || 'No date';

    case 'month_year':
      if (monthName && parts.year) {
        return `${monthName} ${parts.year}`;
      }
      return parts.year || 'No date';

    case 'year_range':
      return parts.year || 'No date';

    default:
      return parts.year || 'No date';
  }
}

/**
 * Build a date string from parts
 */
export function buildDateString(parts: Partial<DateParts>): string {
  const year = parts.year || '';
  const month = parts.month ? parts.month.padStart(2, '0') : '';
  const day = parts.day ? parts.day.padStart(2, '0') : '';

  if (!year) return '';

  let str = year;
  if (month) {
    str += `-${month}`;
    if (day) {
      str += `-${day}`;
    }
  }
  return str;
}

/**
 * Build a time string from parts
 */
export function buildTimeString(hour: string, minute: string): string {
  if (!hour && !minute) return '';
  const h = hour ? hour.padStart(2, '0') : '00';
  const m = minute ? minute.padStart(2, '0') : '00';
  return `${h}:${m}`;
}

/**
 * Generate years array for dropdown
 */
export function generateYears(count: number = 100): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => (currentYear - i).toString());
}

/**
 * Generate days array based on year and month
 */
export function generateDays(year: string, month: string): string[] {
  return getAvailableDays(year, month);
}

/**
 * Check if the date string satisfies the requirements for a given precision
 */
export function isPrecisionSatisfied(
  precision: DatePrecision,
  dateStr: string,
  endDateStr?: string,
  timeStr?: string
): boolean {
  if (!dateStr) return false;
  const parts = parseDateParts(dateStr);
  const hasYear = !!parts.year && parseInt(parts.year, 10) >= MIN_YEAR && parseInt(parts.year, 10) <= MAX_YEAR;

  switch (precision) {
    case 'exact_date_time':
      return hasYear && !!parts.month && !!parts.day && !!timeStr && timeStr.includes(':');
    case 'exact_date':
      return hasYear && !!parts.month && !!parts.day;
    case 'month_year':
      return hasYear && !!parts.month;
    case 'year_range':
      if (!endDateStr) return false;
      const endParts = parseDateParts(endDateStr);
      return hasYear && !!endParts.year;
    case 'month_range':
      if (!endDateStr) return false;
      const endMonthParts = parseDateParts(endDateStr);
      return hasYear && !!parts.month && !!endMonthParts.year && !!endMonthParts.month;
    case 'date_range':
      if (!endDateStr) return false;
      const endDateParts = parseDateParts(endDateStr);
      return hasYear && !!parts.month && !!parts.day && !!endDateParts.year && !!endDateParts.month && !!endDateParts.day;
    default:
      return hasYear;
  }
}

/**
 * Constants for dropdowns
 */
export const DATE_CONSTANTS = {
  MONTHS,
  MIN_YEAR,
  MAX_YEAR,
  HOURS: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
  MINUTES: Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
} as const;
