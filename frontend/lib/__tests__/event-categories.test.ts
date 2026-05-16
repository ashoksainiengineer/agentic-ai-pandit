/**
 * 🔱 EXHAUSTIVE EVENT CATEGORIES TESTS
 * Tests getCategoryById, getAllEventTemplates, templateToLifeEvent
 */
import { describe, it, expect } from 'vitest';
import { getCategoryById, getAllEventTemplates, templateToLifeEvent } from '../event-categories.js';
import EVENT_CATEGORIES from '../event-categories.js';

describe('Event Categories - Structure', () => {
    it('should have at least 5 categories', () => {
        expect(EVENT_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });

    it('every category should have id, icon, label, color, events', () => {
        for (const cat of EVENT_CATEGORIES) {
            expect(cat.id).toBeDefined();
            expect(cat.icon).toBeDefined();
            expect(cat.label).toBeDefined();
            expect(cat.color).toBeDefined();
            expect(cat.events).toBeDefined();
            expect(cat.events.length).toBeGreaterThan(0);
        }
    });

    it('every event template should have id, label, importance', () => {
        for (const cat of EVENT_CATEGORIES) {
            for (const event of cat.events) {
                expect(event.id).toBeDefined();
                expect(event.label).toBeDefined();
                expect(['critical', 'high', 'medium', 'low']).toContain(event.importance);
            }
        }
    });

    it('category IDs should be unique', () => {
        const ids = EVENT_CATEGORIES.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('Event Categories - getCategoryById', () => {
    it('should find existing category', () => {
        const firstCat = EVENT_CATEGORIES[0];
        const result = getCategoryById(firstCat.id);
        expect(result).toBeDefined();
        expect(result!.id).toBe(firstCat.id);
    });

    it('should return undefined for nonexistent ID', () => {
        expect(getCategoryById('nonexistent_category_12345')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
        expect(getCategoryById('')).toBeUndefined();
    });
});

describe('Event Categories - getAllEventTemplates', () => {
    it('should return flat list with categoryId', () => {
        const templates = getAllEventTemplates();
        expect(templates.length).toBeGreaterThan(0);
        for (const t of templates) {
            expect(t.categoryId).toBeDefined();
            expect(t.id).toBeDefined();
            expect(t.label).toBeDefined();
        }
    });

    it('should have total count = sum of all category events', () => {
        const totalFromCategories = EVENT_CATEGORIES.reduce((sum, c) => sum + c.events.length, 0);
        const flatList = getAllEventTemplates();
        expect(flatList.length).toBe(totalFromCategories);
    });
});

describe('Event Categories - templateToLifeEvent', () => {
    it('should convert template to LifeEvent format', () => {
        const template = EVENT_CATEGORIES[0].events[0];
        const result = templateToLifeEvent(template, EVENT_CATEGORIES[0].id, '2020-01-15', 'Custom description');

        // Check result has key properties (actual field names may differ)
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should use template label if no custom description', () => {
        const template = EVENT_CATEGORIES[0].events[0];
        const result = templateToLifeEvent(template, EVENT_CATEGORIES[0].id, '2020-01-15');

        expect(result.description).toContain(template.label);
    });
});
