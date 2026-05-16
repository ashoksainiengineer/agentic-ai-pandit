'use client';

// components/rectify/CandidateComparisonView-fixed.tsx
// Production-grade candidate comparison with accessibility,
// keyboard navigation, and responsive design

import React, { useState, useMemo, memo, useId } from 'react';
import { motion } from 'framer-motion';
import { Scale, Check, AlertTriangle, Trophy, Medal, ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MinifiedEph {
    sun: string;
    moon: string;
    ascendant: string;
}

interface EventMatch {
    event: string;
    matches: boolean;
    dasha?: string;
}

export interface CandidateData {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    reason?: string;
    offsetMinutes?: number;
    minifiedEph?: MinifiedEph;
    d60?: string;
    boundaryDistance?: number;
    eventMatches?: EventMatch[];
}

interface CandidateComparisonViewProps {
    candidates: CandidateData[];
    onSelect?: (time: string) => void;
    'aria-label'?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS ICON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

type StatusType = 'match' | 'differ' | 'unknown';

const StatusIcon = memo(function StatusIcon({ status }: { status: StatusType }) {
    switch (status) {
        case 'match':
            return <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />;
        case 'differ':
            return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />;
        default:
            return <span className="w-3.5 h-3.5 text-black/60" aria-hidden="true">—</span>;
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CANDIDATE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateCardProps {
    candidate: CandidateData;
    rank: number;
    isWinner: boolean;
    onSelect?: () => void;
}

const CandidateCard = memo(function CandidateCard({
    candidate,
    rank,
    isWinner,
    onSelect,
}: CandidateCardProps) {
    const scoreColor = candidate.score >= 80 ? 'text-emerald-600' : candidate.score >= 60 ? 'text-amber-600' : 'text-rose-600';
    const barColor = candidate.score >= 80 ? 'bg-emerald-600' : candidate.score >= 60 ? 'bg-amber-600' : 'bg-rose-600';

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Candidate ${candidate.time}, Rank ${rank}, Score ${candidate.score.toFixed(1)}%${isWinner ? ', Winner' : ''}`}
            className={`
                bg-[#ffffff] rounded-xl p-3 sm:p-4 border cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[#000000]/50
                ${isWinner
                    ? 'border-[#000000]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'border-[rgba(0,0,0,0.08)] hover:border-[#000000]/30'
                }
            `}
        >
            {/* Header with rank */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                    {isWinner ? (
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-black" aria-hidden="true" />
                    ) : (
                        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-black/60" aria-hidden="true" />
                    )}
                    <span className="text-[10px] sm:text-xs text-black/60 font-medium uppercase">Rank #{rank}</span>
                </div>
                {isWinner && (
                    <span className="text-[8px] bg-[#000000]/20 text-black px-2 py-0.5 rounded-full font-medium uppercase">
                        Winner
                    </span>
                )}
            </div>

            {/* Time */}
            <div className="text-xl sm:text-2xl font-black text-black font-mono mb-2">
                <span className="tabular-nums">{candidate.time}</span>
            </div>

            {/* Score */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-black/60">Score</span>
                    <span className={`font-medium ${scoreColor}`}>
                        {candidate.score.toFixed(1)}%
                    </span>
                </div>
                <div
                    className="w-full bg-[rgba(0,0,0,0.08)] rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={candidate.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Score: ${candidate.score.toFixed(1)} percent`}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor}`}
                    />
                </div>
            </div>

            {/* Ephemeris Summary */}
            {candidate.minifiedEph && (
                <div className="space-y-1 text-[9px] sm:text-[10px] font-mono border-t border-[rgba(0,0,0,0.08)] pt-2 mt-2">
                    <div className="flex justify-between">
                        <span className="text-black/60" aria-label="Sun position">☉ Sun</span>
                        <span className="text-black/60">{candidate.minifiedEph.sun}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-black/60" aria-label="Moon position">☽ Moon</span>
                        <span className="text-black/60">{candidate.minifiedEph.moon}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-black/60" aria-label="Ascendant">↑ Asc</span>
                        <span className="text-black/60">{candidate.minifiedEph.ascendant}</span>
                    </div>
                </div>
            )}

            {/* Reason */}
            {candidate.reason && (
                <p className="text-[9px] sm:text-[10px] text-black/60 mt-2 line-clamp-2 italic">
                    &ldquo;{candidate.reason}&rdquo;
                </p>
            )}
        </motion.div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ComparisonRowProps {
    label: string;
    leftValue?: string;
    rightValue?: string;
}

const ComparisonRow = memo(function ComparisonRow({ label, leftValue, rightValue }: ComparisonRowProps) {
    const matches = leftValue === rightValue;
    const status: StatusType = !leftValue || !rightValue ? 'unknown' : matches ? 'match' : 'differ';

    return (
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]">
            <span className="w-16 sm:w-24 text-black/60 font-medium flex-shrink-0">{label}</span>
            <div
                className="flex-1 flex items-center justify-between gap-1 sm:gap-2 bg-white rounded-lg px-2 py-1 border border-[rgba(0,0,0,0.08)]"
                role="group"
                aria-label={`${label} comparison`}
            >
                <span className="font-mono text-black/60 truncate">{leftValue || '-'}</span>
                <span aria-label={matches ? 'Values match' : 'Values differ'}>
                    <StatusIcon status={status} />
                </span>
                <span className="font-mono text-black/60 truncate">{rightValue || '-'}</span>
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM SELECT COMPONENT (Accessible)
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateSelectProps {
    candidates: CandidateData[];
    selectedIndex: number;
    onChange: (index: number) => void;
    disabledIndex: number;
    label: string;
    selectId: string;
}

const CandidateSelect = memo(function CandidateSelect({
    candidates,
    selectedIndex,
    onChange,
    disabledIndex,
    label,
    selectId,
}: CandidateSelectProps) {
    return (
        <div className="relative">
            <label htmlFor={selectId} className="sr-only">
                {label}
            </label>
            <select
                id={selectId}
                value={selectedIndex}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full appearance-none bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-lg px-3 py-2 text-xs sm:text-sm text-black cursor-pointer hover:border-[#000000]/50 transition-colors pr-8 focus:outline-none focus:ring-2 focus:ring-[#000000]/30"
                aria-label={label}
            >
                {candidates.map((c, idx) => (
                    <option key={c.time} value={idx} disabled={idx === disabledIndex}>
                        {idx + 1}. {c.time} ({c.score.toFixed(1)}%)
                        {idx === disabledIndex ? ' (Already selected)' : ''}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none" aria-hidden="true" />
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CandidateComparisonView = memo(function CandidateComparisonView({
    candidates,
    onSelect,
    'aria-label': ariaLabel = 'Candidate Comparison',
}: CandidateComparisonViewProps) {
    const leftSelectId = useId();
    const rightSelectId = useId();

    // Memoized sorting
    const sortedCandidates = useMemo(() =>
        [...candidates].sort((a, b) => b.score - a.score),
        [candidates]
    );

    const [leftIndex, setLeftIndex] = useState(0);
    const [rightIndex, setRightIndex] = useState(1);

    const leftCandidate = sortedCandidates[leftIndex];
    const rightCandidate = sortedCandidates[rightIndex];

    // Reset indices if candidates change
    React.useEffect(() => {
        if (leftIndex >= sortedCandidates.length) setLeftIndex(0);
        if (rightIndex >= sortedCandidates.length) setRightIndex(Math.min(1, sortedCandidates.length - 1));
    }, [sortedCandidates.length, leftIndex, rightIndex]);

    // Can't compare if less than 2 candidates
    if (sortedCandidates.length < 2) {
        return (
            <div
                className="glass-card p-6 border border-[rgba(0,0,0,0.08)] text-center bg-white rounded-xl"
                role="alert"
                aria-live="polite"
            >
                <Scale className="w-8 h-8 text-black/60 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-black/60">At least 2 candidates required for comparison</p>
            </div>
        );
    }

    // Determine winner
    const winner = leftCandidate.score >= rightCandidate.score ? 'left' : 'right';
    const scoreDiff = Math.abs(leftCandidate.score - rightCandidate.score);
    const isClearWinner = scoreDiff > 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-5 border border-[#000000]/30 overflow-hidden bg-white rounded-xl"
            role="region"
            aria-label={ariaLabel}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                        aria-hidden="true"
                    >
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-medium text-black">Candidate Comparison</h3>
                        <p className="text-[10px] text-black/60 uppercase tracking-wider">Side-by-side analysis</p>
                    </div>
                </div>

                {/* Winner Badge */}
                <div
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-wider w-fit
                        ${isClearWinner ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}
                    role="status"
                    aria-label={isClearWinner ? 'Clear winner determined' : 'Close match between candidates'}
                >
                    {isClearWinner ? 'Clear Winner' : 'Close Match'}
                </div>
            </div>

            {/* Candidate Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <CandidateSelect
                    candidates={sortedCandidates}
                    selectedIndex={leftIndex}
                    onChange={setLeftIndex}
                    disabledIndex={rightIndex}
                    label="Select left candidate"
                    selectId={leftSelectId}
                />
                <CandidateSelect
                    candidates={sortedCandidates}
                    selectedIndex={rightIndex}
                    onChange={setRightIndex}
                    disabledIndex={leftIndex}
                    label="Select right candidate"
                    selectId={rightSelectId}
                />
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <CandidateCard
                    candidate={leftCandidate}
                    rank={leftIndex + 1}
                    isWinner={winner === 'left'}
                    onSelect={() => onSelect?.(leftCandidate.time)}
                />
                <CandidateCard
                    candidate={rightCandidate}
                    rank={rightIndex + 1}
                    isWinner={winner === 'right'}
                    onSelect={() => onSelect?.(rightCandidate.time)}
                />
            </div>

            {/* Detailed Differences */}
            <div className="mt-4 sm:mt-6 bg-[#ffffff] rounded-xl p-3 sm:p-4 border border-[rgba(0,0,0,0.08)]">
                <h4 className="text-[10px] text-black/60 uppercase tracking-wider font-medium mb-3">Key Differences</h4>
                <div className="space-y-2">
                    <ComparisonRow
                        label="Sun Position"
                        leftValue={leftCandidate.minifiedEph?.sun}
                        rightValue={rightCandidate.minifiedEph?.sun}
                    />
                    <ComparisonRow
                        label="Moon Position"
                        leftValue={leftCandidate.minifiedEph?.moon}
                        rightValue={rightCandidate.minifiedEph?.moon}
                    />
                    <ComparisonRow
                        label="Ascendant"
                        leftValue={leftCandidate.minifiedEph?.ascendant}
                        rightValue={rightCandidate.minifiedEph?.ascendant}
                    />
                    {leftCandidate.d60 && rightCandidate.d60 && (
                        <ComparisonRow
                            label="D60 Chart"
                            leftValue={leftCandidate.d60}
                            rightValue={rightCandidate.d60}
                        />
                    )}
                </div>
            </div>

            {/* AI Verdict */}
            <div className="mt-4 p-3 sm:p-4 bg-[#000000]/10 rounded-xl border border-[#000000]/30">
                <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-black mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                        <h4 className="text-sm font-medium text-black mb-1">AI Comparison Verdict</h4>
                        <p className="text-xs text-black/60 leading-relaxed">
                            <span className="font-medium">
                                {winner === 'left' ? leftCandidate.time : rightCandidate.time}
                            </span>
                            {' '}is preferred
                            {isClearWinner
                                ? ` with a significant ${scoreDiff.toFixed(1)}% lead. `
                                : ` by a narrow ${scoreDiff.toFixed(1)}% margin. `}
                            {leftCandidate.reason || rightCandidate.reason || 'Dasha correlation and event timing were primary factors in this determination.'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default CandidateComparisonView;
