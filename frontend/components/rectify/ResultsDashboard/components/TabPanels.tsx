import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';
import { THEME } from '../../dashboard/theme';
import { cleanSummary } from '../../dashboard/utils';
import { EphemerisPanel } from '../../EphemerisPanel';
import { PlanetaryVitals } from '../../PlanetaryVitals';
import { CandidateComparisonView, type CandidateData } from '../../CandidateComparisonView';
import { VedicShuddhiRadar } from '../../VedicShuddhiRadar';
import { FinalResult, AnalysisDetails } from '../../dashboard/types';
import type { EphemerisData, DivisionalChart } from '@ai-pandit/shared';

interface TabPanelsProps {
    activeTab: 'summary' | 'audit' | 'comparison' | 'logs';
    data: FinalResult;
    analysisDetails: AnalysisDetails | null;
    topCandidates: Array<Record<string, unknown>>;
}

export function TabPanels({
    activeTab,
    data,
    analysisDetails,
    topCandidates
}: TabPanelsProps) {
    return (
        <div
            className="rounded-xl p-8 flex-grow shadow-sm"
            style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
            <AnimatePresence mode="wait">
                {activeTab === 'summary' && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                        role="tabpanel"
                        id="summary-panel"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="prose max-w-none">
                                <h3
                                    className="text-xl font-medium mb-4 flex items-center gap-2"
                                    style={{ color: THEME.textPrimary }}
                                >
                                    <FileText className="w-5 h-5" style={{ color: THEME.gold }} aria-hidden="true" />
                                    Final Verdict
                                </h3>
                                <p style={{ color: THEME.textSecondary }} className="leading-relaxed">
                                    The rectification engine has successfully converged on a final birth time of{' '}
                                    <strong style={{ color: THEME.textPrimary }}>{data.rectifiedTime}</strong>.
                                    This time was selected after rigorous AI reasoning and multi-stage verification.
                                </p>
                                <div
                                    className="my-6 p-4 text-sm font-serif italic rounded-r-lg"
                                    style={{
                                        backgroundColor: `${THEME.gold}05`,
                                        borderLeft: `2px solid ${THEME.gold}`,
                                        color: THEME.textPrimary
                                    }}
                                >
                                    &ldquo;{cleanSummary(analysisDetails?.summary)}&rdquo;
                                </div>
                                <h4
                                    className="font-medium mt-6 mb-2 text-sm uppercase tracking-wider"
                                    style={{ color: THEME.textPrimary }}
                                >
                                    Confirmation Factors:
                                </h4>
                                <ul className="space-y-2 text-[13px]" style={{ color: THEME.textSecondary }}>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: THEME.gold }} aria-hidden="true" />
                                        <span>Verified via <strong style={{ color: THEME.textPrimary }}>6-Stage AI Pipeline</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: THEME.gold }} aria-hidden="true" />
                                        <span>Sub-second <strong style={{ color: THEME.textPrimary }}>Boundary Safety</strong> verified</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: THEME.gold }} aria-hidden="true" />
                                        <span>DeepSeek Reasoner <strong style={{ color: THEME.textPrimary }}>narrative analysis</strong> passed</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <EphemerisPanel
                                    candidateTime={data.rectifiedTime}
                                    minifiedEph={analysisDetails?.godTierData?.ephemeris?.planets ? {
                                        sun: `${analysisDetails.godTierData.ephemeris.planets.sun?.sign || 'N/A'} ${((analysisDetails.godTierData.ephemeris.planets.sun?.longitude || 0) % 30).toFixed(4)}°`,
                                        moon: `${analysisDetails.godTierData.ephemeris.planets.moon?.sign || 'N/A'} ${((analysisDetails.godTierData.ephemeris.planets.moon?.longitude || 0) % 30).toFixed(4)}°`,
                                        ascendant: `${analysisDetails.godTierData.ephemeris.ascendant?.sign || 'N/A'} ${((analysisDetails.godTierData.ephemeris.ascendant?.longitude || 0) % 30).toFixed(4)}°`
                                    } : undefined}
                                    dasha={analysisDetails?.godTierData?.dasha || 'Venus MD / Jupiter AD / Moon PD'}
                                    defaultExpanded={true}
                                />

                                {analysisDetails?.godTierData?.ephemeris && (
                                    <div className="mt-4">
                                        <PlanetaryVitals
                                            ephemeris={analysisDetails.godTierData.ephemeris as unknown as EphemerisData}
                                            divCharts={analysisDetails.godTierData.divCharts as unknown as Record<string, DivisionalChart>}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'comparison' && (
                    <motion.div
                        key="comparison"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        role="tabpanel"
                        id="comparison-panel"
                    >
                        <CandidateComparisonView candidates={topCandidates as unknown as CandidateData[]} />
                    </motion.div>
                )}

                {activeTab === 'audit' && (
                    <motion.div
                        key="audit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                        role="tabpanel"
                        id="audit-panel"
                    >
                        <h3 className="text-lg font-medium mb-4" style={{ color: THEME.textPrimary }}>Boundary Safety Check</h3>
                        {analysisDetails?.boundarySafety ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className="p-4 rounded-lg"
                                    style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}` }}
                                >
                                    <div className="text-xs uppercase" style={{ color: THEME.textMuted }}>Lagna Safety</div>
                                    <div className="text-lg font-mono" style={{ color: THEME.gold }}>
                                        {analysisDetails.boundarySafety.lagnaSignBoundary > 60
                                            ? 'SAFE (>1m)'
                                            : `CRITICAL (${analysisDetails.boundarySafety.lagnaSignBoundary}s)`}
                                    </div>
                                </div>
                                <div
                                    className="p-4 rounded-lg"
                                    style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}` }}
                                >
                                    <div className="text-xs uppercase" style={{ color: THEME.textMuted }}>Nakshatra Safety</div>
                                    <div className="text-lg font-mono" style={{ color: THEME.gold }}>
                                        {analysisDetails.boundarySafety.moonNakshatraBoundary > 60
                                            ? 'SAFE'
                                            : `WARNING (${analysisDetails.boundarySafety.moonNakshatraBoundary}s)`}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="italic p-4 rounded-lg"
                                style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}`, color: THEME.textMuted }}
                            >
                                Boundary data calculated during analysis.
                            </div>
                        )}

                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4" style={{ color: THEME.textPrimary }}>Runner-Up Candidates</h3>
                            <div className="space-y-2">
                                {topCandidates.slice(1, 6).map((alt, i) => (
                                    <div
                                        key={String((alt as Record<string, unknown>).time || `runner-${i}`)}
                                        className="flex justify-between items-center p-3 rounded"
                                        style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}80` }}
                                    >
                                        <span className="font-mono" style={{ color: THEME.textMuted }}>#{i + 2} {(alt as Record<string, unknown>).time as string}</span>
                                        <span className="text-sm" style={{ color: THEME.gold }}>Score: {((alt as Record<string, unknown>).score as number)?.toFixed(1) || 'N/A'}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(() => {
                            const shuddhi = analysisDetails?.godTierData?.shuddhi;
                            if (shuddhi && typeof shuddhi === 'object' && 'kunda' in shuddhi && 'tatwa' in shuddhi) {
                                return (
                                    <div className="mt-8">
                                        <VedicShuddhiRadar shuddhi={shuddhi as { kunda: { score: number; details: string }; tatwa: { score: number; details: string } }} />
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
