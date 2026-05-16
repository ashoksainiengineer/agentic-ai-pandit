import { LifeEvent, TimeOffsetConfig } from '@/lib/types';

export interface Step2Props {
    lifeEvents: LifeEvent[];
    updateEvents: (events: LifeEvent[]) => void;
    offsetConfig?: TimeOffsetConfig;
}

export type DatePrecision = 'exact_date_time' | 'exact_date' | 'date_range' | 'month_year' | 'month_range' | 'year_range';
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';
