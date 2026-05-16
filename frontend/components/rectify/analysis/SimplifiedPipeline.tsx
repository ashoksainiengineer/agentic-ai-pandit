'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

import { STAGES } from '@/lib/constants/stages';

interface SimplifiedPipelineProps {
  currentStage: number;
  isComplete: boolean;
  isConnected: boolean;
  activeAIStage?: number | null;
  offsetMinutes?: number;
  aiModel?: string;
  onStageClick?: (stageId: number) => void;
}

export const SimplifiedPipeline = memo(function SimplifiedPipeline({
  currentStage,
  isComplete,
  isConnected,
  activeAIStage,
  offsetMinutes = 60,
  onStageClick,
}: SimplifiedPipelineProps) {
  const aiStageToIndex: Record<number, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
  };

  const effectiveStageIndex = activeAIStage && aiStageToIndex[activeAIStage] !== undefined
    ? Math.max(currentStage, aiStageToIndex[activeAIStage])
    : currentStage;

  const stageStates = useMemo(() => {
    return STAGES.map((_stage, index) => {
      if (isComplete) return 'completed';
      if (index < effectiveStageIndex) return 'completed';
      if (index === effectiveStageIndex) return 'active';
      return 'pending';
    });
  }, [isComplete, effectiveStageIndex]);

  const completedCount = stageStates.filter(s => s === 'completed').length;
  const progressPercent = Math.round((completedCount / STAGES.length) * 100);

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#184131] animate-pulse' : 'bg-[#C65D3B]'}`} />
          <span className="text-xs font-medium text-black/60">
            {isConnected ? 'Processing' : 'Reconnecting'}
          </span>
        </div>

      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((stage, index) => {
          const state = stageStates[index];
          const isLast = index === STAGES.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <motion.button
                animate={{
                  scale: state === 'active' ? 1.05 : 1,
                }}
                onClick={() => onStageClick?.(stage.id)}
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0
                  transition-all duration-300 group relative
                  ${state === 'completed' ? 'bg-[#184131] text-white hover:bg-[#184131]/90' : ''}
                  ${state === 'active' ? 'bg-[#1A1A1E] text-white ring-2 ring-[#1A1A1E]/30 ring-offset-1' : ''}
                  ${state === 'pending' ? 'bg-[var(--prism-canvas)] text-[#959595]' : ''}
                `}
                title={stage.name}
              >
                {state === 'completed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                {state === 'active' && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
                {state === 'pending' && <Circle className="w-3 h-3 sm:w-4 sm:h-4" />}

                {/* Industrial Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1A1A1E] text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  <div className="font-medium mb-1">{stage.name}</div>
                  <div className="text-white/70 leading-relaxed">{stage.description}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1A1A1E]" />
                </div>
              </motion.button>

              {!isLast && (
                <div className="flex-1 h-0.5 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden min-w-[4px] sm:min-w-[8px]">
                  <motion.div
                    className="h-full bg-[#184131]"
                    initial={{ width: 0 }}
                    animate={{ width: stageStates[index] === 'completed' ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start">
            <span className="text-xs text-black/60">Stage</span>
            <span className="text-sm font-medium text-black">
              {isComplete ? 'Complete' : STAGES[effectiveStageIndex]?.name || 'Unknown'}
            </span>
          </div>
          {(() => {
            // 🔱 God-Tier Phase logic
            const stageNum = effectiveStageIndex;
            let phaseLabel = '';
            if (stageNum <= 2) {
              phaseLabel = offsetMinutes > 120 ? 'Macro Phase: Broad scanning of large time ranges.' : (offsetMinutes > 15 ? 'Meso Phase: Intermediate narrowing of candidate groups.' : 'Micro Phase: Extreme precision testing of remaining winners.');
            } else if (stageNum === 4) {
              phaseLabel = 'Meso Phase: Intermediate narrowing of candidate groups.';
            } else if (stageNum >= 5) {
              phaseLabel = 'Micro Phase: Extreme precision testing of remaining winners.';
            }

            if (!phaseLabel) return null;
            return (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--prism-canvas)] text-black border border-[#000000]/10 font-medium uppercase mt-1">
                {phaseLabel}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 sm:w-32 bg-[var(--prism-canvas)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#1A1A1E] to-[#184131] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-mono font-medium text-black">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
});

export default SimplifiedPipeline;
