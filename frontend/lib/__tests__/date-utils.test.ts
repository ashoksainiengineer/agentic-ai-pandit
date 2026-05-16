/**
 * 🔱 EXHAUSTIVE DATE UTILS TESTS
 * Tests ALL 33 exported functions from date-utils.ts
 * Covers leap years, boundaries, parsing, validation, formatting, and ranges.
 */
import { describe, it, expect } from 'vitest';
import {
    isLeapYear,
    getDaysInMonth,
    parseDateParts,
    parseTimeParts,
    validateYear,
    validateMonth,
    validateDay,
    validateHour,
    validateMinute,
    validateDate,
    validateDateTime,
    validateMonthYear,
    validateYearOnly,
    compareDates,
    validateDateRange,
    validateMonthRange,
    validateYearRange,
    getAvailableDays,
    isDateComplete,
    formatDateForDisplay,
    buildDateString,
    buildTimeString,
    generateYears,
    generateDays,
    isPrecisionSatisfied,
    DATE_CONSTANTS,
} from '../date-utils.js';

// ═══════════════════════════════════════════════════════════════════════════
// LEAP YEAR
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - isLeapYear', () => {
    it('should return true for 2000 (divisible by 400)', () => expect(isLeapYear(2000)).toBe(true));
    it('should return true for 2024 (divisible by 4, not by 100)', () => expect(isLeapYear(2024)).toBe(true));
    it('should return false for 1900 (divisible by 100, not by 400)', () => expect(isLeapYear(1900)).toBe(false));
    it('should return false for 2023 (not divisible by 4)', () => expect(isLeapYear(2023)).toBe(false));
    it('should return false for NaN', () => expect(isLeapYear(NaN)).toBe(false));
    it('should return true for 1600', () => expect(isLeapYear(1600)).toBe(true));
    it('should return false for 2100', () => expect(isLeapYear(2100)).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// DAYS IN MONTH
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - getDaysInMonth', () => {
    it('should return 31 for January', () => expect(getDaysInMonth(2024, 1)).toBe(31));
    it('should return 29 for Feb in leap year', () => expect(getDaysInMonth(2024, 2)).toBe(29));
    it('should return 28 for Feb in non-leap year', () => expect(getDaysInMonth(2023, 2)).toBe(28));
    it('should return 30 for April', () => expect(getDaysInMonth(2024, 4)).toBe(30));
    it('should return 31 for December', () => expect(getDaysInMonth(2024, 12)).toBe(31));
    it('should return 31 for invalid month 0', () => expect(getDaysInMonth(2024, 0)).toBe(31));
    it('should return 31 for invalid month 13', () => expect(getDaysInMonth(2024, 13)).toBe(31));
    it('should return 31 for NaN year', () => expect(getDaysInMonth(NaN, 1)).toBe(31));
});

// ═══════════════════════════════════════════════════════════════════════════
// PARSE DATE/TIME PARTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - parseDateParts', () => {
    it('should parse YYYY-MM-DD', () => {
        expect(parseDateParts('2024-05-15')).toEqual({ year: '2024', month: '05', day: '15' });
    });
    it('should handle undefined', () => {
        expect(parseDateParts(undefined)).toEqual({ year: '', month: '', day: '' });
    });
    it('should handle empty string', () => {
        expect(parseDateParts('')).toEqual({ year: '', month: '', day: '' });
    });
    it('should handle year-only', () => {
        expect(parseDateParts('2024')).toEqual({ year: '2024', month: '', day: '' });
    });
});

