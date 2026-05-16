'use client';

import React from 'react';
import { motion } from 'framer-motion';

const ANALYSIS_STEPS = [
  { label: 'Skyfield ephemeris — calculating planetary positions', done: true },
  { label: 'Vimshottari Dasha periods — cross-referencing events', done: true },
  { label: 'KP Sub-lord precision — narrowing time window', done: false },
  { label: 'Shadbala strength — validating house placements', done: false },
];

export default function AIThinkingBox() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-[#000000] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">AI Thinking Process</span>
      </div>

      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.35 }}
            className="flex items-center gap-2"
          >
            <span
              className={
                step.done
                  ? 'w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0'
                  : 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0'
              }
            />
            <span className={`text-sm ${step.done ? 'text-[#636363]' : 'text-[#959595]'}`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-5 h-1 bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#000000] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '50%' }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
