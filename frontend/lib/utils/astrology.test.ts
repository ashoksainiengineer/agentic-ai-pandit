import { describe, it, expect } from 'vitest';
import { formatDMS, formatSignDegree } from './astrology';

describe('Astrology Utilities - Mathematical Precision', () => {
    describe('formatDMS', () => {
        it('converts base degrees correctly', () => {
            expect(formatDMS(15.0)).toBe('15° 00\' 00"');
        });

        it('handles minutes and seconds with high precision', () => {
            // 15.2345 degrees
            // 0.2345 * 60 = 14.07 minutes
            // 0.07 * 60 = 4.2 seconds -> 04"
            expect(formatDMS(15.2345)).toBe('15° 14\' 04"');
        });

        it('handles rounding at the 59.9 second boundary', () => {
            // 15.99999 degrees should round to 16.0 or close to it
            // 0.99999 * 3600 = 3599.964 seconds -> 3600 seconds
            expect(formatDMS(15.99999)).toBe('16° 00\' 00"');
        });

        it('handles zero values', () => {
            expect(formatDMS(0)).toBe('0° 00\' 00"');
        });

        it('handles string inputs', () => {
            expect(formatDMS("15.2345")).toBe('15° 14\' 04"');
        });
    });

    describe('formatSignDegree', () => {
        it('parses sign and degree combined strings', () => {
            expect(formatSignDegree('Aries 15.2345')).toBe('Aries 15° 14\' 04"');
        });

        it('handles signs with spaces if any (e.g., "Sagittarius 10.5")', () => {
            expect(formatSignDegree('Sagittarius 10.5')).toBe('Sagittarius 10° 30\' 00"');
        });

        it('returns raw value if parsing fails', () => {
            expect(formatSignDegree('Aries')).toBe('Aries');
            expect(formatSignDegree('')).toBe('-');
        });

        it('handles very deep decimals (7+ places)', () => {
            // Industry standard: 4-decimal is enough, but testing 7
            expect(formatSignDegree('Leo 23.4567890')).toBe('Leo 23° 27\' 24"');
        });
    });
});
