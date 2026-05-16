'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const AI_REASONING_LINES = [
  'Cross-referencing Vimshottari Dasha periods against 5 life events...',
  'Jupiter Mahadasha (age 25-41) shows strong correlation with Career milestone event.',
  'Saturn transit through 10th house at age 28 aligns with professional achievement window.',
  'KP Sub-lord analysis: Moon in Scorpio (Jyeshtha nakshatra) narrows time to 14:28-14:36.',
  'Shadbala strength calculation: Sun 1.42 rupas, Moon 1.18 rupas — confirming day birth.',
  'D60 (Shashtiamsha) precision check: Lagna changing at 14:31:48 — critical boundary.',
  'Prana-Dasha convergence: 14:32:18 emerges as optimal with 94.2% confidence.',
];

const CANDIDATE_SCORES = [
  { time: '14:32:18', score: 94.2, stage: 6, best: true },
  { time: '14:31:45', score: 87.5, stage: 4, best: false },
  { time: '14:33:02', score: 82.1, stage: 4, best: false },
  { time: '14:30:28', score: 76.8, stage: 2, best: false },
  { time: '14:32:51', score: 71.3, stage: 2, best: false },
];

const EPHEMERIS_PLANETS = [
  { symbol: '☉', name: 'Sun', sign: 'Leo', degree: `125°42′18″`, house: '5th', color: 'text-orange-400' },
  { symbol: '☽', name: 'Moon', sign: 'Scorpio', degree: `218°54′36″`, house: '8th', color: 'text-blue-300' },
  { symbol: '♂', name: 'Mars', sign: 'Aries', degree: `15°40′12″`, house: '1st', color: 'text-red-400' },
  { symbol: '☿', name: 'Mercury', sign: 'Virgo', degree: `172°18′54″`, house: '6th', color: 'text-emerald-400' },
  { symbol: '♃', name: 'Jupiter', sign: 'Taurus', degree: `45°11′06″`, house: '11th', color: 'text-yellow-500' },
  { symbol: '♀', name: 'Venus', sign: 'Cancer', degree: `98°33′42″`, house: '4th', color: 'text-pink-400' },
  { symbol: '♄', name: 'Saturn', sign: 'Capricorn', degree: `298°19′30″`, house: '10th', color: 'text-indigo-400' },
];

/* ═══════════════════════════════════════════════════════════
   AI THINKING PANEL
   ═══════════════════════════════════════════════════════════ */

