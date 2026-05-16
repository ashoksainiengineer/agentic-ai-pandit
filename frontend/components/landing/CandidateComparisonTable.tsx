'use client';

import React from 'react';
import { motion } from 'framer-motion';

const CANDIDATES = [
  { time: '14:32:18', score: 94.2, best: true },
  { time: '14:31:45', score: 87.5 },
  { time: '14:33:02', score: 82.1 },
  { time: '14:30:28', score: 76.8 },
];

function ScoreBar({ score, best }: { score: number; best?: boolean }) {
  return (
    <div className="flex-1 h-1.5 bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden ml-3">
      <motion.div
        className={`h-full rounded-full ${best ? 'bg-[#000000]' : 'bg-[rgba(0,0,0,0.15)]'}`}
        initial={{ width: '0%' }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default function CandidateComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-[#6B1F7A] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">Candidate Comparison</span>
      </div>

      <div className="space-y-2">
        {CANDIDATES.map((c, i) => (
          <motion.div
            key={c.time}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={`flex items-center p-3 rounded-xl transition-colors ${
              c.best
                ? 'bg-emerald-50 border border-emerald-200'
                : 'hover:bg-[rgba(0,0,0,0.01)]'
            }`}
          >
            {/* Time */}
            <div className="w-20 text-sm font-mono font-medium text-[#636363]">
              {c.time}
            </div>

            {/* Score bar */}
            <ScoreBar score={c.score} best={c.best} />

            {/* Score + badge */}
            <div className="w-24 text-right flex items-center justify-end gap-1.5">
              {c.best && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-medium leading-none">
                  Best
                </span>
              )}
              <span className={`text-xs font-medium ${c.best ? 'text-[#636363]' : 'text-[#959595]'}`}>
                {c.score}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[10px] text-[#959595]">
        <span>Highest confidence match</span>
        <span className="font-mono">Dasha + KP + Shadbala consensus</span>
      </div>
    </div>
  );
}
