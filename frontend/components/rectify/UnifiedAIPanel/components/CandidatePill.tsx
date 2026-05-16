import React, { memo } from 'react';
import { Radio } from 'lucide-react';
import { ScoreTier } from '../types';
import { TIER_CONFIG } from '../constants';

export const CandidatePill = memo(function CandidatePill({
    time,
    score,
    tier,
    isSelected,
    isLive,
    onClick,
}: {
    time: string;
    score: number;
    tier: ScoreTier;
    isSelected: boolean;
    isLive: boolean;
    onClick: () => void;
}) {
    const config = TIER_CONFIG[tier];

    return (
        <button
            onClick={onClick}
            className={`
        relative px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium
        transition-all duration-200 border
        ${isSelected
                    ? `${config.bgColor} ${config.color} ${config.borderColor} ring-2 ring-offset-1 ring-current/20 shadow-sm`
                    : 'bg-white text-black/60 border-[rgba(0,0,0,0.08)] hover:border-[#000000]/30 hover:text-black/60'
                }
      `}
        >
            {isLive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.pulseColor}`} />
                </span>
            )}
            <span className="flex items-center gap-1">
                {isLive && <Radio className="w-2.5 h-2.5 animate-pulse" />}
                {time}
                {score > 0 && (
                    <span className={`text-[8px] opacity-70 ${isSelected ? config.color : 'text-[#959595]'}`}>
                        {score.toFixed(0)}
                    </span>
                )}
            </span>
        </button>
    );
});
