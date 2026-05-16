// lib/fuzzy-date-parser.ts
// Utility to parse human-centric date strings into machine-readable format for BTR

import { format, addYears } from 'date-fns';

export interface ParsedFuzzyDate {
    startDate: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    precision: 'exact' | 'month' | 'year' | 'age' | 'relative' | 'range' | 'approx';
    confidence: number; // 0 to 1
}

export function parseFuzzyDate(input: string, birthDate: string): ParsedFuzzyDate | null {
    const text = input.toLowerCase().trim();
    const birth = new Date(birthDate);

    // 1. Age-based: "Age 22", "When I was 10"
    const ageMatch = text.match(/(?:age|at|when i was)\s*(\d{1,2})/);
    if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        const eventYear = birth.getFullYear() + age;
        return {
            startDate: `${eventYear}-01-01`,
            endDate: `${eventYear}-12-31`,
            precision: 'age',
            confidence: 0.9
        };
    }

    // 2. Season-based: "Winter 2005", "Monsoon 1998"
    const seasonMatch = text.match(/(winter|summer|monsoon|spring|autumn)\s*(\d{4})/);
    if (seasonMatch) {
        const season = seasonMatch[1];
        const year = seasonMatch[2];
        let months = ['01', '03']; // Default winter
        if (season === 'summer') months = ['04', '06'];
        if (season === 'monsoon') months = ['07', '09'];
        if (season === 'autumn') months = ['10', '12'];
        if (season === 'spring') months = ['03', '05']; // BUG-FIX: spring was missing

        return {
            startDate: `${year}-${months[0]}-01`,
            endDate: `${year}-${months[1]}-30`,
            precision: 'relative',
            confidence: 0.8
        };
    }

    // 4. Month-Year: "May 2005", "May '05", "05/2005"
    const monthYearMatch = text.match(/([a-z]{3,9})\s+[']?(\d{2,4})/);
    if (monthYearMatch) {
        const monthName = monthYearMatch[1];
        const yearStr = monthYearMatch[2];
        const year = yearStr.length === 2 ? (parseInt(yearStr) > 50 ? 1900 + parseInt(yearStr) : 2000 + parseInt(yearStr)) : parseInt(yearStr);

        const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
        if (!isNaN(monthIndex)) {
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0); // Last day of month

            return {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                precision: 'month',
                confidence: 0.95
            };
        }
    }

    // 5. Part of Year: "Early 2010", "Mid 2015", "Late 1999"
    const partYearMatch = text.match(/(early|mid|late)\s+(\d{4})/);
    if (partYearMatch) {
        const part = partYearMatch[1];
        const year = partYearMatch[2];
        let startMonth = 0; // Jan
        let endMonth = 11; // Dec

        if (part === 'early') { startMonth = 0; endMonth = 3; } // Jan-Apr
        else if (part === 'mid') { startMonth = 4; endMonth = 7; } // May-Aug
        else if (part === 'late') { startMonth = 8; endMonth = 11; } // Sep-Dec

        return {
            startDate: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`,
            endDate: format(new Date(parseInt(year), endMonth + 1, 0), 'yyyy-MM-dd'),
            precision: 'range',
            confidence: 0.85
        };
    }

    // 6. Quarters: "Q1 2024", "1st Quarter 1990"
    const quarterMatch = text.match(/q([1-4])\s+(\d{4})/);
    if (quarterMatch) {
        const q = parseInt(quarterMatch[1]);
        const year = quarterMatch[2];
        const startMonth = (q - 1) * 3; // 0, 3, 6, 9
        const endMonth = startMonth + 2;

        return {
            startDate: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`,
            endDate: format(new Date(parseInt(year), endMonth + 1, 0), 'yyyy-MM-dd'),
            precision: 'range',
            confidence: 0.9
        };
    }

    // 7. Approximate: "Around 2000", "Circa 1990" (±1 Year)
    const approxMatch = text.match(/(?:around|circa|c\.|approx)\s*(\d{4})/);
    if (approxMatch) {
        const centerYear = parseInt(approxMatch[1]);
        return {
            startDate: `${centerYear - 1}-01-01`,
            endDate: `${centerYear + 1}-12-31`,
            precision: 'approx',
            confidence: 0.7
        };
    }

    // 8. Catch-all Year-Only: "In 1995", "1995"
    // MUST be at the bottom so it doesn't swallow "Spring 1995"
    const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        const year = yearMatch[1];
        return {
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            precision: 'year',
            confidence: 1.0
        };
    }

    return null;
}

/**
 * Parses relative time based on another event's date
 */
export function parseRelativeDate(relativeTo: string, offsetYears: number): string {
    const baseDate = new Date(relativeTo);
    const newDate = addYears(baseDate, offsetYears);
    return format(newDate, 'yyyy-MM-dd');
}