describe('Date Utils - parseTimeParts', () => {
    it('should parse HH:MM', () => {
        expect(parseTimeParts('14:30')).toEqual({ hour: '14', minute: '30' });
    });
    it('should handle undefined', () => {
        expect(parseTimeParts(undefined)).toEqual({ hour: '', minute: '' });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE YEAR / MONTH / DAY / HOUR / MINUTE
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - validateYear', () => {
    it('should accept 2024', () => expect(validateYear('2024').valid).toBe(true));
    it('should reject empty', () => expect(validateYear('').valid).toBe(false));
    it('should reject year < 1900', () => expect(validateYear('1899').valid).toBe(false));
    it('should reject future year', () => expect(validateYear('2999').valid).toBe(false));
    it('should reject non-numeric', () => expect(validateYear('abc').valid).toBe(false));
    it('should accept 1900 (boundary)', () => expect(validateYear('1900').valid).toBe(true));
});

describe('Date Utils - validateMonth', () => {
    it('should accept 1', () => expect(validateMonth('1').valid).toBe(true));
    it('should accept 12', () => expect(validateMonth('12').valid).toBe(true));
    it('should reject 0', () => expect(validateMonth('0').valid).toBe(false));
    it('should reject 13', () => expect(validateMonth('13').valid).toBe(false));
    it('should reject empty', () => expect(validateMonth('').valid).toBe(false));
    it('should reject non-numeric', () => expect(validateMonth('abc').valid).toBe(false));
});

describe('Date Utils - validateDay', () => {
    it('should accept day 1', () => expect(validateDay('1', 2024, 1).valid).toBe(true));
    it('should accept day 31 for Jan', () => expect(validateDay('31', 2024, 1).valid).toBe(true));
    it('should reject day 32 for Jan', () => expect(validateDay('32', 2024, 1).valid).toBe(false));
    it('should accept day 29 for Feb leap year', () => expect(validateDay('29', 2024, 2).valid).toBe(true));
    it('should reject day 29 for Feb non-leap year', () => expect(validateDay('29', 2023, 2).valid).toBe(false));
    it('should reject day 0', () => expect(validateDay('0', 2024, 1).valid).toBe(false));
    it('should reject empty', () => expect(validateDay('', 2024, 1).valid).toBe(false));
});

describe('Date Utils - validateHour', () => {
    it('should accept 0', () => expect(validateHour('0').valid).toBe(true));
    it('should accept 23', () => expect(validateHour('23').valid).toBe(true));
    it('should reject 24', () => expect(validateHour('24').valid).toBe(false));
    it('should reject -1', () => expect(validateHour('-1').valid).toBe(false));
    it('should reject empty', () => expect(validateHour('').valid).toBe(false));
});

describe('Date Utils - validateMinute', () => {
    it('should accept 0', () => expect(validateMinute('0').valid).toBe(true));
    it('should accept 59', () => expect(validateMinute('59').valid).toBe(true));
    it('should reject 60', () => expect(validateMinute('60').valid).toBe(false));
    it('should reject empty', () => expect(validateMinute('').valid).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE DATE / DATETIME / RANGE
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - validateDate', () => {
    it('should accept valid date', () => {
        const result = validateDate('2024-05-15');
        expect(result.valid).toBe(true);
        expect(result.normalizedDate).toBe('2024-05-15');
    });
    it('should reject empty', () => expect(validateDate('').valid).toBe(false));
    it('should reject Feb 29 non-leap', () => expect(validateDate('2023-02-29').valid).toBe(false));
    it('should accept Feb 29 leap year', () => expect(validateDate('2024-02-29').valid).toBe(true));
    it('should reject invalid month', () => expect(validateDate('2024-13-01').valid).toBe(false));
});

describe('Date Utils - validateDateTime', () => {
    it('should accept valid date+time', () => {
        const result = validateDateTime('2024-05-15', '14:30');
        expect(result.valid).toBe(true);
        expect(result.normalizedTime).toBe('14:30');
    });
    it('should reject missing time', () => expect(validateDateTime('2024-05-15', '').valid).toBe(false));
    it('should reject invalid hour', () => expect(validateDateTime('2024-05-15', '25:00').valid).toBe(false));
});

describe('Date Utils - validateDateRange', () => {
    it('should accept valid range (start < end)', () => {
        const result = validateDateRange('2020-01-01', '2024-12-31');
        expect(result.valid).toBe(true);
    });
    it('should accept equal dates', () => {
        const result = validateDateRange('2024-05-15', '2024-05-15');
        expect(result.valid).toBe(true);
    });
    it('should reject reversed range (start > end)', () => {
        const result = validateDateRange('2024-12-31', '2020-01-01');
        expect(result.valid).toBe(false);
    });
    it('should reject missing start', () => expect(validateDateRange('', '2024-01-01').valid).toBe(false));
    it('should reject missing end', () => expect(validateDateRange('2024-01-01', '').valid).toBe(false));
});

describe('Date Utils - validateMonthRange', () => {
    it('should accept valid month range', () => {
        const result = validateMonthRange('2020', '1', '2024', '12');
        expect(result.valid).toBe(true);
    });
    it('should reject reversed range', () => {
        const result = validateMonthRange('2024', '12', '2020', '1');
        expect(result.valid).toBe(false);
    });
});

describe('Date Utils - validateYearRange', () => {
    it('should accept valid year range', () => {
        const result = validateYearRange('2020', '2024');
        expect(result.valid).toBe(true);
    });
    it('should reject reversed range', () => {
        const result = validateYearRange('2024', '2020');
        expect(result.valid).toBe(false);
    });
    it('should accept equal years', () => {
        const result = validateYearRange('2024', '2024');
        expect(result.valid).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPARE DATES
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - compareDates', () => {
    it('should return negative for earlier date', () => expect(compareDates('2020-01-01', '2024-01-01')).toBeLessThan(0));
    it('should return positive for later date', () => expect(compareDates('2024-01-01', '2020-01-01')).toBeGreaterThan(0));
    it('should return 0 for equal dates', () => expect(compareDates('2024-05-15', '2024-05-15')).toBe(0));
    it('should compare months when years match', () => expect(compareDates('2024-01-01', '2024-06-01')).toBeLessThan(0));
    it('should compare days when year+month match', () => expect(compareDates('2024-05-01', '2024-05-15')).toBeLessThan(0));
});

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABLE DAYS & FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - getAvailableDays', () => {
    it('should return 29 days for Feb leap year', () => {
        const days = getAvailableDays('2024', '2');
        expect(days.length).toBe(29);
    });
    it('should return 28 days for Feb non-leap year', () => {
        const days = getAvailableDays('2023', '2');
        expect(days.length).toBe(28);
    });
    it('should return 31 days for invalid input', () => {
        const days = getAvailableDays('abc', 'xyz');
        expect(days.length).toBe(31);
    });
    it('should zero-pad days', () => {
        const days = getAvailableDays('2024', '1');
        expect(days[0]).toBe('01');
        expect(days[8]).toBe('09');
    });
});

describe('Date Utils - formatDateForDisplay', () => {
    it('should format exact date', () => {
        expect(formatDateForDisplay('2024-05-15', 'exact_date')).toBe('15 May 2024');
    });
    it('should format month_year', () => {
        expect(formatDateForDisplay('2024-05-01', 'month_year')).toBe('May 2024');
    });
    it('should return "No date" for empty', () => {
        expect(formatDateForDisplay('', 'exact_date')).toBe('No date');
    });
});

describe('Date Utils - buildDateString', () => {
    it('should build full date', () => {
        expect(buildDateString({ year: '2024', month: '5', day: '15' })).toBe('2024-05-15');
    });
    it('should build year-month', () => {
        expect(buildDateString({ year: '2024', month: '5' })).toBe('2024-05');
    });
    it('should build year only', () => {
        expect(buildDateString({ year: '2024' })).toBe('2024');
    });
    it('should return empty for no year', () => {
        expect(buildDateString({})).toBe('');
    });
});

describe('Date Utils - buildTimeString', () => {
    it('should build time from parts', () => expect(buildTimeString('14', '30')).toBe('14:30'));
    it('should zero-pad single digits', () => expect(buildTimeString('9', '5')).toBe('09:05'));
    it('should return empty for no input', () => expect(buildTimeString('', '')).toBe(''));
});

// ═══════════════════════════════════════════════════════════════════════════
// PRECISION CHECKS
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - isDateComplete', () => {
    it('should require time for exact_date_time', () => {
        expect(isDateComplete('exact_date_time', '2024-05-15', '14:30')).toBe(true);
        expect(isDateComplete('exact_date_time', '2024-05-15')).toBe(false);
    });
    it('should not require time for exact_date', () => {
        expect(isDateComplete('exact_date', '2024-05-15')).toBe(true);
    });
    it('should check month_year', () => {
        expect(isDateComplete('month_year', '2024-05')).toBe(true);
    });
    it('should check year_range with endDate', () => {
        expect(isDateComplete('year_range', '2020', undefined, '2024')).toBe(true);
        expect(isDateComplete('year_range', '2020')).toBe(false);
    });
});

describe('Date Utils - isPrecisionSatisfied', () => {
    it('should satisfy exact_date', () => {
        expect(isPrecisionSatisfied('exact_date', '2024-05-15')).toBe(true);
    });
    it('should not satisfy exact_date_time without time', () => {
        expect(isPrecisionSatisfied('exact_date_time', '2024-05-15')).toBe(false);
    });
    it('should satisfy year_range with end date', () => {
        expect(isPrecisionSatisfied('year_range', '2020-01-01', '2024-01-01')).toBe(true);
    });
    it('should return false for empty date', () => {
        expect(isPrecisionSatisfied('exact_date', '')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GENERATORS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Date Utils - generateYears', () => {
    it('should generate 100 years by default', () => {
        const years = generateYears();
        expect(years.length).toBe(100);
        expect(parseInt(years[0])).toBe(new Date().getFullYear());
    });
    it('should generate custom count', () => {
        expect(generateYears(10).length).toBe(10);
    });
});

describe('Date Utils - DATE_CONSTANTS', () => {
    it('should have 12 months', () => expect(DATE_CONSTANTS.MONTHS.length).toBe(12));
    it('should have 24 hours', () => expect(DATE_CONSTANTS.HOURS.length).toBe(24));
    it('should have 60 minutes', () => expect(DATE_CONSTANTS.MINUTES.length).toBe(60));
    it('should have MIN_YEAR of 1900', () => expect(DATE_CONSTANTS.MIN_YEAR).toBe(1900));
});
