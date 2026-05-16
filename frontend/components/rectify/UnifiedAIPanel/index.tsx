'use client';

import React, { useState, useMemo, useCallback, memo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { STAGES } from '@/lib/constants/stages';

import { UnifiedAIPanelProps } from './types';
import { ReasoningGrid } from './components/ReasoningGrid';
import { ReasoningContent } from './components/ReasoningContent';

export const UnifiedAIPanel = memo(function UnifiedAIPanel({
    thinking,
    stageHistory,
    isActive,
    stage,
    allCandidates,
    onSelectCandidate,
    candidateScores,
    unifiedMode = true,
    title = 'Intelligence Grid',
    isCompleted = false,
    offsetMinutes = 60,
}: UnifiedAIPanelProps) {
    const panelId = useId();
    const [localSelectedCandidate, setLocalSelectedCandidate] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 🔱 USER PREFERENCE: Auto-collapse on completion removed. 
    // Panels stay open with card view for manual review.

    // DELETED: Auto-focus logic removed per user request:
    // "apne aap card khulna nahi chaiye batch ka, user jab click kare tab hi"
    // This previously forced the detail view to open whenever a new candidate was processed.

    const currentStage = thinking?.stage || stage || 2;
    const effectiveSelectedCandidate = localSelectedCandidate;

    const candidatesList = useMemo(
        () => Object.keys(allCandidates || {}),
        [allCandidates]
    );

    const handleCandidateSelect = useCallback((time: string) => {
        setLocalSelectedCandidate(time);
        setIsFocused(true);
        if (onSelectCandidate) onSelectCandidate(time);
    }, [onSelectCandidate]);

    const displayedContent = useMemo(() => {
        const getSafeText = (text: string | undefined | null) => {
            if (!text) return '';
            return text.length > 100000 ? text.slice(-100000) : text;
        };

        if (allCandidates && effectiveSelectedCandidate) {
            const candidateData = allCandidates[effectiveSelectedCandidate];
            return candidateData?.fullText ? getSafeText(candidateData.fullText) : '';
        }

        const stageNum = stage || currentStage;
        if (stageHistory && stageHistory[stageNum]) {
            return getSafeText(stageHistory[stageNum]);
        }

        return thinking ? getSafeText(thinking.fullText) : '';
    }, [allCandidates, effectiveSelectedCandidate, thinking, stageHistory, stage, currentStage]);

    if (!unifiedMode) {
        return (
            <div className="space-y-3" role="region" aria-labelledby={`${panelId}-title`}>
                <p className="text-sm text-black/60">Accordion mode not implemented</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: 0,
                boxShadow: isActive
                    ? '0 0 30px rgba(184, 134, 11, 0.15)'
                    : '0 0 20px rgba(184, 134, 11, 0.08)'
            }}
            className={`bg-white rounded-2xl border transition-all duration-500 overflow-hidden ${isActive ? 'border-[#000000]' : 'border-[#000000]/40 shadow-sm'}`}
            role="region"
            aria-labelledby={`${panelId}-title`}
        >
            <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${isCompleted ? 'bg-[#FAF8F5] border-[#E8E2D9]' : 'bg-gradient-to-r from-[#FAF8F5] to-white border-[rgba(0,0,0,0.08)]'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-stone-100' : 'bg-[#000000]/10'}`}>
                        <Brain className={`w-5 h-5 ${isCompleted ? 'text-stone-400' : 'text-black'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 id={`${panelId}-title`} className={`text-base font-medium truncate ${isCompleted ? 'text-black/60' : 'text-black'}`}>
                                {title || (STAGES[stage ?? 0]?.name || `Stage ${stage} Analysis`)}
                            </h3>
                            {(() => {
                                const stageNum = currentStage;
                                let phaseLabel = '';
                                if (stageNum <= 2) {
                                    phaseLabel = offsetMinutes > 120 ? 'Macro Phase: Broad scanning of large time ranges.' : (offsetMinutes > 15 ? 'Meso Phase: Intermediate narrowing of candidate groups.' : 'Micro Phase: Extreme precision testing of remaining winners.');
                                } else if (stageNum === 4) {
                                    phaseLabel = 'Meso Phase: Intermediate narrowing of candidate groups.';
                                } else if (stageNum >= 5) {
                                    phaseLabel = 'Micro Phase: Extreme precision testing of remaining winners.';
                                }
                                if (!phaseLabel) return null;
                                return (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shrink-0 ${isCompleted ? 'bg-[#6B6560]/10 text-[#6B6560]' : 'bg-[#C65D3B]/10 text-[#C65D3B]'}`}>
                                        {phaseLabel}
                                    </span>
                                );
                            })()}
                        </div>

                        {!isCompleted && isActive && candidatesList.length > 0 && (
                            <div className="mt-1.5 max-w-[200px]">
                                <div className="flex items-center justify-between text-[8px] font-medium text-black/60 mb-0.5 uppercase tracking-tighter">
                                    <span>Batch Progress</span>
                                    <span>{candidatesList.length} Processed</span>
                                </div>
                                <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (candidatesList.length / 100) * 100)}%` }}
                                        className="h-full bg-black"
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-[10px] text-black/60 mt-0.5 truncate">
                            {isCompleted ? 'Stage processing completed' : (isActive ? `Processing ${candidatesList.length} candidates` : 'Multi-stream history')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isFocused && (
                        <button
                            onClick={() => setIsFocused(false)}
                            className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                        >
                            ← Back to Grid
                        </button>
                    )}
                    {isActive && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-[#184131]/10 rounded-full"
                        >
                            <Activity className="w-3 h-3 text-[#184131]" />
                            <span className="text-[10px] font-medium text-[#184131]">LIVE</span>
                        </motion.div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-stone-200/50 text-stone-400 transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <AnimatePresence mode="wait">
                            {!isFocused ? (
                                <motion.div
                                    key="grid-view"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {!isCompleted && thinking?.candidateTime === 'general' && (
                                        <div className="px-5 py-3 bg-[#FCFBF9] border-b border-[rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-medium text-amber-700 uppercase tracking-widest">Global Reasoning</span>
                                            </div>
                                            <div className="text-[11px] text-black/60 line-clamp-2 italic font-mono">
                                                {thinking.fullText}
                                            </div>
                                        </div>
                                    )}

                                    <ReasoningGrid
                                        candidates={allCandidates || {}}
                                        liveCandidate={thinking?.candidateTime || null}
                                        onFocus={handleCandidateSelect}
                                        isStageCompleted={isCompleted}
                                        isStageActive={isActive}
                                        candidateScores={candidateScores}
                                        stage={stage}
                                    />

                                    {candidatesList.length === 0 && (
                                        <ReasoningContent content="" isActive={isActive && !isCompleted} />
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="focus-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="px-5 py-3 bg-amber-50/30 border-b border-amber-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-black font-mono flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${thinking?.candidateTime === effectiveSelectedCandidate ? 'bg-green-500 animate-pulse' : 'bg-[#000000]'}`} />
                                                {effectiveSelectedCandidate}
                                            </span>
                                            <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium uppercase">
                                                Technical Reasoning
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setIsFocused(false)}
                                            className="text-[10px] text-black/60 hover:text-black transition-colors"
                                        >
                                            Close Full View ×
                                        </button>
                                    </div>

                                    <ReasoningContent
                                        content={displayedContent}
                                        isActive={(() => {
                                            if (!isActive || isCompleted) return false;
                                            if (thinking?.candidateTime === effectiveSelectedCandidate) return true;
                                            const data = effectiveSelectedCandidate ? allCandidates?.[effectiveSelectedCandidate] : null;
                                            if (data?.updatedAt && (Date.now() - data.updatedAt < 3000)) return true;
                                            return false;
                                        })()}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default UnifiedAIPanel;
