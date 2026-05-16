/**
 * Event System Utilities
 * Production-grade filtering, ranking, and suggestion algorithms
 */

import {
  EventCategory,
  EventTemplate,
  FilterCriteria,
  SuggestionConfig,
  DEFAULT_SUGGESTION_CONFIG,
} from './types';
// EVENT_CATEGORIES from './categories' available when dynamic category filtering is needed
/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if an event matches the age criteria
 */
export function matchesAgeCriteria(
  event: EventTemplate,
  userAge: number
): boolean {
  if (event.ageRange === 'all') return true;
  if (!event.ageRange) return true;

  const { min, max } = event.ageRange;
  return userAge >= min && userAge <= max;
}

/**
 * Check if an event matches the gender criteria
 */
export function matchesGenderCriteria(
  event: EventTemplate,
  userGender?: 'male' | 'female'
): boolean {
  if (!event.gender || event.gender === 'all') return true;
  if (!userGender) return true;

  return event.gender === userGender;
}

/**
 * Filter events by criteria
 */
export function filterEvents(
  categories: EventCategory[],
  criteria: FilterCriteria
): EventCategory[] {
  return categories.map((category) => ({
    ...category,
    events: category.events.filter((event) => {
      // Age filter
      if (criteria.age !== undefined && !matchesAgeCriteria(event, criteria.age)) {
        return false;
      }

      // Gender filter
      if (criteria.gender && !matchesGenderCriteria(event, criteria.gender)) {
        return false;
      }

      // Importance filter
      if (
        criteria.importance?.length &&
        !criteria.importance.includes(event.importance)
      ) {
        return false;
      }

      // Search query filter
      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase();
        const matchesLabel = event.label.toLowerCase().includes(query);
        const matchesDesc = event.description?.toLowerCase().includes(query) ?? false;
        if (!matchesLabel && !matchesDesc) return false;
      }

      return true;
    }),
  }));
}

/**
 * Calculate relevance score for an event
 */
export function calculateRelevanceScore(
  event: EventTemplate,
  userAge: number,
  userGender: 'male' | 'female',
  config: SuggestionConfig = DEFAULT_SUGGESTION_CONFIG
): number {
  let score = 0;

  // Age relevance (events closer to user's age get higher scores)
  if (event.ageRange !== 'all' && event.ageRange) {
    const { min, max } = event.ageRange;
    const midPoint = (min + max) / 2;
    const ageDiff = Math.abs(userAge - midPoint);
    const ageScore = Math.max(0, 1 - ageDiff / 20); // Decay over 20 years
    score += ageScore * config.ageWeight;
  }

  // Gender match
  if (event.gender && event.gender !== 'all') {
    score += (event.gender === userGender ? 1 : 0) * config.genderWeight;
  }

  // Importance weight
  const importanceScores = { critical: 1, high: 0.7, medium: 0.4, low: 0.1 };
  score += importanceScores[event.importance] * config.importanceWeight;

  return score;
}

/**
 * Get smart event suggestions based on user profile
 */
export function getSmartSuggestions(
  categories: EventCategory[],
  userAge: number,
  userGender: 'male' | 'female',
  limit: number = 8,
  config: SuggestionConfig = DEFAULT_SUGGESTION_CONFIG
): EventTemplate[] {
  const allEvents = categories.flatMap((cat) =>
    cat.events.map((event) => ({
      ...event,
      categoryId: cat.id,
      categoryLabel: cat.label,
      categoryIcon: cat.icon,
    }))
  );

  // Filter by age and gender first
  const eligibleEvents = allEvents.filter(
    (event) =>
      matchesAgeCriteria(event, userAge) && matchesGenderCriteria(event, userGender)
  );

  // Score and rank
  const scoredEvents = eligibleEvents.map((event) => ({
    ...event,
    relevanceScore: calculateRelevanceScore(event, userAge, userGender, config),
  }));

  // Sort by relevance score descending
  scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredEvents.slice(0, limit);
}

/**
 * Get events by age group
 */
