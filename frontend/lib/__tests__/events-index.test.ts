import { describe, it, expect } from 'vitest';
import {
    EVENT_CATEGORIES,
    EVENT_CATEGORIES_DEFAULT,
    calculateAge,
    matchesAgeCriteria,
    matchesGenderCriteria,
    filterEvents,
    calculateRelevanceScore,
    getSmartSuggestions,
    getEventsByAgeGroup,
    getCategoryById,
    getEventById,
    getAllEvents,
    searchEvents,
    getImportanceColor,
    getImportanceLabel,
    validateCustomEvent,
    isEventAdded,
    getDefaultCategories,
    getSensitiveCategories,
} from '../events/index.js';

describe('events/index (barrel exports)', () => {
    it('should export EVENT_CATEGORIES', () => {
        expect(EVENT_CATEGORIES).toBeDefined();
        expect(Array.isArray(EVENT_CATEGORIES)).toBe(true);
    });

    it('should export EVENT_CATEGORIES_DEFAULT', () => {
        expect(EVENT_CATEGORIES_DEFAULT).toBeDefined();
        expect(Array.isArray(EVENT_CATEGORIES_DEFAULT)).toBe(true);
    });

    it('should export utility functions', () => {
        expect(typeof calculateAge).toBe('function');
        expect(typeof matchesAgeCriteria).toBe('function');
        expect(typeof matchesGenderCriteria).toBe('function');
        expect(typeof filterEvents).toBe('function');
        expect(typeof calculateRelevanceScore).toBe('function');
        expect(typeof getSmartSuggestions).toBe('function');
        expect(typeof getEventsByAgeGroup).toBe('function');
        expect(typeof getCategoryById).toBe('function');
        expect(typeof getEventById).toBe('function');
        expect(typeof getAllEvents).toBe('function');
        expect(typeof searchEvents).toBe('function');
        expect(typeof getImportanceColor).toBe('function');
        expect(typeof getImportanceLabel).toBe('function');
        expect(typeof validateCustomEvent).toBe('function');
        expect(typeof isEventAdded).toBe('function');
        expect(typeof getDefaultCategories).toBe('function');
        expect(typeof getSensitiveCategories).toBe('function');
    });

    it('should have working re-exported functions', () => {
        const age = calculateAge('2000-01-01');
        expect(typeof age).toBe('number');
        expect(age).toBeGreaterThan(0);

        const category = getCategoryById(EVENT_CATEGORIES, 'sanskars');
        expect(category).toBeDefined();
        expect(category!.id).toBe('sanskars');
    });
});
