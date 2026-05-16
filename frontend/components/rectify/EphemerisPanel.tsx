'use client';

// components/rectify/EphemerisPanel.tsx
// Collapsible ephemeris data panel showing planetary positions, houses, and dasha

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Orbit, Star, Home, Sparkles } from 'lucide-react';

interface PlanetData {
    sign: string;
    degree: number | string;
    nakshatra: string;
    isExalted?: boolean;
    isDebilitated?: boolean;
    isRetrograde?: boolean;
}

interface EphemerisPanelProps {
    candidateTime: string;
    planets?: {
        sun?: PlanetData;
        moon?: PlanetData;
        mercury?: PlanetData;
        venus?: PlanetData;
        mars?: PlanetData;
        jupiter?: PlanetData;
        saturn?: PlanetData;
        rahu?: PlanetData;
        ketu?: PlanetData;
    };
    ascendant?: {
        sign: string;
        degree: number | string;
        nakshatra: string;
    };
    houses?: Array<{
        number: number;
        sign: string;
        cusp?: number;
    }>;
    dasha?: string;
    // Simplified data from minifiedEph
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
    defaultExpanded?: boolean;
}

const PLANET_SYMBOLS: Record<string, { symbol: string; color: string }> = {
    sun: { symbol: '☉', color: 'text-orange-400' },
    moon: { symbol: '☽', color: 'text-blue-300' },
    mercury: { symbol: '☿', color: 'text-emerald-400' },
    venus: { symbol: '♀', color: 'text-pink-400' },
    mars: { symbol: '♂', color: 'text-red-400' },
    jupiter: { symbol: '♃', color: 'text-yellow-400' },
    saturn: { symbol: '♄', color: 'text-indigo-400' },
    rahu: { symbol: '☊', color: 'text-purple-400' },
    ketu: { symbol: '☋', color: 'text-gray-400' },
};

const formatDegree = (deg: number | string): string => {
    if (typeof deg === 'string') return deg;
    const degrees = Math.floor(deg);
    const minutes = Math.floor((deg - degrees) * 60);
    const seconds = Math.floor(((deg - degrees) * 60 - minutes) * 60);
    return `${degrees}°${minutes}'${seconds}"`;
};

export function EphemerisPanel({
    candidateTime,
    planets,
    ascendant,
    houses,
    dasha,
    minifiedEph,
    defaultExpanded = false
}: EphemerisPanelProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Check if we have any data to show
    const hasData = planets || ascendant || minifiedEph;

    if (!hasData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--prism-canvas)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Orbit className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-medium text-black">Ephemeris Data</h4>
                        <p className="text-[10px] text-black/60 font-mono">Candidate: {candidateTime}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {minifiedEph && !isExpanded && (
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-black/60">
                            <span className="text-orange-600">☉ {minifiedEph.sun}</span>
                            <span className="text-blue-600">☽ {minifiedEph.moon}</span>
                        </div>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-black/60" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-black/60" />
                    )}
                </div>
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[rgba(0,0,0,0.08)] max-h-[500px] overflow-y-auto"
                    >
                        <div className="p-4 space-y-4">
                            {/* Ascendant */}
                            {(ascendant || minifiedEph?.ascendant) && (
                                <div className="bg-[#ffffff] rounded-lg p-3 border border-[#000000]/30 shrink-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-black" />
                                        <span className="text-[10px] text-black/60 uppercase tracking-wider font-medium">Ascendant (Lagna)</span>
                                    </div>
                                    <div className="text-lg font-medium text-black font-mono">
                                        {ascendant ? (
                                            <span>{ascendant.sign} {formatDegree(ascendant.degree)} ({ascendant.nakshatra})</span>
                                        ) : (
                                            <span>↑ {minifiedEph?.ascendant}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Planets Grid */}
                            {planets ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(planets).map(([key, data]) => {
                                        if (!data) return null;
                                        const config = PLANET_SYMBOLS[key] || { symbol: '?', color: 'text-black' };

                                        return (
                                            <div
                                                key={key}
                                                className="bg-[#ffffff] rounded-lg p-2.5 border border-[rgba(0,0,0,0.08)] hover:border-[#000000]/30 transition-colors shrink-0"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`text-lg ${config.color}`}>{config.symbol}</span>
                                                    <span className="text-[10px] text-black/60 uppercase font-medium">{key}</span>
                                                    {data.isRetrograde && <span className="text-[8px] text-red-600">R</span>}
                                                </div>
                                                <div className="text-xs font-mono text-black">
                                                    {data.sign} {formatDegree(data.degree)}
                                                </div>
                                                <div className="text-[10px] text-black/60">
                                                    {data.nakshatra}
                                                    {data.isExalted && <span className="ml-1 text-emerald-600">⭐</span>}
                                                    {data.isDebilitated && <span className="ml-1 text-red-600">↓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : minifiedEph && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-[#ffffff] rounded-lg p-2.5 border border-[rgba(0,0,0,0.08)] shrink-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-lg text-orange-600">☉</span>
                                            <span className="text-[10px] text-black/60 uppercase font-medium">Sun</span>
                                        </div>
                                        <div className="text-xs font-mono text-black">{minifiedEph.sun}</div>
                                    </div>
                                    <div className="bg-[#ffffff] rounded-lg p-2.5 border border-[rgba(0,0,0,0.08)] shrink-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-lg text-blue-600">☽</span>
                                            <span className="text-[10px] text-black/60 uppercase font-medium">Moon</span>
                                        </div>
                                        <div className="text-xs font-mono text-black">{minifiedEph.moon}</div>
                                    </div>
                                    <div className="bg-[#ffffff] rounded-lg p-2.5 border border-[rgba(0,0,0,0.08)] shrink-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-lg text-black">↑</span>
                                            <span className="text-[10px] text-black/60 uppercase font-medium">Asc</span>
                                        </div>
                                        <div className="text-xs font-mono text-black">{minifiedEph.ascendant}</div>
                                    </div>
                                </div>
                            )}

                            {/* Houses */}
                            {houses && houses.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="w-4 h-4 text-black/60" />
                                        <span className="text-[10px] text-black/60 uppercase tracking-wider font-medium">Houses</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {houses.map((house) => (
                                            <div
                                                key={house.number}
                                                className="bg-[#ffffff] rounded-lg p-2 text-center border border-[rgba(0,0,0,0.08)] shrink-0"
                                            >
                                                <div className="text-[10px] font-medium text-black/60">{house.number}H</div>
                                                <div className="text-[11px] font-mono text-black">{house.sign}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dasha */}
                            {dasha && (
                                <div className="bg-[#ffffff] rounded-lg p-3 border border-emerald-500/30 shrink-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] text-black/60 uppercase tracking-wider font-medium">Active Dasha</span>
                                    </div>
                                    <div className="text-sm font-mono text-emerald-700">{dasha}</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Compact version for inline display in tables
export function EphemerisMini({ sun, moon, ascendant }: { sun?: string; moon?: string; ascendant?: string }) {
    return (
        <div className="flex flex-col gap-0.5 text-[9px] font-mono">
            {sun && (
                <div className="flex items-center gap-1">
                    <span className="text-orange-600">☉</span>
                    <span className="text-black/60">{sun}</span>
                </div>
            )}
            {moon && (
                <div className="flex items-center gap-1">
                    <span className="text-blue-600">☽</span>
                    <span className="text-black/60">{moon}</span>
                </div>
            )}
            {ascendant && (
                <div className="flex items-center gap-1">
                    <span className="text-black">↑</span>
                    <span className="text-black/60">{ascendant}</span>
                </div>
            )}
        </div>
    );
}
