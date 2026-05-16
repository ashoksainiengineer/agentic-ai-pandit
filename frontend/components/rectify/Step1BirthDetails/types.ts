import { BirthData, TimeOffsetConfig, SpouseData } from '@/lib/types';

export interface Step1Props {
    data: BirthData;
    updateData: (updates: Partial<BirthData>) => void;
    offsetConfig?: TimeOffsetConfig;
    updateOffset?: (config: TimeOffsetConfig) => void;
    spouseData?: SpouseData;
    updateSpouse?: (updates: Partial<SpouseData>) => void;
}
