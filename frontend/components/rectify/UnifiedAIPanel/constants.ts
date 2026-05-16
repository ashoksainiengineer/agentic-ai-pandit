import { ScoreTier } from './types';

export const TIER_CONFIG: Record<
    ScoreTier,
    { label: string; color: string; bgColor: string; borderColor: string; pulseColor: string }
> = {
    top: {
        label: 'Top / Promoted: Candidates moving to the next verification layer.',
        color: 'text-[#184131]',
        bgColor: 'bg-[#184131]/[0.06]',
        borderColor: 'border-[#184131]/30',
        pulseColor: 'bg-[#184131]',
    },
    promising: {
        label: 'Promising: Candidates currently under active scoring.',
        color: 'text-[#C65D3B]',
        bgColor: 'bg-[#C65D3B]/[0.06]',
        borderColor: 'border-[#C65D3B]/30',
        pulseColor: 'bg-[#C65D3B]',
    },
    exploring: {
        label: 'Exploring: Low-probability candidates still being scanned for anomalies.',
        color: 'text-[#6B6560]',
        bgColor: 'bg-[#6B6560]/[0.06]',
        borderColor: 'border-[#6B6560]/20',
        pulseColor: 'bg-[#6B6560]',
    },
    rejected: {
        label: 'Rejected / Eliminated: Candidates discarded due to logical inconsistencies.',
        color: 'text-[#8A837D]',
        bgColor: 'bg-[#8A837D]/[0.06]',
        borderColor: 'border-[#8A837D]/20',
        pulseColor: 'bg-[#8A837D]',
    },
};

export const CARD_PREVIEW_CHARS = 300;
export const VIRTUAL_ROW_HEIGHT = 192;
