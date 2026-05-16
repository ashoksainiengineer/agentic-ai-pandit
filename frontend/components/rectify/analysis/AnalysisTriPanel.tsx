'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Trophy,
    Orbit,
    ChevronDown,
    ChevronUp,
    Radio,
    Zap,
} from 'lucide-react';
import type {
    CandidateScore,
    AIThinking,
    StreamStep,
} from '@/lib/store/stream-types';
import { ReasoningContent } from '@/components/rectify/UnifiedAIPanel/components/ReasoningContent';
import { STAGES } from '@/lib/constants/stages';
import { formatSignDegree } from '@/lib/utils/astrology';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

interface AnalysisTriPanelProps {
    /** Current active stage number */
    stage: number;
    /** All candidate scores for leaderboard */
    candidateScores: CandidateScore[];
    /** Sorted candidate scores */
    sortedCandidateScores: CandidateScore[];
    /** Current stage's AI thinking data */
    stageCandidates: Record<string, AIThinking>;
    /** Stage history for display */
    stageHistory: Record<number, string>;
    /** Whether this stage is currently active */
    isActive: boolean;
    /** Whether this stage is completed */
    isCompleted: boolean;
    /** All steps definition */
    allSteps: StreamStep[];
    /** Session ID for ephemeris fetching */
    sessionId: string;
    /** Stage name override */
    title?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

/** Left panel: AI Reasoning Engine — terminal console */
const ReasoningPanel = memo(function ReasoningPanel({
    stageCandidates,
    stageHistory,
    stage,
    isActive,
}: {
    stageCandidates: Record<string, AIThinking>;
    stageHistory: Record<number, string>;
    stage: number;
    isActive: boolean;
}) {
    // Get the latest thinking data for this stage
    const activeThinking = useMemo(() => {
        const entries = Object.values(stageCandidates);
        if (entries.length === 0) return null;
        return entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    }, [stageCandidates]);

    const displayText = useMemo(() => {
        if (activeThinking) return activeThinking.fullText;
        if (stageHistory?.[stage]) return stageHistory[stage];
        return '';
    }, [activeThinking, stageHistory, stage]);

    return (
        <div className="flex flex-col h-full bg-[#141416] rounded-xl border border-[#2C2C30] overflow-hidden shadow-lg">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1E] border-b border-[#2C2C30] shrink-0">
                <div className="w-7 h-7 rounded-md bg-[#C65D3B]/15 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-[#C65D3B]" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-[11px] font-medium text-[#D4CFC9] uppercase tracking-wider truncate">
                        AI REASONING ENGINE
                    </h3>
                </div>
                {isActive && (
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-[#C65D3B]/10 rounded-full border border-[#C65D3B]/20"
                    >
                        <Radio className="w-2 h-2 text-[#C65D3B]" />
                        <span className="text-[8px] font-medium text-[#C65D3B] uppercase">Live</span>
                    </motion.div>
                )}
            </div>

            {/* Terminal console body */}
            <div className="flex-1 min-h-0">
                <ReasoningContent
                    content={displayText}
                    isActive={isActive}
                    chunks={activeThinking?.chunks}
                    terminalMode={true}
                />
            </div>
        </div>
    );
});

/** Center panel: Candidate Birth Times leaderboard — compact */
const CandidatesPanel = memo(function CandidatesPanel({
    scores,
    stage,
    isCompleted: _isCompleted,
}: {
    scores: CandidateScore[];
    stage: number;
    isCompleted: boolean;
}) {
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

    const toggleExpand = (time: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(time)) next.delete(time);
            else next.add(time);
            return next;
        });
    };

    // Filter to this stage only
    const stageScores = useMemo(() => {
        const unique = new Map<string, CandidateScore>();
        scores.forEach(s => {
            if (s.stage !== stage) return;
            const existing = unique.get(s.time);
            if (!existing || s.score > existing.score) unique.set(s.time, s);
        });
        return Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 12);
    }, [scores, stage]);

