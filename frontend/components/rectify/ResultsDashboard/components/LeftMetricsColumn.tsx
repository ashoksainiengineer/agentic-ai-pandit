import React from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { THEME } from '../../dashboard/theme';
import { StageJourneyFunnel } from '../../dashboard/StageJourneyFunnel';
import { EventMatchGrid } from '../../dashboard/EventMatchGrid';
import { ScoreAuditTable } from './ScoreAuditTable';
import { FinalResult, AnalysisDetails } from '../../dashboard/types';

interface LeftMetricsColumnProps {
    data: FinalResult;
    analysisDetails: AnalysisDetails | null;
}

export function LeftMetricsColumn({ data, analysisDetails }: LeftMetricsColumnProps) {
    return (
        <div className="lg:col-span-4 space-y-6">
            {/* Rectified Time Card */}
            <div
                className="rounded-xl p-8 text-center relative overflow-hidden group shadow-lg"
                style={{
                    backgroundColor: THEME.surface,
                    border: `2px solid ${THEME.gold}`,
                    boxShadow: `0 0 30px ${THEME.gold}10`
                }}
            >
                <div
                    className="absolute top-0 left-0 w-full h-1 opacity-50"
                    style={{ background: `linear-gradient(to right, transparent, ${THEME.gold}, transparent)` }}
                />

                <h3
                    className="uppercase tracking-[0.2em] text-xs mb-4 font-mono"
                    style={{ color: THEME.textMuted }}
                >
                    Rectified Birth Time
                </h3>
                <div
                    className="text-5xl font-medium font-mono tracking-tighter mb-4"
                    style={{ color: THEME.gold }}
                >
                    {data.rectifiedTime}
                </div>
                <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mb-3"
                    style={{
                        backgroundColor: `${THEME.gold}10`,
                        border: `1px solid ${THEME.gold}50`,
                        color: THEME.gold
                    }}
                >
                    <CheckCircle className="w-3 h-3" aria-hidden="true" />
                    Confidence: {data.accuracy}%
                </div>
                {data.accuracy > 90 && (
                    <div
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse mt-2"
                        style={{ color: THEME.gold }}
                    >
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        🔱 God-Tier Precision
                    </div>
                )}
            </div>

            {/* Technical Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="rounded-xl p-4 transition-all hover:shadow-md"
                    style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
                >
                    <div
                        className="text-[10px] uppercase font-mono mb-1"
                        style={{ color: THEME.textMuted }}
                    >
                        Process Stages
                    </div>
                    <div className="text-xl font-medium font-mono" style={{ color: THEME.textPrimary }}>
                        {data.stagesCompleted || 6} / 6
                    </div>
                </div>
                <div
                    className="rounded-xl p-4 transition-all hover:shadow-md"
                    style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
                >
                    <div
                        className="text-[10px] uppercase font-mono mb-1"
                        style={{ color: THEME.textMuted }}
                    >
                        Grid Resolution
                    </div>
                    <div className="text-xl font-medium font-mono" style={{ color: THEME.textPrimary }}>
                        ±{data.marginOfError || 3}s
                    </div>
                </div>
                <div
                    className="rounded-xl p-4 transition-all hover:shadow-md"
                    style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
                >
                    <div
                        className="text-[10px] uppercase font-mono mb-1"
                        style={{ color: THEME.textMuted }}
                    >
                        AI Model
                    </div>
                    <div className="text-sm font-medium font-mono" style={{ color: THEME.gold }}>DeepSeek R1</div>
                </div>
                <div
                    className="rounded-xl p-4 transition-all hover:shadow-md"
                    style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
                >
                    <div
                        className="text-[10px] uppercase font-mono mb-1"
                        style={{ color: THEME.textMuted }}
                    >
                        Confidence
                    </div>
                    <div
                        className="text-xl font-medium font-mono"
                        style={{ color: THEME.success }}
                    >
                        {data.confidence}
                    </div>
                </div>
            </div>

            {/* Stage Journey Funnel */}
            <StageJourneyFunnel stageHistory={analysisDetails?.stageHistory} />

            {/* Event Match Grid */}
            <EventMatchGrid analysisDetails={analysisDetails ?? undefined} />

            {/* Method Scores / Audit Table */}
            <ScoreAuditTable analysisDetails={analysisDetails} />
        </div>
    );
}