function AIThinkingPanel({ isActive, onComplete, cycleCount }: { isActive: boolean; onComplete: () => void; cycleCount: number }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) return;
    setVisibleLines([]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    AI_REASONING_LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        if (i === AI_REASONING_LINES.length - 1) {
          setTimeout(onComplete, 1500);
        }
      }, (i + 1) * 1200);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, cycleCount]);

  const completedCount = visibleLines.length;
  const totalLines = AI_REASONING_LINES.length;
  const progressPercent = Math.round((completedCount / totalLines) * 100);
  const isLastLine = (idx: number) => idx === totalLines - 1;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between bg-stone-50/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-sm">
            <Brain className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wider">AI Reasoning Engine</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-stone-400">{completedCount}/{totalLines} complete</span>
              {isActive && completedCount > 0 && (
                <div className="w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {isActive && (
          <span className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-700 tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            LIVE
          </span>
        )}
      </div>

      {/* Reasoning Lines */}
      <div className="p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleLines.map((lineIndex) => {
            const isComplete = isLastLine(lineIndex);
            return (
              <motion.div
                key={`${cycleCount}-${lineIndex}`}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors duration-300 ${isComplete ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-amber-50/30 border-amber-100/40'}`}
              >
                {/* Status dot */}
                <div className="mt-0.5 flex-shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${isComplete ? 'text-emerald-800 font-medium' : 'text-stone-700'}`}>
                    {AI_REASONING_LINES[lineIndex]}
                  </p>
                  {isComplete && (
                    <p className="text-[10px] text-emerald-600/70 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Optimal time confirmed
                    </p>
                  )}
                </div>

                {/* Sequence number */}
                <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${isComplete ? 'text-emerald-500' : 'text-amber-400'}`}>
                  {String(lineIndex + 1).padStart(2, '0')}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading placeholder */}
        {isActive && completedCount < totalLines && (
          <div className="flex items-center gap-3 p-3">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-xs text-stone-400">
              Processing next reasoning step
              <span className="inline-block w-[3px] h-3.5 bg-stone-400 ml-0.5 animate-pulse align-middle" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CANDIDATE LEADERBOARD
   ═══════════════════════════════════════════════════════════ */

function CandidateLeaderboard() {
  const medals = ['🥇', '🥈', '🥉'];

  const getScoreBarClass = (c: { best: boolean; score: number }) => {
    if (c.best) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (c.score > 85) return 'bg-gradient-to-r from-stone-400 to-stone-600';
    return 'bg-gradient-to-r from-stone-300 to-stone-400';
  };

  const getScoreTextClass = (c: { best: boolean; score: number }) => {
    if (c.best) return 'text-emerald-700';
    if (c.score > 85) return 'text-stone-600';
    return 'text-stone-400';
  };

  const getStageClass = (stage: number) => {
    if (stage >= 6) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (stage >= 4) return 'bg-amber-100 text-amber-700 border border-amber-200';
    return 'bg-stone-100 text-stone-500 border border-stone-200';
  };

  const getRowClass = (i: number, best: boolean) => {
    const zebra = i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30';
    const bestGlow = best
      ? 'ring-1 ring-emerald-200/60 bg-emerald-50/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
      : 'hover:bg-stone-50/80';
    return `${zebra} ${bestGlow}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3 bg-stone-50/80">
        <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-sm">
          <Trophy className="w-4 h-4 text-stone-500" />
        </div>
        <div className="flex-1">
          <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wider">Candidate Birth Times</span>
          <p className="text-[10px] text-stone-400 mt-0.5">6-stage tournament results</p>
        </div>
        {/* Confidence threshold indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-stone-500">≥94% confidence</span>
        </div>
      </div>

      <div>
        {CANDIDATE_SCORES.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center px-5 py-3.5 gap-4 border-b border-[rgba(0,0,0,0.04)] transition-all duration-200 ${getRowClass(i, c.best)}`}
          >
            {/* Rank */}
            <span className="w-8 text-center flex-shrink-0">
              {i < 3 ? (
                <span className="text-base leading-none" title={`Rank #${i + 1}`}>{medals[i]}</span>
              ) : (
                <span className="text-[11px] font-mono text-stone-300 font-medium">{i + 1}</span>
              )}
            </span>

            {/* Time */}
            <span className={`font-mono text-sm font-semibold w-[72px] flex-shrink-0 ${c.best ? 'text-emerald-800' : 'text-stone-700'}`}>
              {c.time}
            </span>

            {/* Score bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                  <motion.div
                    className={`h-full rounded-full ${getScoreBarClass(c)}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className={`text-xs font-bold font-mono w-12 text-right flex-shrink-0 ${getScoreTextClass(c)}`}>
                  {c.score}%
                </span>
              </div>
            </div>

            {/* Stage badge */}
            <span className={`text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-md w-10 text-center ${getStageClass(c.stage)}`}>
              S{c.stage}
            </span>

            {/* Best badge */}
            {c.best && (
              <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                ★ Best
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[rgba(0,0,0,0.06)] bg-stone-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-stone-400 font-medium">Consensus: Dasha · KP Sub-lord · Shadbala</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-stone-400">±0.0001° accuracy</span>
            <span className="text-[10px] font-mono text-stone-300">DE440 ephemeris</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EPHEMERIS TABLE
   ═══════════════════════════════════════════════════════════ */

function EphemerisTable() {
  const planetBgColors: Record<string, string> = {
    'text-orange-400': 'bg-orange-100 border-orange-200 text-orange-700',
    'text-blue-300': 'bg-blue-100 border-blue-200 text-blue-700',
    'text-red-400': 'bg-red-100 border-red-200 text-red-700',
    'text-emerald-400': 'bg-emerald-100 border-emerald-200 text-emerald-700',
    'text-yellow-500': 'bg-yellow-100 border-yellow-200 text-yellow-700',
    'text-pink-400': 'bg-pink-100 border-pink-200 text-pink-700',
    'text-indigo-400': 'bg-indigo-100 border-indigo-200 text-indigo-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between bg-stone-50/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wider">Ephemeris Data</span>
            <p className="text-[10px] text-stone-400 mt-0.5 font-mono">Candidate: 14:32:18 IST</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            ★ Best Match
          </span>
          <span className="text-[10px] text-stone-300 font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200">NASA JPL DE440</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_0.8fr_1.2fr_0.8fr] gap-3 px-5 py-2.5 border-b border-[rgba(0,0,0,0.06)] bg-stone-100/50">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Planet</span>
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Sign</span>
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Longitude</span>
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">House</span>
      </div>

      {/* Planet rows */}
      <div>
        {EPHEMERIS_PLANETS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`grid grid-cols-[1fr_0.8fr_1.2fr_0.8fr] gap-3 px-5 py-3 items-center transition-colors duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'} border-b border-[rgba(0,0,0,0.03)] hover:bg-stone-100/50`}
          >
            {/* Planet name with colored badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold border ${planetBgColors[p.color] || 'bg-stone-100 border-stone-200 text-stone-600'}`}>
                {p.symbol}
              </span>
              <span className="text-xs font-semibold text-stone-700">{p.name}</span>
            </div>
            <span className="text-xs text-stone-500 font-medium">{p.sign}</span>
            <span className="text-xs text-stone-600 font-mono tracking-tight">{p.degree}</span>
            <div className="flex items-center">
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">{p.house}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[rgba(0,0,0,0.06)] bg-stone-50/60">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ascendant</span>
            <span className="text-[11px] font-mono font-medium text-stone-700">Scorpio 15°42′</span>
            <span className="text-[10px] text-stone-400">· Jyeshtha Nakshatra</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dasha</span>
            <span className="text-[11px] font-mono font-medium text-stone-700">Jupiter Mahadasha</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DEMO COMPONENT — 3-panel horizontal grid
   ═══════════════════════════════════════════════════════════ */

export default function LivePipelineDemo() {
  const [aiActive, setAiActive] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  const handleAIComplete = useCallback(() => {
    setAiActive(false);
    // Restart AI animation cycle after 15s pause
    setTimeout(() => {
      setAiActive(true);
      setCycleCount(c => c + 1);
    }, 15000);
  }, []);

  return (
    <div>
      {/* 3-panel horizontal row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Reasoning Engine */}
        <AIThinkingPanel
          key={`ai-${cycleCount}`}
          isActive={aiActive}
          onComplete={handleAIComplete}
          cycleCount={cycleCount}
        />

        {/* Ephemeris Data */}
        <EphemerisTable />

        {/* Candidate Birth Times — always visible */}
        <CandidateLeaderboard />
      </div>

      {/* Cycle indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-black/20 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Analysis simulation — refreshes every cycle
      </div>
    </div>
  );
}