    if (stageScores.length === 0) {
        return (
            <div className="flex flex-col h-full bg-[#FFFCF9] rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border-b border-[rgba(0,0,0,0.06)] shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-[#6B6560]" />
                    <h3 className="text-[11px] font-medium text-[#1A1A1E] uppercase tracking-wider">Candidates</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[11px] text-[#8A837D] font-medium uppercase tracking-wider">
                        Awaiting candidates...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FFFCF9] rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF8F5] border-b border-[rgba(0,0,0,0.06)] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#C65D3B]/10 flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 text-[#C65D3B]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-medium text-[#1A1A1E] uppercase tracking-wider">
                            CANDIDATE BIRTH TIMES
                        </h3>
                        <p className="text-[9px] text-[#8A837D] font-mono">
                            {stageScores.length} candidates
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-mono text-[#6B6560] bg-white px-2 py-0.5 rounded border border-[rgba(0,0,0,0.06)]">
                    S{stage}
                </span>
            </div>

            {/* Candidate list */}
            <div className="flex-1 min-h-0 overflow-y-auto style-scroll">
                <div className="p-2 space-y-1">
                    {stageScores.map((s, idx) => {
                        const isExpanded = expanded.has(s.time);
                        return (
                            <div key={s.time} className="group">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`
                                        rounded-lg border transition-all duration-200
                                        ${isExpanded
                                            ? 'border-[#C65D3B]/30 bg-[#C65D3B]/[0.03]'
                                            : 'border-[rgba(0,0,0,0.04)] bg-white hover:border-[#C65D3B]/20'
                                        }
                                    `}
                                >
                                    <div
                                        className="px-3 py-2 flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleExpand(s.time)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[9px] font-mono text-[#8A837D] w-4 shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className={`
                                                text-[13px] font-mono font-medium truncate
                                                ${idx === 0 && s.score > 0 ? 'text-[#C65D3B]' : 'text-[#1A1A1E]'}
                                            `}>
                                                {s.time}
                                            </span>
                                            {idx === 0 && s.score > 0 && (
                                                <Zap className="w-2.5 h-2.5 text-[#C65D3B] shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {s.score > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-10 h-1 bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${s.score}%` }}
                                                            className={`h-full rounded-full ${s.score > 85 ? 'bg-[#184131]' : 'bg-[#C65D3B]'}`}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-mono font-medium text-[#6B6560]">
                                                        {s.score.toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                            {isExpanded ? (
                                                <ChevronUp className="w-3 h-3 text-[#8A837D]" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3 text-[#8A837D]" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="border-t border-[rgba(0,0,0,0.04)] px-3 py-2 bg-[#FAF8F5]/50">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {s.minifiedEph?.ascendant && (
                                                    <span className="text-[9px] text-[#6B6560] font-mono">
                                                        ASC: <span className="text-[#1A1A1E] font-medium">{s.minifiedEph.ascendant}</span>
                                                    </span>
                                                )}
                                                {s.minifiedEph?.sun && (
                                                    <span className="text-[9px] text-[#6B6560] font-mono">
                                                        SUN: <span className="text-[#1A1A1E] font-medium">{formatSignDegree(s.minifiedEph.sun)}</span>
                                                    </span>
                                                )}
                                                {s.minifiedEph?.moon && (
                                                    <span className="text-[9px] text-[#6B6560] font-mono">
                                                        MOON: <span className="text-[#1A1A1E] font-medium">{s.minifiedEph.moon.split(' ')[0]}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

/** Right panel: Ephemeris Data — compact table for top candidate */
const EphemerisPanel = memo(function EphemerisPanel({
    topCandidate,
    stage,
}: {
    topCandidate: CandidateScore | null;
    stage: number;
}) {
    if (!topCandidate || !topCandidate.minifiedEph) {
        return (
            <div className="flex flex-col h-full bg-[#FFFCF9] rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border-b border-[rgba(0,0,0,0.06)] shrink-0">
                    <Orbit className="w-3.5 h-3.5 text-[#6B6560]" />
                    <h3 className="text-[11px] font-medium text-[#1A1A1E] uppercase tracking-wider">Ephemeris</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[11px] text-[#8A837D] font-medium uppercase tracking-wider">
                        No ephemeris data yet
                    </p>
                </div>
            </div>
        );
    }

    const eph = topCandidate.minifiedEph;
    const planetEntries = [
        { name: 'Ascendant', value: eph.ascendant },
        { name: 'Sun', value: eph.sun },
        { name: 'Moon', value: eph.moon },
    ];

    return (
        <div className="flex flex-col h-full bg-[#FFFCF9] rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF8F5] border-b border-[rgba(0,0,0,0.06)] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#184131]/10 flex items-center justify-center">
                        <Orbit className="w-3.5 h-3.5 text-[#184131]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-medium text-[#1A1A1E] uppercase tracking-wider">
                            EPHEMERIS DATA
                        </h3>
                        <p className="text-[9px] text-[#8A837D] font-mono">
                            Top: {topCandidate.time}
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-mono text-[#184131] font-medium">
                    {topCandidate.score > 0 ? `${topCandidate.score.toFixed(1)}%` : '---'}
                </span>
            </div>

            {/* Ephemeris table */}
            <div className="flex-1 min-h-0 overflow-y-auto style-scroll p-3">
                <div className="space-y-1">
                    {planetEntries.map((planet, idx) => (
                        <motion.div
                            key={planet.name}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.04)] hover:border-[#C65D3B]/20 transition-colors"
                        >
                            <span className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">
                                {planet.name}
                            </span>
                            <span className="text-[11px] font-mono font-medium text-[#1A1A1E]">
                                {formatSignDegree(planet.value)}
                            </span>
                        </motion.div>
                    ))}

                    {/* Score detail */}
                    <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.04)]">
                            <span className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">
                                Stage Score
                            </span>
                            <span className="text-[11px] font-mono font-medium text-[#C65D3B]">
                                {topCandidate.score > 0 ? `${topCandidate.score.toFixed(1)}%` : 'PENDING'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.04)] mt-1">
                            <span className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wider">
                                Stage
                            </span>
                            <span className="text-[11px] font-mono font-medium text-[#1A1A1E]">
                                {STAGES[stage]?.name || `Stage ${stage}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ────────────────────────────────────────────────────────────────────────────
// MAIN TRI-PANEL COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export const AnalysisTriPanel = memo(function AnalysisTriPanel({
    stage,
    sortedCandidateScores,
    stageCandidates,
    stageHistory,
    isActive,
    isCompleted: _isCompleted,
    allSteps,
    title,
}: AnalysisTriPanelProps) {
    // Top candidate for ephemeris panel
    const topCandidate = useMemo(() => {
        const stageScores = sortedCandidateScores.filter(s => s.stage === stage);
        if (stageScores.length === 0) return sortedCandidateScores[0] || null;
        return stageScores[0];
    }, [sortedCandidateScores, stage]);

    const stepDef = allSteps?.[stage]
        ? allSteps[stage]
        : { id: `stage-${stage}`, name: title || STAGES[stage]?.name || `Stage ${stage}` };

    return (
        <motion.div
            id={`stage-${stage}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-8 last:mb-0"
        >
            {/* Stage header with indicator */}
            <div className="flex items-center gap-2 mb-4">
                <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-all duration-500
                    ${isActive
                        ? 'bg-[#C65D3B] border-[#C65D3B]/30 text-white shadow-sm ring-4 ring-[#C65D3B]/10'
                        : _isCompleted
                            ? 'bg-[#184131] border-[#184131]/20 text-white'
                            : 'bg-white border-[rgba(0,0,0,0.08)] text-[#8A837D]'
                    }
                `}>
                    {stage}
                </div>
                <h3 className={`
                    text-xs font-medium uppercase tracking-widest
                    ${isActive ? 'text-[#C65D3B]' : 'text-[#6B6560]'}
                `}>
                    {stepDef.name}
                </h3>
                {isActive && (
                    <span className="text-[9px] font-mono text-[#8A837D] ml-auto">
                        Stage {stage} of 6
                    </span>
                )}
            </div>

            {/* Three panels grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '420px' }}>
                {/* LEFT: AI Reasoning Engine */}
                <ReasoningPanel
                    stageCandidates={stageCandidates}
                    stageHistory={stageHistory}
                    stage={stage}
                    isActive={isActive}
                />

                {/* CENTER: Candidate Birth Times */}
                <CandidatesPanel
                    scores={sortedCandidateScores}
                    stage={stage}
                    isCompleted={_isCompleted}
                />

                {/* RIGHT: Ephemeris Data */}
                <EphemerisPanel
                    topCandidate={topCandidate}
                    stage={stage}
                />
            </div>
        </motion.div>
    );
});

export default AnalysisTriPanel;
