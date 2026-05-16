/**
 * 🔱 EXHAUSTIVE TIME OFFSET MANAGER TESTS
 * Tests validation and preset-to-minutes conversion.
 */
import { describe, it, expect } from 'vitest';
import { validateOffsetConfig, offsetConfigToMinutes, type TimeOffsetConfig } from '../time-offset-manager.js';

describe('Time Offset Manager - validateOffsetConfig', () => {
    it('should accept valid preset "2hours"', () => {
        const result = validateOffsetConfig({ preset: '2hours' });
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should accept all valid presets', () => {
        const presets = ['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'custom'] as const;
        for (const preset of presets) {
            const result = validateOffsetConfig({ preset });
            expect(result.valid).toBe(true);
        }
    });

    it('should reject invalid preset', () => {
        const result = validateOffsetConfig({ preset: '3hours' as any });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid preset');
    });

    it('should accept valid customMinutes', () => {
        const result = validateOffsetConfig({ customMinutes: 120 });
        expect(result.valid).toBe(true);
    });

    it('should reject customMinutes < 1', () => {
        const result = validateOffsetConfig({ customMinutes: 0 });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('between 1 and 720');
    });

    it('should reject customMinutes > 720', () => {
        const result = validateOffsetConfig({ customMinutes: 721 });
        expect(result.valid).toBe(false);
    });

    it('should reject null/undefined config', () => {
        const result = validateOffsetConfig(null as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('required');
    });

    it('should accept config with only description', () => {
        const result = validateOffsetConfig({ description: 'Custom offset' });
        expect(result.valid).toBe(true);
    });

    it('should accept boundary value customMinutes = 1', () => {
        const result = validateOffsetConfig({ customMinutes: 1 });
        expect(result.valid).toBe(true);
    });

    it('should accept boundary value customMinutes = 720', () => {
        const result = validateOffsetConfig({ customMinutes: 720 });
        expect(result.valid).toBe(true);
    });
});

describe('Time Offset Manager - offsetConfigToMinutes', () => {
    it('should convert 30min to 30', () => {
        expect(offsetConfigToMinutes({ preset: '30min' })).toBe(30);
    });

    it('should convert 1hour to 60', () => {
        expect(offsetConfigToMinutes({ preset: '1hour' })).toBe(60);
    });

    it('should convert 2hours to 120', () => {
        expect(offsetConfigToMinutes({ preset: '2hours' })).toBe(120);
    });

    it('should convert 4hours to 240', () => {
        expect(offsetConfigToMinutes({ preset: '4hours' })).toBe(240);
    });

    it('should convert 6hours to 360', () => {
        expect(offsetConfigToMinutes({ preset: '6hours' })).toBe(360);
    });

    it('should convert 12hours to 720', () => {
        expect(offsetConfigToMinutes({ preset: '12hours' })).toBe(720);
    });

    it('should use customMinutes when provided (overrides preset)', () => {
        expect(offsetConfigToMinutes({ preset: '30min', customMinutes: 45 })).toBe(45);
    });

    it('should default to 120 for custom preset without customMinutes', () => {
        expect(offsetConfigToMinutes({ preset: 'custom' })).toBe(120);
    });

    it('should default to 120 for unknown/missing preset', () => {
        expect(offsetConfigToMinutes({} as any)).toBe(120);
    });
});
