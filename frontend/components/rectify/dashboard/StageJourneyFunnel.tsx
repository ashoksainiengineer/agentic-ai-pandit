'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { Stage, StageHistory } from './types';
import { THEME } from './theme';

const DEFAULT_STAGES: Stage[] = [
    { id: 1, name: 'Grid Generation', candidates: 60, color: 'from-slate-500 to-slate-600' },
    { id: 2, name: 'Coarse Analysis', candidates: 15, color: 'from-orange-500 to-amber-600' },
    { id: 3, name: 'Fine Grid', candidates: 100, color: 'from-cyan-500 to-blue-600' },
    { id: 4, name: 'Deep Analysis', candidates: 7, color: 'from-blue-500 to-indigo-600' },
    { id: 5, name: 'Micro Grid', candidates: 77, color: 'from-violet-500 to-purple-600' },
    { id: 6, name: 'Final Selection', candidates: 1, color: 'from-amber-500 to-yellow-500' },
];

export function StageJourneyFunnel({ stageHistory }: { stageHistory?: StageHistory }) {
    const stages = useMemo(() => {
        if (!stageHistory) return DEFAULT_STAGES;
        return [
            { ...DEFAULT_STAGES[0], candidates: stageHistory.stage1Count || 60 },
            { ...DEFAULT_STAGES[1], candidates: stageHistory.stage2Count || 15 },
            { ...DEFAULT_STAGES[2], candidates: stageHistory.stage3Count || 100 },
            { ...DEFAULT_STAGES[3], candidates: stageHistory.stage4Count || 7 },
            { ...DEFAULT_STAGES[4], candidates: stageHistory.stage5Count || 77 },
            DEFAULT_STAGES[5],
        ];
    }, [stageHistory]);

    const maxCandidates = useMemo(() => Math.max(...stages.map(s => s.candidates)), [stages]);

    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                <Filter className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                Stage Journey Funnel
            </h4>
            <div className="space-y-3" role="list" aria-label="Processing stages">
                {stages.map((stage, idx) => {
                    const width = maxCandidates > 0 ? (stage.candidates / maxCandidates) * 100 : 0;
                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 group"
                            role="listitem"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all group-hover:bg-gold-50"
                                style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`, color: THEME.textMuted }}
                                aria-label={`Stage ${stage.id}`}
                            >
                                {stage.id}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span style={{ color: THEME.textMuted }} className="uppercase tracking-wider font-medium">{stage.name}</span>
                                    <span className="font-medium" style={{ color: THEME.gold }}>{stage.candidates} candidates</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: THEME.bg }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${width}%` }}
                                        transition={{ duration: 1.2, delay: idx * 0.1, ease: 'circOut' }}
                                        className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                                        role="progressbar"
                                        aria-valuenow={stage.candidates}
                                        aria-valuemin={0}
                                        aria-valuemax={maxCandidates}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <div className="mt-4 pt-4 text-center" style={{ borderTop: `1px solid ${THEME.border}` }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Convergence Ratio</div>
                <div className="text-2xl font-black tracking-tighter" style={{ color: THEME.gold }}>
                    {stages[0]?.candidates || 60} <span className="text-xs font-normal opacity-50">leads to</span> 1
                </div>
            </div>
        </div>
    );
}
