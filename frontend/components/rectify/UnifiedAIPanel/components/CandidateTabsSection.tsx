import React, { memo, useState, useCallback } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { ScoreTier, GroupedCandidates } from '../types';
import { TIER_CONFIG } from '../constants';
import { CandidatePill } from './CandidatePill';

export const CandidateTabsSection = memo(function CandidateTabsSection({
    groupedCandidates,
    selectedCandidate,
    liveCandidate,
    onSelect,
    stage,
}: {
    groupedCandidates: GroupedCandidates;
    selectedCandidate: string | null;
    liveCandidate: string | null;
    onSelect: (time: string) => void;
    stage?: number;
}) {
    const [expandedTiers, setExpandedTiers] = useState<Set<ScoreTier>>(new Set(['top', 'promising']));

    const toggleTier = useCallback((tier: ScoreTier) => {
        setExpandedTiers(prev => {
            const next = new Set(prev);
            if (next.has(tier)) next.delete(tier);
            else next.add(tier);
            return next;
        });
    }, []);

    const totalCandidates =
        groupedCandidates.top.length +
        groupedCandidates.promising.length +
        groupedCandidates.exploring.length +
        groupedCandidates.rejected.length;

    if (totalCandidates === 0) return null;

    return (
        <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-black/60" />
                <span className="text-[10px] text-black/60 uppercase tracking-wider font-medium">
                    Candidates ({totalCandidates})
                </span>
            </div>

            <div className="space-y-2">
                {(['top', 'promising', 'exploring', 'rejected'] as ScoreTier[]).map(tier => {
                    const candidates = groupedCandidates[tier];
                    if (candidates.length === 0) return null;

                    const config = TIER_CONFIG[tier];
                    const isExpanded = expandedTiers.has(tier);
                    const displayedCount = isExpanded ? candidates.length : Math.min(5, candidates.length);
                    const hasMore = candidates.length > 5;

                    return (
                        <div key={tier}>
                            <button
                                onClick={() => toggleTier(tier)}
                                className="flex items-center gap-2 mb-1.5 group"
                            >
                                <span className={`text-[9px] font-medium uppercase tracking-wider ${config.color}`}>
                                    {config.label}
                                </span>
                                <span className="text-[9px] text-[#959595]">
                                    ({candidates.length})
                                </span>
                                {hasMore && (
                                    <>
                                        {isExpanded ? (
                                            <ChevronUp className="w-3 h-3 text-[#959595] group-hover:text-black/60" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 text-[#959595] group-hover:text-black/60" />
                                        )}
                                    </>
                                )}
                            </button>

                            <div className="flex flex-wrap gap-1.5">
                                {candidates.slice(0, displayedCount).map(({ time, score }) => (
                                    <CandidatePill
                                        key={`s${stage}_${time}`}
                                        time={time}
                                        score={score}
                                        tier={tier}
                                        isSelected={selectedCandidate === time}
                                        isLive={liveCandidate === time}
                                        onClick={() => onSelect(time)}
                                    />
                                ))}
                                {hasMore && !isExpanded && (
                                    <button
                                        onClick={() => toggleTier(tier)}
                                        className="px-2 py-1 text-[10px] text-black/60 hover:text-black/60"
                                    >
                                        +{candidates.length - 5} more
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