export function getEventsByAgeGroup(
  categories: EventCategory[],
  ageGroup: 'child' | 'teen' | 'adult' | 'senior'
): EventCategory[] {
  const ageRanges = {
    child: { min: 0, max: 12 },
    teen: { min: 13, max: 19 },
    adult: { min: 20, max: 50 },
    senior: { min: 50, max: 100 },
  };

  const range = ageRanges[ageGroup];

  return categories.map((category) => ({
    ...category,
    events: category.events.filter((event) => {
      if (event.ageRange === 'all') return true;
      if (!event.ageRange) return true;

      const { min, max } = event.ageRange;
      // Check if event age range overlaps with target age group
      return min <= range.max && max >= range.min;
    }),
  }));
}

/**
 * Get category by ID
 */
export function getCategoryById(
  categories: EventCategory[],
  id: string
): EventCategory | undefined {
  return categories.find((cat) => cat.id === id);
}

/**
 * Get event by ID
 */
export function getEventById(
  categories: EventCategory[],
  eventId: string
): (EventTemplate & { categoryId: string }) | undefined {
  for (const category of categories) {
    const event = category.events.find((e) => e.id === eventId);
    if (event) {
      return { ...event, categoryId: category.id };
    }
  }
  return undefined;
}

/**
 * Get all events as flat list
 */
export function getAllEvents(
  categories: EventCategory[]
): Array<EventTemplate & { categoryId: string }> {
  return categories.flatMap((cat) =>
    cat.events.map((event) => ({ ...event, categoryId: cat.id }))
  );
}

/**
 * Search events by query
 */
export function searchEvents(
  categories: EventCategory[],
  query: string
): Array<EventTemplate & { categoryId: string; categoryLabel: string }> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: Array<EventTemplate & { categoryId: string; categoryLabel: string }> = [];

  for (const category of categories) {
    for (const event of category.events) {
      const matchesLabel = event.label.toLowerCase().includes(normalizedQuery);
      const matchesDesc = event.description?.toLowerCase().includes(normalizedQuery) ?? false;
      const matchesId = event.id.toLowerCase().includes(normalizedQuery);

      if (matchesLabel || matchesDesc || matchesId) {
        results.push({
          ...event,
          categoryId: category.id,
          categoryLabel: category.label,
        });
      }
    }
  }

  // Sort by relevance (exact matches first)
  results.sort((a, b) => {
    const aExact = a.label.toLowerCase() === normalizedQuery;
    const bExact = b.label.toLowerCase() === normalizedQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.label.localeCompare(b.label);
  });

  return results;
}

/**
 * Get importance badge color
 */
export function getImportanceColor(importance: string): string {
  const colors = {
    critical: '#DC143C',
    high: '#FF8C00',
    medium: '#228B22',
    low: '#708090',
  };
  return colors[importance as keyof typeof colors] ?? '#708090';
}

/**
 * Get importance label
 */
export function getImportanceLabel(importance: string): string {
  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[importance as keyof typeof labels] ?? importance;
}

/**
 * Validate custom event data
 */
export function validateCustomEvent(
  label: string,
  categoryId: string
): { valid: boolean; error?: string } {
  if (!label || label.trim().length < 2) {
    return { valid: false, error: 'Event name must be at least 2 characters' };
  }

  if (label.trim().length > 100) {
    return { valid: false, error: 'Event name must be less than 100 characters' };
  }

  if (!categoryId) {
    return { valid: false, error: 'Category is required' };
  }

  return { valid: true };
}

/**
 * Check if event is already added
 */
export function isEventAdded(
  existingEvents: Array<{ eventType: string }>,
  eventLabel: string
): boolean {
  return existingEvents.some(
    (e) => e.eventType.toLowerCase() === eventLabel.toLowerCase()
  );
}

/**
 * Get default categories (non-sensitive first)
 */
export function getDefaultCategories(categories: EventCategory[]): EventCategory[] {
  return categories.filter((cat) => !cat.isSensitive);
}

/**
 * Get sensitive categories (trauma, etc.)
 */
export function getSensitiveCategories(categories: EventCategory[]): EventCategory[] {
  return categories.filter((cat) => cat.isSensitive);
}
