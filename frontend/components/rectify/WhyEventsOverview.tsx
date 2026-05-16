'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { ACCURACY_LEVELS } from './why-events-data';
import type { AccuracyLevel } from './why-events-data';

interface WhyEventsOverviewProps {
  currentEventCount: number;
  categoriesCovered: number;
  currentLevel: AccuracyLevel;
}

export default function WhyEventsOverview({
  currentEventCount,
  categoriesCovered,
  currentLevel,
}: WhyEventsOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Accuracy Levels */}
      <div className="space-y-3">
        <h4 className="font-medium text-content-primary text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Accuracy Progression
        </h4>
        <div className="grid gap-3">
          {ACCURACY_LEVELS.map((level, idx) => {
            const isCurrent = level.range === currentLevel.range;
            const isPast = ACCURACY_LEVELS.indexOf(currentLevel) > idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? `${level.bgColor} ${level.borderColor} border-2`
                    : isPast
                      ? 'bg-trust/5 border-trust/20'
                      : 'bg-white border-surface-muted opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${level.bgColor}`}>
                      <level.icon className={`w-4 h-4 ${level.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-content-primary">{level.label}</div>
                      <div className="text-xs text-content-secondary">{level.range}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium text-lg ${level.color}`}>{level.accuracy}</div>
                    <div className="text-xs text-content-secondary">{level.precision}</div>
                  </div>
                </div>
                {isCurrent && (
                  <div className="mt-2 pt-2 border-t border-primary-dark/20">
                    <p className="text-xs text-content-secondary">✓ Your current level</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-surface-muted text-center">
          <div className="text-2xl font-medium text-primary">{currentEventCount}</div>
          <div className="text-[10px] text-content-secondary uppercase tracking-wider">Events Added</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-surface-muted text-center">
          <div className="text-2xl font-medium text-primary-dark">{categoriesCovered}</div>
          <div className="text-[10px] text-content-secondary uppercase tracking-wider">Categories</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-surface-muted text-center">
          <div className="text-2xl font-medium text-trust">{Math.max(0, 25 - currentEventCount)}</div>
          <div className="text-[10px] text-content-secondary uppercase tracking-wider">To Optimal</div>
        </div>
      </div>
    </motion.div>
  );
}
