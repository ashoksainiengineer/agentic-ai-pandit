/**
 * 🔱 EXHAUSTIVE FUZZY DATE PARSER TESTS
 * Tests every parsing mode: age-based, year, season, month-year,
 * part-of-year, quarter, and approximate dates.
 * 
 * 🐛 BUG DOCUMENTED: The year regex `\b(19\d{2}|20\d{2})\b` (rule #2) matches
 * before rules #5 (part-of-year), #6 (quarter), and #7 (approximate).
 * This means "late 1999", "q1 2024", "around 2000" all match as plain year-only.
 * This is tracked in TESTING_FINDINGS.md.
 */
import { describe, it, expect } from 'vitest';
import { parseFuzzyDate, parseRelativeDate } from '../fuzzy-date-parser.js';

const BIRTH_DATE = '1990-05-15';

describe('Fuzzy Date Parser - Age-Based', () => {
    it('should parse "Age 22"', () => {
        const result = parseFuzzyDate('Age 22', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2012-01-01');
        expect(result!.endDate).toBe('2012-12-31');
        expect(result!.precision).toBe('age');
        expect(result!.confidence).toBe(0.9);
    });

    it('should parse "When I was 10"', () => {
        const result = parseFuzzyDate('When I was 10', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2000-01-01');
        expect(result!.precision).toBe('age');
    });

    it('should parse "at 5" (young age)', () => {
        const result = parseFuzzyDate('at 5', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1995-01-01');
    });
});

describe('Fuzzy Date Parser - Year-Based', () => {
    it('should parse "In 1995"', () => {
        const result = parseFuzzyDate('In 1995', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1995-01-01');
        expect(result!.endDate).toBe('1995-12-31');
        expect(result!.precision).toBe('year');
        expect(result!.confidence).toBe(1.0);
    });

    it('should parse bare "2010"', () => {
        const result = parseFuzzyDate('2010', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2010-01-01');
    });

    it('should parse "1999" (20th century)', () => {
        const result = parseFuzzyDate('1999', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1999-01-01');
    });
});

describe('Fuzzy Date Parser - Season-Based', () => {
    it('should parse "Winter 2005"', () => {
        const result = parseFuzzyDate('winter 2005', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('relative');
    });

    it('should parse "Summer 2010"', () => {
        const result = parseFuzzyDate('summer 2010', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('relative');
    });

    it('should parse "Monsoon 1998"', () => {
        const result = parseFuzzyDate('monsoon 1998', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('relative');
    });
});

describe('Fuzzy Date Parser - Month-Year', () => {
    it('should parse "May 2005"', () => {
        const result = parseFuzzyDate('May 2005', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('month');
    });

    it('should parse abbreviated year "May \'05"', () => {
        const result = parseFuzzyDate("may '05", BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('month');
        expect(result!.confidence).toBe(0.95);
    });

    it('should parse 2-digit year ≥ 50 as 1900s', () => {
        const result = parseFuzzyDate("december '95", BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toMatch(/^1995-12/);
    });
});

describe('Fuzzy Date Parser - Part of Year', () => {
    it('should parse "Early 2010" correctly', () => {
        const result = parseFuzzyDate('early 2010', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2010-01-01');
        expect(result!.precision).toBe('range');
    });

    it('should parse "Mid 2015" correctly', () => {
        const result = parseFuzzyDate('mid 2015', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2015-05-01');
        expect(result!.precision).toBe('range');
    });

    it('should parse "Late 1999" correctly', () => {
        const result = parseFuzzyDate('late 1999', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1999-09-01');
        expect(result!.precision).toBe('range');
    });
});

describe('Fuzzy Date Parser - Quarters', () => {
    it('should parse "Q1 2024" correctly', () => {
        const result = parseFuzzyDate('q1 2024', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2024-01-01');
        expect(result!.precision).toBe('range');
    });

    it('should parse "Q2 2020" correctly', () => {
        const result = parseFuzzyDate('q2 2020', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2020-04-01');
    });

    it('should parse "Q3 2019" correctly', () => {
        const result = parseFuzzyDate('q3 2019', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2019-07-01');
    });

    it('should parse "Q4 2018" correctly', () => {
        const result = parseFuzzyDate('q4 2018', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('2018-10-01');
    });
});

describe('Fuzzy Date Parser - Approximate', () => {
    it('should parse "Around 2000" correctly', () => {
        const result = parseFuzzyDate('around 2000', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1999-01-01');
        expect(result!.precision).toBe('approx');
    });

    it('should parse "circa 1990" correctly', () => {
        const result = parseFuzzyDate('circa 1990', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.startDate).toBe('1989-01-01');
    });

    it('should parse "approx 2010" correctly', () => {
        const result = parseFuzzyDate('approx 2010', BIRTH_DATE);
        expect(result).not.toBeNull();
        expect(result!.precision).toBe('approx');
    });
});

describe('Fuzzy Date Parser - Edge Cases', () => {
    it('should return undefined for unparseable input', () => {
        const result = parseFuzzyDate('completely random text', BIRTH_DATE);
        expect(result).toBeNull();
    });

    it('should handle extra whitespace', () => {
        const result = parseFuzzyDate('  age 22  ', BIRTH_DATE);
        expect(result).not.toBeNull();
    });

    it('should be case-insensitive', () => {
        const result = parseFuzzyDate('AGE 22', BIRTH_DATE);
        expect(result).not.toBeNull();
    });
});

describe('Fuzzy Date Parser - parseRelativeDate', () => {
    it('should add years to a base date', () => {
        const result = parseRelativeDate('2020-06-15', 3);
        expect(result).toBe('2023-06-15');
    });

    it('should subtract years with negative offset', () => {
        const result = parseRelativeDate('2020-06-15', -5);
        expect(result).toBe('2015-06-15');
    });

    it('should handle leap year crossing', () => {
        const result = parseRelativeDate('2020-02-29', 1);
        expect(result).toBe('2021-02-28');
    });
});
