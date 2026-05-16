/**
 * Events Module - Barrel Export
 * Centralized exports for the enhanced event system
 */

// Types
export * from './types';

// Data
export { EVENT_CATEGORIES } from './categories';
export { default as EVENT_CATEGORIES_DEFAULT } from './categories';

// Utilities
export {
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
} from './utils';
