'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ChevronDown, BookOpen, Layers,
    Compass, Clock, Target, Activity, ShieldCheck
} from 'lucide-react';

export const TechnicalMethodology = ({ offsetMinutes = 60 }: { offsetMinutes?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'blueprint' | 'vargas' | 'logic' | 'specs'>('blueprint');

    const precisionLayers = [
        {
            layer: 'Macro-Temporal',
            focus: 'Rashi & Nakshatra',
            varga: 'D1 Lagna',
            logic: 'Biological and psychological baseline alignment.',
            icon: Compass
        },
        {
            layer: 'Meso-Temporal',
            focus: 'Navamsha & Dwadashamsha',
            varga: 'D9 & D12',
            logic: 'Dharma, partnerships, and lineage verification.',
            icon: Layers
        },
        {
            layer: 'Micro-Temporal',
            focus: 'Shashtiamsha & Nadi',
            varga: 'D60 & D150',
            logic: 'Pinpoint trauma and event-timing precision.',
            icon: Target
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#ffffff] to-white rounded-2xl border border-[#000000]/30 overflow-hidden shadow-lg shadow-[#000000]/5"
        >
            {/* Header */}
            <div
                className="p-5 cursor-pointer hover:bg-[var(--prism-canvas)]/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-[#000000] to-[#000000]">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <h3 className=" text-xl font-medium text-black">
                                Analysis Method
                            </h3>
                        </div>
                        <p className="text-sm text-black/60 leading-relaxed">
                            <span className="font-medium text-black">Multi-layered mathematical reduction.</span> The engine converges across
                            <span className="font-medium text-black"> 16 primary divisional charts</span> to find the singular rectified second of birth.
                        </p>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="p-2 rounded-lg bg-[var(--prism-canvas)] text-black/60"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>

                {/* Quick Config Display */}
                <div className="mt-4 flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#000000]/10 text-black border border-[#000000]/20">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        ±{offsetMinutes}m Search Range
                    </div>
                    <div className="text-[10px] text-[#959595] uppercase tracking-widest font-medium">
                        Precision Mode: {offsetMinutes > 120 ? 'Standard' : 'High Precision'}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[rgba(0,0,0,0.08)]"
                    >
                        {/* Tab Navigation */}
                        <div className="flex p-1 bg-[var(--prism-canvas)] mx-4 mt-4 rounded-xl">
                            {([
                                { id: 'blueprint', label: 'The Funnel', icon: BookOpen },
                                { id: 'vargas', label: 'Precision Layers', icon: Target },
                                { id: 'logic', label: 'Integrity', icon: ShieldCheck },
                                { id: 'specs', label: 'AI Specs', icon: Activity }
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab(tab.id);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-black/60 hover:text-black/60'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-5">
                            {activeTab === 'blueprint' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="p-4 bg-gradient-to-br from-[#000000]/10 to-[#000000]/10 rounded-xl border border-[#000000]/20">
                                        <h4 className="font-medium text-black mb-2 flex items-center gap-2 text-sm">
                                            <Sparkles className="w-4 h-4 text-black" />
                                            Reduction Logic
                                        </h4>
                                        <p className="text-xs text-black/60 leading-relaxed">
                                            Instead of a simple linear search, the algorithm performs a **systematic reduction** of time-steps. It evaluates candidates through the prism of the Shodashvarga, progressively narrowing the search from Rashi levels down to the exact 48-second Nadi-Amsha window.
                                        </p>
                                    </div>

                                    <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[rgba(0,0,0,0.08)]">
                                        {[
                                            { step: 'Stage 1-2', label: 'Level 1: Initial', desc: 'Rashi elements & Nakshatra-Pada verification.' },
                                            { step: 'Stage 3-4', label: 'Level 2: Deep', desc: 'Navamsha (D9) & Dwadashamsha (D12) event alignment.' },
                                            { step: 'Stage 5-6', label: 'Level 3: Final', desc: 'Shashtiamsha (D60) & Dasha precision.' }
                                        ].map((step, i) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#000000] border-2 border-white shadow-sm" />
                                                <div>
                                                    <div className="text-[10px] font-medium text-black uppercase">{step.step}</div>
                                                    <div className="text-xs font-medium text-black">{step.label}</div>
                                                    <p className="text-[10px] text-black/60 mt-0.5">{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'vargas' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                >
                                    {precisionLayers.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] flex gap-3">
                                            <div className="p-2 rounded-lg bg-[#000000]/5 h-fit">
                                                <item.icon className="w-4 h-4 text-black" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-medium text-xs text-black">{item.layer}</h5>
                                                    <span className="text-[9px] font-mono text-black font-medium uppercase">{item.varga}</span>
                                                </div>
                                                <p className="text-[11px] text-black/60 mt-1">{item.logic}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'logic' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                            <div className="text-[10px] font-medium text-stone-400 uppercase mb-1">Position Calculation</div>
                                            <p className="text-[11px] text-stone-600 italic">27 planetary degrees calculated per candidate.</p>
                                        </div>
                                        <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                            <div className="text-[10px] font-medium text-stone-400 uppercase mb-1">Dasha Depth</div>
                                            <p className="text-[11px] text-stone-600 italic">5-level Vimshottari refinement (Dasha Sub-division).</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[#184131]/5 border border-[#184131]/10 rounded-xl">
                                        <h5 className="font-medium text-xs text-[#184131] flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Mathematical Integrity
                                        </h5>
                                        <p className="text-[11px] text-black/60 leading-relaxed">
                                            Every candidate undergoes a full **Bhava-Chalit** recalculation to ensure house-shifts are accurately captured. This replaces generic approximations with exact astronomical coordinates.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'specs' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-black/[0.02] rounded-lg border border-black/5">
                                            <div className="text-[9px] font-medium text-stone-400 uppercase mb-1">Primary Model</div>
                                            <div className="font-mono text-[11px] font-medium text-stone-700">OpenAI o3-mini-high</div>
                                        </div>
                                        <div className="p-3 bg-black/[0.02] rounded-lg border border-black/5">
                                            <div className="text-[9px] font-medium text-stone-400 uppercase mb-1">Reasoning Mode</div>
                                            <div className="font-mono text-[11px] font-medium text-black">Chain-of-Thought</div>
                                        </div>
                                        <div className="p-3 bg-black/[0.02] rounded-lg border border-black/5">
                                            <div className="text-[9px] font-medium text-stone-400 uppercase mb-1">Context Length</div>
                                            <div className="font-mono text-[11px] font-medium text-stone-700">200k Tokens</div>
                                        </div>
                                        <div className="p-3 bg-black/[0.02] rounded-lg border border-black/5">
                                            <div className="text-[9px] font-medium text-stone-400 uppercase mb-1">Quantization</div>
                                            <div className="font-mono text-[11px] font-medium text-[#184131]">BF16 Precision</div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                                        <h5 className="font-medium text-[10px] text-stone-500 uppercase flex items-center gap-2 mb-2">
                                            <Layers className="w-3 h-3" />
                                            Pipeline Architecture
                                        </h5>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-stone-600">Recursive Iterations (Avg)</span>
                                                <span className="font-mono font-medium">~2,400</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-stone-600">Event Matching</span>
                                                <span className="font-mono font-medium text-black">Enabled (v2.1)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-stone-600">Inference Latency</span>
                                                <span className="font-mono font-medium">Streaming (Live)</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Quote */}
                        <div className="p-4 bg-gradient-to-r from-[#000000]/10 to-[#000000]/10 border-t border-[#000000]/20">
                            <p className="text-xs text-center text-black/60 italic">
                                &quot;The singular truth of time is encoded across 16 dimensions of Varga.
                                Absolute convergence is the goal of this engine.&quot;
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
