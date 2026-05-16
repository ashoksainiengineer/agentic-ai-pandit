import {
  Sparkles,
  TrendingUp,
  Award,
  HeartPulse,
  Briefcase,
  Home,
  GraduationCap,
  Plane,
  Baby,
  Landmark,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface AccuracyLevel {
  range: string;
  accuracy: string;
  precision: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  description: string;
}

export interface CategoryImportance {
  category: string;
  icon: LucideIcon;
  events: string;
  why: string;
  planets: string;
  examples: string[];
}

export const ACCURACY_LEVELS: AccuracyLevel[] = [
  {
    range: '0-10 events',
    accuracy: '40-55%',
    precision: '±15-30 minutes',
    label: 'Basic Verification',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: AlertTriangle,
    description: 'Not sufficient for precise rectification',
  },
  {
    range: '11-20 events',
    accuracy: '70-80%',
    precision: '±3-5 minutes',
    label: 'Good Progress',
    color: 'text-primary-dark',
    bgColor: 'bg-primary-dark/10',
    borderColor: 'border-primary-dark/30',
    icon: TrendingUp,
    description: 'Professional-grade accuracy',
  },
  {
    range: '21-30 events',
    accuracy: '88-95%',
    precision: '±10-60 seconds',
    label: 'Excellent Dataset',
    color: 'text-trust',
    bgColor: 'bg-trust/10',
    borderColor: 'border-trust/30',
    icon: Award,
    description: 'Sub-minute precision achieved',
  },
  {
    range: '35+ events',
    accuracy: '96-99%',
    precision: '±1-10 seconds',
    label: 'God Tier Precision',
    color: 'text-primary',
    bgColor: 'bg-gradient-to-r from-primary/15 to-primary-dark/15',
    borderColor: 'border-primary/40',
    icon: Sparkles,
    description: 'Research-grade seconds-level accuracy',
  },
];

export const CATEGORY_IMPORTANCE: CategoryImportance[] = [
  {
    category: 'Career & Work',
    icon: Briefcase,
    events: '4-6 events',
    why: '10th house validation for professional timing',
    planets: 'Sun, Saturn, 10th Lord',
    examples: ['First job', 'Promotion', 'Job change', 'Business start', 'Major achievement'],
  },
  {
    category: 'Marriage & Relationships',
    icon: HeartPulse,
    events: '3-5 events',
    why: '7th house precision for partnership timing',
    planets: 'Venus, Jupiter, 7th Lord',
    examples: ['Engagement', 'Marriage', 'Relationship milestones'],
  },
  {
    category: 'Health & Medical',
    icon: HeartPulse,
    events: '3-4 events',
    why: '6th/8th house validation for health crises',
    planets: 'Saturn, Mars, 6th/8th Lords',
    examples: ['Major illness', 'Surgery', 'Hospitalization', 'Recovery'],
  },
  {
    category: 'Property & Assets',
    icon: Home,
    events: '2-3 events',
    why: '4th house timing for real estate transactions',
    planets: 'Mars, 4th Lord',
    examples: ['Property purchase', 'House construction', 'Major move'],
  },
  {
    category: 'Education',
    icon: GraduationCap,
    events: '2-3 events',
    why: '4th/5th/9th houses for academic timing',
    planets: 'Mercury, Jupiter, 5th Lord',
    examples: ['Graduation', 'Higher education', 'Major exam'],
  },
  {
    category: 'Children & Family',
    icon: Baby,
    events: '2-3 events',
    why: '5th house validation for progeny timing',
    planets: 'Jupiter, 5th Lord',
    examples: ['Child birth', "Children's milestones"],
  },
  {
    category: 'Travel & Foreign',
    icon: Plane,
    events: '2-3 events',
    why: '3rd/9th/12th houses for travel timing',
    planets: 'Rahu, 9th/12th Lords',
    examples: ['Foreign travel', 'Relocation abroad', 'Pilgrimage'],
  },
  {
    category: 'Spiritual & Religious',
    icon: Landmark,
    events: '2-3 events',
    why: '9th/12th houses for spiritual evolution',
    planets: 'Ketu, Jupiter, 9th Lord',
    examples: ['Initiation', 'Major spiritual event', 'Religious ceremony'],
  },
];
