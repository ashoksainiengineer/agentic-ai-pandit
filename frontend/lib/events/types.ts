/**
 * Enhanced Event System Types
 * Production-grade type definitions for comprehensive life event tracking
 */

export type EventImportance = 'critical' | 'high' | 'medium' | 'low';
export type EventGender = 'male' | 'female' | 'all';

export interface AgeRange {
  min: number;
  max: number;
}

export interface EventTemplate {
  id: string;
  label: string;
  description?: string;
  importance: EventImportance;
  ageRange?: AgeRange | 'all';
  gender?: EventGender;
  isCustom?: boolean;
}

export interface EventCategory {
  id: string;
  icon: string;
  label: string;
  color: string;
  description: string;
  events: EventTemplate[];
  isSensitive?: boolean;
  isCustom?: boolean;
}

export interface UserCustomCategory extends EventCategory {
  createdAt: string;
  userId: string;
}

export interface UserCustomEvent extends EventTemplate {
  categoryId: string;
  createdAt: string;
  userId: string;
}

export interface FilterCriteria {
  age?: number;
  gender?: 'male' | 'female';
  importance?: EventImportance[];
  searchQuery?: string;
}

export interface SuggestionConfig {
  ageWeight: number;
  genderWeight: number;
  importanceWeight: number;
  recencyWeight: number;
}

export const DEFAULT_SUGGESTION_CONFIG: SuggestionConfig = {
  ageWeight: 0.4,
  genderWeight: 0.2,
  importanceWeight: 0.2,
  recencyWeight: 0.2,
};

export const IMPORTANCE_OPTIONS: {
  level: EventImportance;
  label: string;
  icon: string;
  desc: string;
  weight: number;
}[] = [
  { level: 'critical', label: 'Life Defining', icon: '⚡', desc: 'Transformed your life', weight: 5.0 },
  { level: 'high', label: 'Major Milestone', icon: '⭐', desc: 'Significant turning point', weight: 3.0 },
  { level: 'medium', label: 'Important', icon: '●', desc: 'Notable life event', weight: 2.0 },
  { level: 'low', label: 'Minor', icon: '○', desc: 'Routine occurrence', weight: 1.0 },
];

export const getImportanceLabel = (level: EventImportance): string => {
  return IMPORTANCE_OPTIONS.find(opt => opt.level === level)?.label || level;
};

export const getImportanceIcon = (level: EventImportance): string => {
  return IMPORTANCE_OPTIONS.find(opt => opt.level === level)?.icon || '●';
};

export const getImportanceWeight = (level: EventImportance): number => {
  return IMPORTANCE_OPTIONS.find(opt => opt.level === level)?.weight || 1.0;
};

export const getImportanceColor = (level: EventImportance): string => {
  switch (level) {
    case 'critical': return 'bg-[#184131]/20 text-[#184131]';
    case 'high': return 'bg-[#8B5CF6]/20 text-[#8B5CF6]';
    case 'medium': return 'bg-[#000000]/20 text-black';
    case 'low': return 'bg-[#636363]/20 text-[#636363]';
    default: return 'bg-[#636363]/20 text-[#636363]';
  }
};
