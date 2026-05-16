'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Brain, Filter, Target, CheckCircle } from 'lucide-react';

import { STAGES } from '@/lib/constants/stages';

interface StageInfo {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  candidateRange: string;
}

const STAGE_CONFIG: Record<number, StageInfo> = {
  0: { id: 0, name: STAGES[0].name, description: STAGES[0].description, icon: <Activity className="w-4 h-4" />, candidateRange: '---' },
  1: { id: 1, name: STAGES[1].name, description: STAGES[1].description, icon: <Target className="w-4 h-4" />, candidateRange: '1 → 61' },
  2: { id: 2, name: STAGES[2].name, description: STAGES[2].description, icon: <Filter className="w-4 h-4" />, candidateRange: '61 → 15' },
  3: { id: 3, name: STAGES[3].name, description: STAGES[3].description, icon: <Activity className="w-4 h-4" />, candidateRange: '15 → 10' },
  4: { id: 4, name: STAGES[4].name, description: STAGES[4].description, icon: <Brain className="w-4 h-4" />, candidateRange: '10 → 5' },
  5: { id: 5, name: STAGES[5].name, description: STAGES[5].description, icon: <Zap className="w-4 h-4" />, candidateRange: '5 → 3' },
  6: { id: 6, name: STAGES[6].name, description: STAGES[6].description, icon: <Target className="w-4 h-4" />, candidateRange: '3 → 1' },
};

interface AnalysisStatusBannerProps {
  currentStage: number;
  candidateCount: number;
  totalCandidates: number;
  analyzedCount: number;
  elapsedSeconds: number;
  isConnected: boolean;
  isComplete: boolean;
  activeAIStage?: number | null;
  offsetMinutes?: number; // 🔱 NEW: God-Tier offset config
}

function formatTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AnalysisStatusBanner = memo(function AnalysisStatusBanner({
  currentStage,
  candidateCount,
  totalCandidates,
  analyzedCount,
  elapsedSeconds,
  isConnected,
  isComplete,
  activeAIStage,
  offsetMinutes = 60,
}: AnalysisStatusBannerProps) {
  // Use activeAIStage mapping like SimplifiedPipeline does if available
  const aiStageToIndex: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
  const effectiveStageIndex = activeAIStage && aiStageToIndex[activeAIStage] !== undefined
    ? Math.max(currentStage, aiStageToIndex[activeAIStage])
    : currentStage;

  const stage = STAGE_CONFIG[effectiveStageIndex] ?? STAGE_CONFIG[0];


  const progressPercent = useMemo(() => {
    if (totalCandidates <= 0) return 0;
    return Math.min(100, Math.round((analyzedCount / totalCandidates) * 100));
  }, [analyzedCount, totalCandidates]);

  const stageProgress = useMemo(() => {
    if (isComplete) return { current: 7, total: 7 };
    return { current: effectiveStageIndex + 1, total: 7 };
  }, [effectiveStageIndex, isComplete]);

  const statusContent = useMemo(() => {
    if (isComplete) {
      return (
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#184131]/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[#184131]" />
          </div>
          <div>
            <p className="font-medium text-black">Analysis Complete</p>
            <p className="text-xs text-[#184131] font-medium">Results verified & finalized</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-[#000000]/20 flex items-center justify-center shrink-0">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            {stage.icon}
          </motion.div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-black text-sm sm:text-base">{stage.name}</p>
            {/* Phase Label Logic */}
            {(() => {
              const stageNum = effectiveStageIndex;
              let phaseLabel = '';
              if (stageNum <= 2) phaseLabel = offsetMinutes > 120 ? 'Macro Phase: Broad scanning of large time ranges.' : (offsetMinutes > 15 ? 'Meso Phase: Intermediate narrowing of candidate groups.' : 'Micro Phase: Extreme precision testing of remaining winners.');
              else if (stageNum === 4) phaseLabel = 'Meso Phase: Intermediate narrowing of candidate groups.';
              else if (stageNum >= 5) phaseLabel = 'Micro Phase: Extreme precision testing of remaining winners.';
              if (!phaseLabel) return null;
              return (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#184131]/10 text-[#184131] font-medium border border-[#184131]/20">
                  {phaseLabel}
                </span>
              );
            })()}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A1E]/10 text-[#1A1A1E] font-medium">
              Step {stageProgress.current} of {stageProgress.total}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/60 mt-0.5 truncate">{stage.description}</p>
        </div>
      </div>
    );
  }, [isComplete, stage, effectiveStageIndex, offsetMinutes, stageProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${isComplete ? 'from-[#184131]/10 to-transparent border-[#184131]/20' : 'from-[#C65D3B]/[0.06] via-[#C65D3B]/[0.03] to-transparent border-[#C65D3B]/20'} border rounded-xl p-4 sm:p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {statusContent}

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">


          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#184131]' : (isConnected ? 'bg-[#184131] animate-pulse' : 'bg-[#C65D3B]')}`} />
            <span className="text-xs font-medium text-black/60">
              {isComplete ? 'Finalized' : (isConnected ? 'Inference Active' : 'Reconnecting')}
            </span>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-black/60 uppercase tracking-wider">Inference</p>
            <p className="text-sm font-medium text-[#184131] font-mono">
              {(() => {
                if (elapsedSeconds <= 0) return '0.0';
                const throughput = analyzedCount / elapsedSeconds;
                return throughput.toFixed(1);
              })()}
              <span className="text-[8px] ml-0.5 opacity-60">c/s</span>
            </p>
            <p className="text-[9px] text-black font-medium mt-0.5">
              {candidateCount.toLocaleString()} <span className="text-[7px] uppercase opacity-60">Variations</span>
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-black/60 uppercase tracking-wider">Elapsed</p>
            <p className="text-sm font-medium text-black font-mono">{formatTime(elapsedSeconds)}</p>
          </div>
        </div>
      </div>

      {!isComplete && progressPercent > 0 && (
        <div className="mt-3 pt-3 border-t border-[#000000]/10">
          <div className="flex items-center justify-between text-xs text-black/60 mb-1">
            <span>Stage Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default AnalysisStatusBanner;
