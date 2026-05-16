import { describe, it, expect } from 'vitest';
import { EVENT_CATEGORIES } from '../events/categories.js';

describe('events/categories', () => {
    it('should export EVENT_CATEGORIES', () => {
        expect(EVENT_CATEGORIES).toBeDefined();
        expect(Array.isArray(EVENT_CATEGORIES)).toBe(true);
    });

    it('should have categories with required fields', () => {
        expect(EVENT_CATEGORIES.length).toBeGreaterThan(0);
        for (const category of EVENT_CATEGORIES) {
            expect(category.id).toBeDefined();
            expect(typeof category.id).toBe('string');
            expect(category.icon).toBeDefined();
            expect(typeof category.icon).toBe('string');
            expect(category.label).toBeDefined();
            expect(typeof category.label).toBe('string');
            expect(category.color).toBeDefined();
            expect(typeof category.color).toBe('string');
            expect(category.events).toBeDefined();
            expect(Array.isArray(category.events)).toBe(true);
            expect(category.events.length).toBeGreaterThan(0);
        }
    });

    it('should have unique category IDs', () => {
        const ids = EVENT_CATEGORIES.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have events with id, label, and importance in each category', () => {
        for (const category of EVENT_CATEGORIES) {
            for (const event of category.events) {
                expect(event.id).toBeDefined();
                expect(typeof event.id).toBe('string');
                expect(event.label).toBeDefined();
                expect(typeof event.label).toBe('string');
                expect(event.importance).toBeDefined();
                expect(['critical', 'high', 'medium', 'low']).toContain(event.importance);
            }
        }
    });
});
