'use client';

import React from 'react';
import { Brain, Trophy, CheckCircle2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClipboard } from '@/hooks/useClipboard';
import type { StreamResult } from '@/lib/store/stream-types';

interface CompletionInsightsProps {
    result: StreamResult;
    sessionId: string;
}

export function CompletionInsights({ result, sessionId }: CompletionInsightsProps) {
    const router = useRouter();
    const { copyToClipboard, hasCopied } = useClipboard();

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden group">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98133_1px,transparent_1px),linear-gradient(to_bottom,#10b98133_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 transition-opacity duration-1000 group-hover:opacity-40" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-medium tracking-tight text-white drop-shadow-[0_2px_10px_rgba(16,185,129,0.8)]">Analysis Successfully Completed</h2>
                        </div>

                        <p className="text-emerald-100/70 max-w-lg text-lg">
                            The neural networks have finalized candidate extraction and verification. The ultimate rectified time string has been verified with multi-stage quorum consensus.
                        </p>

                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                                <Brain className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium text-zinc-300">Confidence: <span className="text-emerald-400">{result.confidence}</span></span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-zinc-300">Accuracy Score: <span className="text-amber-400">{result.accuracy}%</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center p-8 bg-black/60 backdrop-blur-md rounded-2xl border border-emerald-500/40 shadow-2xl relative min-w-[300px]">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-50 pointer-events-none" />

                        <span className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                            Ultimate Result
                        </span>

                        <div className="text-6xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] mb-6 relative z-10 group-hover:scale-105 transition-transform duration-500 cursor-default flex items-center gap-4">
                            {result.rectifiedTime}
                            <button
                                className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 border border-zinc-700"
                                onClick={() => copyToClipboard(result.rectifiedTime)}
                                title={hasCopied ? "Copied!" : "Copy to clipboard"}
                                aria-label={hasCopied ? "Copied to clipboard" : "Copy rectified time to clipboard"}
                            >
                                {hasCopied ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-zinc-400 hover:text-white" />
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col w-full gap-3 relative z-10">
                            <button
                                onClick={() => router.push(`/rectify/${sessionId}/report`)}
                                className="inline-flex items-center justify-center text-white rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full h-14 text-lg font-medium bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
                            >
                                View Official Report
                            </button>
                            <button
                                className="inline-flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full h-12 text-sm border bg-transparent border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-100 transition-colors"
                            >
                                Quick Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
