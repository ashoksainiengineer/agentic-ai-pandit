import { describe, it, expect } from 'vitest';
import {
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
} from '../events/utils.js';
import { EVENT_CATEGORIES } from '../events/categories.js';
import type { EventCategory, EventTemplate } from '../events/types.js';

describe('events/utils', () => {
    describe('calculateAge', () => {
        it('should calculate age from a date string', () => {
            const birthYear = new Date().getFullYear() - 25;
            const age = calculateAge(`${birthYear}-01-01`);
            expect(age).toBe(25);
        });

        it('should calculate age from a Date object', () => {
            const birthYear = new Date().getFullYear() - 30;
            const age = calculateAge(new Date(`${birthYear}-01-01`));
            expect(age).toBe(30);
        });
    });

    describe('matchesAgeCriteria', () => {
        it('should match when age is within range', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high', ageRange: { min: 20, max: 30 } };
            expect(matchesAgeCriteria(event, 25)).toBe(true);
        });

        it('should not match when age is outside range', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high', ageRange: { min: 20, max: 30 } };
            expect(matchesAgeCriteria(event, 35)).toBe(false);
        });

        it('should match when ageRange is "all"', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high', ageRange: 'all' };
            expect(matchesAgeCriteria(event, 99)).toBe(true);
        });
    });

    describe('matchesGenderCriteria', () => {
        it('should match when gender matches', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high', gender: 'male' };
            expect(matchesGenderCriteria(event, 'male')).toBe(true);
        });

        it('should not match when gender differs', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high', gender: 'male' };
            expect(matchesGenderCriteria(event, 'female')).toBe(false);
        });

        it('should match when no gender specified', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'high' };
            expect(matchesGenderCriteria(event, 'male')).toBe(true);
        });
    });

    describe('filterEvents', () => {
        it('should filter events by age', () => {
            const result = filterEvents(EVENT_CATEGORIES, { age: 25 });
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            for (const cat of result) {
                for (const event of cat.events) {
                    if (event.ageRange !== 'all' && event.ageRange) {
                        expect(25).toBeGreaterThanOrEqual(event.ageRange.min);
                        expect(25).toBeLessThanOrEqual(event.ageRange.max);
                    }
                }
            }
        });

        it('should filter events by search query', () => {
            const result = filterEvents(EVENT_CATEGORIES, { searchQuery: 'marriage' });
            expect(Array.isArray(result)).toBe(true);
            const totalEvents = result.reduce((sum, cat) => sum + cat.events.length, 0);
            expect(totalEvents).toBeGreaterThan(0);
        });
    });

    describe('calculateRelevanceScore', () => {
        it('should return a positive score for matching event', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'critical', ageRange: { min: 20, max: 30 } };
            const score = calculateRelevanceScore(event, 25, 'male');
            expect(score).toBeGreaterThan(0);
        });

        it('should return higher score for critical importance', () => {
            const event: EventTemplate = { id: 'test', label: 'Test', importance: 'critical', ageRange: 'all' };
            const score = calculateRelevanceScore(event, 25, 'male');
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('getSmartSuggestions', () => {
        it('should return suggestions for a 25-year-old male', () => {
            const suggestions = getSmartSuggestions(EVENT_CATEGORIES, 25, 'male', 5);
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(5);
        });

        it('should default limit to 8', () => {
            const suggestions = getSmartSuggestions(EVENT_CATEGORIES, 30, 'female');
            expect(suggestions.length).toBeLessThanOrEqual(8);
        });
    });

    describe('getEventsByAgeGroup', () => {
        it('should return child events for child group', () => {
            const result = getEventsByAgeGroup(EVENT_CATEGORIES, 'child');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should return adult events for adult group', () => {
            const result = getEventsByAgeGroup(EVENT_CATEGORIES, 'adult');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('getCategoryById', () => {
        it('should find a category by ID', () => {
            const category = getCategoryById(EVENT_CATEGORIES, 'sanskars');
            expect(category).toBeDefined();
            expect(category!.id).toBe('sanskars');
        });

        it('should return undefined for unknown ID', () => {
            const category = getCategoryById(EVENT_CATEGORIES, 'nonexistent');
            expect(category).toBeUndefined();
        });
    });

    describe('getEventById', () => {
        it('should find an event by ID', () => {
            const event = getEventById(EVENT_CATEGORIES, 'vivaha');
            expect(event).toBeDefined();
            expect(event!.id).toBe('vivaha');
            expect(event!.categoryId).toBeDefined();
        });

        it('should return undefined for unknown event ID', () => {
            const event = getEventById(EVENT_CATEGORIES, 'nonexistent');
            expect(event).toBeUndefined();
        });
    });

    describe('getAllEvents', () => {
        it('should return a flat list of all events with categoryId', () => {
            const allEvents = getAllEvents(EVENT_CATEGORIES);
            expect(Array.isArray(allEvents)).toBe(true);
            expect(allEvents.length).toBeGreaterThan(0);
            for (const event of allEvents) {
                expect(event.categoryId).toBeDefined();
            }
        });
    });

    describe('searchEvents', () => {
        it('should return results for a query', () => {
            const results = searchEvents(EVENT_CATEGORIES, 'marriage');
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            for (const event of results) {
                expect(event.categoryId).toBeDefined();
                expect(event.categoryLabel).toBeDefined();
            }
        });

        it('should return empty array for empty query', () => {
            const results = searchEvents(EVENT_CATEGORIES, '');
            expect(results).toEqual([]);
        });
    });

    describe('getImportanceColor', () => {
        it('should return colors for known importance levels', () => {
            expect(getImportanceColor('critical')).toBe('#DC143C');
            expect(getImportanceColor('high')).toBe('#FF8C00');
            expect(getImportanceColor('medium')).toBe('#228B22');
            expect(getImportanceColor('low')).toBe('#708090');
        });

        it('should return default color for unknown importance', () => {
            expect(getImportanceColor('unknown')).toBe('#708090');
        });
    });

    describe('getImportanceLabel', () => {
        it('should return labels for known importance levels', () => {
            expect(getImportanceLabel('critical')).toBe('Critical');
            expect(getImportanceLabel('high')).toBe('High');
            expect(getImportanceLabel('medium')).toBe('Medium');
            expect(getImportanceLabel('low')).toBe('Low');
        });

        it('should return the input for unknown importance', () => {
            expect(getImportanceLabel('unknown')).toBe('unknown');
        });
    });

    describe('validateCustomEvent', () => {
        it('should validate a proper event', () => {
            const result = validateCustomEvent('My Event', 'sanskars');
            expect(result.valid).toBe(true);
        });

        it('should reject short labels', () => {
            const result = validateCustomEvent('A', 'sanskars');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should reject missing category', () => {
            const result = validateCustomEvent('My Event', '');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('isEventAdded', () => {
        it('should detect added events', () => {
            const existing = [{ eventType: 'Marriage' }];
            expect(isEventAdded(existing, 'marriage')).toBe(true);
        });

        it('should not detect unadded events', () => {
            const existing = [{ eventType: 'Marriage' }];
            expect(isEventAdded(existing, 'divorce')).toBe(false);
        });
    });

    describe('getDefaultCategories', () => {
        it('should filter out sensitive categories', () => {
            const categories: EventCategory[] = [
                { id: 'a', icon: '', label: 'A', color: '', description: '', events: [], isSensitive: false },
                { id: 'b', icon: '', label: 'B', color: '', description: '', events: [], isSensitive: true },
            ];
            const result = getDefaultCategories(categories);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('a');
        });
    });

    describe('getSensitiveCategories', () => {
        it('should return only sensitive categories', () => {
            const categories: EventCategory[] = [
                { id: 'a', icon: '', label: 'A', color: '', description: '', events: [], isSensitive: false },
                { id: 'b', icon: '', label: 'B', color: '', description: '', events: [], isSensitive: true },
            ];
            const result = getSensitiveCategories(categories);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('b');
        });
    });
});
