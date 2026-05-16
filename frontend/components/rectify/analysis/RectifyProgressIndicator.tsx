'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Zap,
    CheckCircle,
    XCircle,
    RefreshCw,
    Home,
    ChevronRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { StreamProgress, StreamResult, StreamMetadata } from '@/lib/store/stream-types';

const AnalysisStatusBanner = dynamic(() => import('@/components/rectify/analysis/AnalysisStatusBanner').then(mod => mod.AnalysisStatusBanner), { ssr: false });

interface RectifyProgressIndicatorProps {
    progress: StreamProgress | null;
    candidateScoresLength: number;
    totalCandidates: number;
    analyzedCount: number;
    elapsedSeconds: number;
    isConnected: boolean;
    isComplete: boolean;
    activeAIStage: number | null;
    offsetMinutes: number;
    cancelled: boolean;
    metadata?: StreamMetadata;
    result: StreamResult | null;
    sessionId: string;
    isCancelling: boolean;
    onRestart: () => void;
}

export const RectifyProgressIndicator = memo(function RectifyProgressIndicator({
    progress,
    candidateScoresLength,
    totalCandidates,
    analyzedCount,
    elapsedSeconds,
    isConnected,
    isComplete,
    activeAIStage,
    offsetMinutes,
    cancelled,
    metadata,
    result,
    sessionId,
    isCancelling,
    onRestart,
}: RectifyProgressIndicatorProps) {
    return (
        <>
            <AnalysisStatusBanner
                currentStage={progress?.stepIndex ?? 0}
                candidateCount={candidateScoresLength}
                totalCandidates={totalCandidates || 100}
                analyzedCount={analyzedCount}
                elapsedSeconds={elapsedSeconds}
                isConnected={isConnected}
                isComplete={isComplete}
                activeAIStage={activeAIStage}
                offsetMinutes={offsetMinutes}
            />

            <AnimatePresence>
                {(cancelled || metadata?.status === 'failed') && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border shadow-sm overflow-hidden"
                        style={{ backgroundColor: '#FFFFFF', borderColor: `${'#C65D3B'}30` }}
                    >
                        <div className="p-6 sm:p-8 text-center">
                            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                            <h2 className="text-lg font-medium mb-2" style={{ color: '#000000' }}>
                                {metadata?.status === 'failed' ? 'Analysis Failed' : 'Analysis Stopped'}
                            </h2>
                            <p className="mb-6 text-sm text-black/60">{metadata?.errorMessage || 'The analysis was terminated.'}</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    onClick={onRestart}
                                    disabled={isCancelling}
                                    className="px-5 py-2.5 rounded-xl font-medium text-white flex items-center gap-2"
                                    style={{ backgroundColor: '#184131' }}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isCancelling ? 'animate-spin' : ''}`} /> Restart
                                </button>
                                <Link
                                    href="/rectify?new=true"
                                    className="px-5 py-2.5 rounded-xl font-medium border flex items-center gap-2"
                                    style={{ borderColor: 'rgba(0,0,0,0.08)', color: '#000000' }}
                                >
                                    <Home className="w-4 h-4" /> New Analysis
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isComplete && result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-[#184131]/10 to-white border-[#184131]/30 shadow-lg shadow-[#184131]/5"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#184131]/20 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-8 h-8 text-[#184131]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-black mb-1">Analysis Successfully Completed</h2>
                                <p className="text-sm text-black/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="flex items-center gap-1.5 font-medium text-[#184131]">
                                        <Activity className="w-4 h-4" /> {result.rectifiedTime}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-stone-300" />
                                    <span className="flex items-center gap-1.5 font-medium text-black">
                                        <Zap className="w-4 h-4" /> {result.confidence} Confidence
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-stone-300" />
                                    <span className="text-stone-500">Accuracy: {result.accuracy}%</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Link
                                href={`/rectify/${sessionId}/results`}
                                className="flex-1 md:flex-none px-6 py-3 bg-black text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all shadow-md"
                            >
                                View Official Report <ChevronRight className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => {
                                    const resultsEl = document.getElementById('results-panel');
                                    if (resultsEl) {
                                        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    } else {
                                        window.scrollTo({ top: 800, behavior: 'smooth' });
                                    }
                                }}
                            >
                                Quick Review
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});
