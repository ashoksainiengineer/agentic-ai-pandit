'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  Activity,
  Clock,
  XCircle,
  RefreshCw,
  CheckCircle,
  Zap,
  ChevronRight,
  Brain,
  Trophy,
  ChevronDown,
  ChevronUp,
  Radio,
  Gem,
  AlertCircle,
  Calendar,
  Timer,
  MapPin,
} from 'lucide-react';
import { logger } from '@/lib/secure-logger';
import Layout from '@/components/Layout';
import { AnalysisErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import { useAnalysisSession } from '@/hooks/use-analysis-session';
import { useAnalysisActions } from '@/hooks/use-analysis-actions';
import { env } from '@/lib/config/env';
import dynamic from 'next/dynamic';
import { STAGES } from '@/lib/constants/stages';
import type { AIThinking, CandidateScore } from '@/lib/store/stream-types';
import { BirthDetailsBanner } from '@/components/rectify/dashboard/BirthDetailsBanner';
import '@/app/globals.css';

const SSEDebugPanel = env.app.isDevelopment
  ? dynamic(() => import('@/components/dev/SSEDebugPanel'), { ssr: false })
  : () => null;

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
function fmtTime(totalSeconds: number): string {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOADING / ERROR
   ═══════════════════════════════════════════════════════════════════════════════ */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--prism-canvas)] text-center p-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
        <Gem className="w-16 h-16 text-black" />
      </motion.div>
      <h1 className="text-2xl font-medium mt-6 text-black">Starting Analysis…</h1>
      <p className="text-lg text-black/60 mt-2">Establishing secure connection…</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--prism-canvas)] text-center p-4" role="alert">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-medium mt-6 text-red-700">Connection Error</h1>
      <p className="text-xs text-red-600 mt-2 max-w-2xl bg-red-50 p-4 rounded border border-red-200">{error}</p>
      <button
        onClick={onRetry}
        className="mt-8 px-6 py-3 rounded-xl font-medium text-white bg-black shadow-md flex items-center gap-2 hover:shadow-lg transition-all"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HEADER  —  sticky, breadcrumbs, timer, cancel
   ═══════════════════════════════════════════════════════════════════════════════ */
function Header({
  sessionId,
  metadata,
  elapsedSeconds,
  isComplete,
  isCancelling,
  cancelled,
  showCancelConfirm,
  onShowCancelConfirm,
  onCancel,
  pageTitleId,
}: {
  sessionId: string;
  metadata?: { fullName?: string; dateOfBirth?: string; tentativeTime?: string; birthPlace?: string; offsetConfig?: { preset?: string; customMinutes?: number; minutes?: number } };
  elapsedSeconds: number;
  isComplete: boolean;
  isCancelling: boolean;
  cancelled: boolean;
  showCancelConfirm: boolean;
  onShowCancelConfirm: (v: boolean) => void;
  onCancel: () => void;
  pageTitleId: string;
}) {
  return (
    <header className="sticky top-[3.5rem] z-40 border-b backdrop-blur-md bg-white/80 border-black/[0.06]" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex items-center gap-1 text-xs text-[var(--prism-graphite)]" aria-label="Breadcrumb">
            <li><Link href="/" className="flex items-center gap-1.5 hover:text-black transition-colors"><Home className="w-4 h-4" />Home</Link></li>
            <li aria-hidden="true" className="opacity-50">/</li>
            <li><Link href="/dashboard" className="flex items-center gap-1.5 hover:text-black transition-colors"><LayoutDashboard className="w-4 h-4" />Dashboard</Link></li>
            <li aria-hidden="true" className="opacity-50">/</li>
            <li className="flex items-center gap-1.5 font-semibold text-black" aria-current="page"><Activity className="w-4 h-4" />Analysis</li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <div>
            <h1 id={pageTitleId} className="text-lg sm:text-xl font-medium flex items-center gap-2 text-[var(--prism-ink)]">
              {metadata?.fullName || 'Birth Time Analysis'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[var(--prism-graphite)]">
                {sessionId.slice(0, 8)}
              </span>
            </h1>
            {(metadata?.dateOfBirth || metadata?.tentativeTime || metadata?.birthPlace || metadata?.offsetConfig) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--prism-graphite)]">
                {metadata?.dateOfBirth && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{metadata.dateOfBirth}</span>
                  </div>
                )}
                {metadata?.tentativeTime && (
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    <span className="font-mono font-medium">{metadata.tentativeTime}</span>
                    {metadata.offsetConfig && (
                      <span className="text-black font-medium">
                        ±{metadata.offsetConfig.customMinutes ?? metadata.offsetConfig.minutes ?? 60}min
                      </span>
                    )}
                  </div>
                )}
                {metadata?.birthPlace && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{metadata.birthPlace}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
              <Clock className="w-3.5 h-3.5 text-[var(--prism-graphite)]" />
              <span className="font-medium">{fmtTime(elapsedSeconds)}</span>
            </div>

            {!isComplete && !cancelled && (
              <div className="relative">
                {showCancelConfirm ? (
                  <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm</button>
                    <button onClick={() => onShowCancelConfirm(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Keep Running</button>
                  </div>
                ) : (
                  <button
                    onClick={() => onShowCancelConfirm(true)}
                    disabled={isCancelling}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50 flex items-center gap-1.5 border-[#C65D3B]/30 text-[#C65D3B]"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP INDICATOR  (Step 1/2/3 style, 6 analysis stages)
   ═══════════════════════════════════════════════════════════════════════════════ */
function StepIndicator({ currentStage, isComplete }: { currentStage: number; isComplete: boolean }) {
  // Show only S1–S6 (skip S0/init).  currentStage is 0-indexed (0=init, 1=S1, …).
  const labels = STAGES.slice(1).map(s => s.shortName); // 6 labels
  const total = labels.length;
  // During init (0) show step 1 as active; when done show all completed.
  const step = isComplete ? total + 1 : Math.max(1, Math.min(currentStage, total));

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <p className="text-center text-xs text-[var(--prism-slate)] mb-3">
        Stage {Math.min(step, total)} of {total}
      </p>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 w-full h-1 bg-[rgba(0,0,0,0.08)] rounded-full" />
        <div
          className="absolute top-4 left-0 h-1 bg-[var(--prism-ink)] rounded-full transition-all duration-500"
          style={{ width: `${((Math.min(step, total) - 1) / (total - 1)) * 100}%` }}
        />
        {labels.map((label, i) => {
          const s = i + 1;
          const done = s < step;
          const active = s === step;
          return (
            <div key={s} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all border-2 ${
                  done
                    ? 'bg-[#184131] border-[#184131] text-white'
                    : active
                    ? 'bg-white border-[var(--prism-ink)] text-black shadow-[0_0_10px_rgba(0,0,0,0.08)]'
                    : 'bg-white border-[#EBE2D6] text-[var(--prism-slate)]'
                }`}
              >
                {done ? '✓' : s}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium text-center ${active ? 'text-black' : 'text-[var(--prism-slate)]'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATUS BANNER
   ═══════════════════════════════════════════════════════════════════════════════ */
function StatusBanner({
  currentStage,
  isConnected,
  isComplete,
  elapsedSeconds,
}: {
  currentStage: number;
  isConnected: boolean;
  isComplete: boolean;
  elapsedSeconds: number;
}) {
  const stage = STAGES[currentStage] ?? STAGES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 sm:p-5 ${
        isComplete
          ? 'bg-gradient-to-r from-[#184131]/10 to-transparent border-[#184131]/20'
          : 'bg-gradient-to-r from-[#C65D3B]/[0.06] via-[#C65D3B]/[0.03] to-transparent border-[#C65D3B]/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-[#184131]/20' : 'bg-black/20'}`}>
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-[#184131]" />
            ) : (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Activity className="w-5 h-5 text-black" />
              </motion.div>
            )}
          </div>
          <div>
            <p className="font-medium text-black text-sm sm:text-base">{stage.name}</p>
            <p className="text-xs sm:text-sm text-black/60 mt-0.5">{stage.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#184131]' : isConnected ? 'bg-[#184131] animate-pulse' : 'bg-[#C65D3B]'}`} />
            <span className="text-xs font-medium text-black/60">{isComplete ? 'Complete' : isConnected ? 'Live' : 'Reconnecting'}</span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-black/60 uppercase tracking-wider">Elapsed</p>
            <p className="text-sm font-medium text-black font-mono">{fmtTime(elapsedSeconds)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PIPELINE  (S1–S6 only, skip S0/init)
   ═══════════════════════════════════════════════════════════════════════════════ */
function Pipeline({ currentStage, isComplete, isConnected, percentage }: { currentStage: number; isComplete: boolean; isConnected: boolean; percentage?: number }) {
  const pipelineStages = useMemo(() => STAGES.slice(1), []); // S1–S6

  const stageStates = useMemo(() => {
    return pipelineStages.map((_stage, index) => {
      const stageNum = index + 1;
      if (isComplete) return 'completed';
      if (stageNum < currentStage) return 'completed';
      if (stageNum === currentStage) return 'active';
      return 'pending';
    });
  }, [isComplete, currentStage, pipelineStages]);

  const completedCount = stageStates.filter(s => s === 'completed').length;
  // Use backend-authoritative percentage when available (backend divides by 7 steps including init).
  // Falls back to local calculation over visible stages for standalone display.
  const progressPercent = percentage ?? Math.round((completedCount / pipelineStages.length) * 100);

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#184131] animate-pulse' : 'bg-[#C65D3B]'}`} />
          <span className="text-xs font-medium text-black/60">{isConnected ? 'Processing' : 'Reconnecting'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {pipelineStages.map((stage, index) => {
          const state = stageStates[index];
          const isLast = index === pipelineStages.length - 1;
          return (
            <React.Fragment key={stage.id}>
              <motion.div
                animate={{ scale: state === 'active' ? 1.05 : 1 }}
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0 transition-all duration-300 ${
                  state === 'completed' ? 'bg-[#184131] text-white' :
                  state === 'active' ? 'bg-[var(--prism-ink)] text-white ring-2 ring-black/20' :
                  'bg-[var(--prism-canvas)] text-[var(--prism-slate)]'
                }`}
                title={stage.name}
              >
                {state === 'completed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                {state === 'active' && <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />}
                {state === 'pending' && <span className="text-xs">{stage.id}</span>}
              </motion.div>
              {!isLast && (
                <div className="flex-1 h-0.5 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden min-w-[4px] sm:min-w-[8px]">
                  <motion.div className="h-full bg-[#184131]" initial={{ width: 0 }} animate={{ width: state === 'completed' ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(0,0,0,0.08)]">
        <span className="text-xs text-black/60">Progress</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 sm:w-32 bg-[var(--prism-canvas)] rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-[var(--prism-ink)] to-[#184131] rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
          </div>
          <span className="text-xs font-mono font-medium text-black">{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CANDIDATE ROW  (expandable)
   ═══════════════════════════════════════════════════════════════════════════════ */
function CandidateRow({ candidate, index, isLeader }: { candidate: CandidateScore; index: number; isLeader: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border transition-all duration-200 ${
        expanded ? 'border-[#C65D3B]/30 bg-[#C65D3B]/[0.03]' : 'border-[rgba(0,0,0,0.04)] bg-white hover:border-[#C65D3B]/20'
      }`}
    >
      <button
        type="button"
        className="w-full px-3 py-2 flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-mono text-[var(--prism-slate)] w-4 shrink-0">{index + 1}</span>
          <span className={`text-[13px] font-mono font-medium truncate ${isLeader && candidate.score > 0 ? 'text-[#C65D3B]' : 'text-[var(--prism-ink)]'}`}>
            {candidate.time}
          </span>
          {isLeader && candidate.score > 0 && <Zap className="w-2.5 h-2.5 text-[#C65D3B] shrink-0" />}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {candidate.score > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-10 h-1 bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${candidate.score}%` }} className={`h-full rounded-full ${candidate.score > 85 ? 'bg-[#184131]' : 'bg-[#C65D3B]'}`} />
              </div>
              <span className="text-[9px] font-mono font-medium text-[var(--prism-graphite)]">{candidate.score.toFixed(0)}%</span>
            </div>
          )}
          {expanded ? <ChevronUp className="w-3 h-3 text-[var(--prism-slate)]" /> : <ChevronDown className="w-3 h-3 text-[var(--prism-slate)]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[rgba(0,0,0,0.04)] px-3 py-2 bg-[var(--prism-canvas)]/50">
          <div className="flex items-center gap-3 flex-wrap text-[9px] text-[var(--prism-graphite)] font-mono">
            {candidate.minifiedEph?.ascendant && <span>ASC: <span className="text-[var(--prism-ink)] font-medium">{candidate.minifiedEph.ascendant}</span></span>}
            {candidate.minifiedEph?.sun && <span>SUN: <span className="text-[var(--prism-ink)] font-medium">{candidate.minifiedEph.sun}</span></span>}
            {candidate.minifiedEph?.moon && <span>MOON: <span className="text-[var(--prism-ink)] font-medium">{candidate.minifiedEph.moon.split(' ')[0]}</span></span>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CANDIDATES PANEL  (per stage)
   ═══════════════════════════════════════════════════════════════════════════════ */
function StageCandidates({ scores, stage }: { scores: CandidateScore[]; stage: number }) {
  const stageScores = useMemo(() => {
    const unique = new Map<string, CandidateScore>();
    scores.forEach(s => {
      if (s.stage !== stage) return;
      const existing = unique.get(s.time);
      if (!existing || s.score > existing.score) unique.set(s.time, s);
    });
    return Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 12);
  }, [scores, stage]);

  if (stageScores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--prism-canvas)] border-b border-[rgba(0,0,0,0.06)]">
          <Trophy className="w-3.5 h-3.5 text-[#C65D3B]" />
          <h3 className="text-[11px] font-medium text-[var(--prism-ink)] uppercase tracking-wider">Top Candidates</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-[11px] text-[var(--prism-slate)] font-medium uppercase tracking-wider">Awaiting candidates…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--prism-canvas)] border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#C65D3B]/10 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-[#C65D3B]" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[var(--prism-ink)] uppercase tracking-wider">Top Candidates</h3>
            <p className="text-[9px] text-[var(--prism-slate)] font-mono">{stageScores.length} candidates</p>
          </div>
        </div>
        <span className="text-[9px] font-mono text-[var(--prism-graphite)] bg-white px-2 py-0.5 rounded border border-[rgba(0,0,0,0.06)]">S{stage}</span>
      </div>

      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {stageScores.map((s, idx) => (
          <CandidateRow key={`${stage}-${s.time}`} candidate={s} index={idx} isLeader={idx === 0} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REASONING BATCH CARD  (expandable card for one batch candidate)
   ═══════════════════════════════════════════════════════════════════════════════ */
function BatchCard({
  candidate,
  isSelected,
  onSelect,
}: {
  candidate: AIThinking;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const candidateTime = candidate.candidateTime || 'Unknown';
  const truncatedText = candidate.fullText
    ? candidate.fullText.length > 160
      ? candidate.fullText.slice(0, 160) + '…'
      : candidate.fullText
    : '';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full text-left rounded-lg border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-[#184131] bg-[#184131]/5 shadow-sm ring-1 ring-[#184131]/20'
          : 'border-[rgba(0,0,0,0.06)] bg-white hover:border-[#C65D3B]/30 hover:shadow-sm'
      }`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="w-3.5 h-3.5 text-[#C65D3B] shrink-0" />
            <span className="text-[13px] font-mono font-medium text-[var(--prism-ink)] truncate">
              {candidateTime}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {candidate.chunks && candidate.chunks.length > 0 && (
              <span className="text-[9px] text-[var(--prism-slate)] font-mono">{candidate.chunks.length} chunks</span>
            )}
            {isSelected ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#184131]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--prism-slate)]" />
            )}
          </div>
        </div>
        {!isSelected && truncatedText && (
          <p className="text-[10px] text-[var(--prism-graphite)] mt-1.5 leading-relaxed line-clamp-2">
            {truncatedText}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REASONING EXPANDED VIEW  (full-width reasoning for selected batch)
   ═══════════════════════════════════════════════════════════════════════════════ */
function ExpandedReasoning({
  candidate,
  onClose,
}: {
  candidate: AIThinking;
  onClose: () => void;
}) {
  const candidateTime = candidate.candidateTime || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--prism-canvas)] border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="w-4 h-4 text-[#C65D3B] shrink-0" />
          <span className="text-[13px] font-mono font-medium text-[var(--prism-ink)]">{candidateTime}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[var(--prism-slate)] hover:text-[var(--prism-ink)] rounded-lg hover:bg-[rgba(0,0,0,0.04)] transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Collapse
        </button>
      </div>
      <div className="p-4 max-h-[480px] overflow-y-auto">
        {candidate.fullText ? (
          <div className="text-[12px] text-[var(--prism-graphite)] font-mono leading-relaxed whitespace-pre-wrap">
            {candidate.fullText}
          </div>
        ) : candidate.chunks && candidate.chunks.length > 0 ? (
          <div className="text-[12px] text-[var(--prism-graphite)] font-mono leading-relaxed whitespace-pre-wrap">
            {candidate.chunks.join('')}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--prism-slate)] font-mono text-center py-8">
            No reasoning content available for this batch.
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REASONING PANEL  (batch cards + candidate scores for AI stages)
   ═══════════════════════════════════════════════════════════════════════════════ */
function ReasoningPanel({
  stageCandidates,
  isActive,
  selectedBatch,
  onSelectBatch,
}: {
  stageCandidates: Record<string, AIThinking>;
  isActive: boolean;
  selectedBatch: string | null;
  onSelectBatch: (candidateTime: string | null) => void;
}) {
  const sortedBatches = useMemo(() => {
    return Object.entries(stageCandidates)
      .map(([time, data]) => ({ time, ...data }))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [stageCandidates]);

  if (selectedBatch && stageCandidates[selectedBatch]) {
    return (
      <ExpandedReasoning
        candidate={stageCandidates[selectedBatch]}
        onClose={() => onSelectBatch(null)}
      />
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--prism-canvas)] border-b border-[rgba(0,0,0,0.06)] shrink-0">
        <div className="w-7 h-7 rounded-md bg-[#C65D3B]/10 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-[#C65D3B]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-medium text-[var(--prism-ink)] uppercase tracking-wider truncate">AI Reasoning Engine</h3>
        </div>
        {isActive && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#C65D3B]/10 rounded-full border border-[#C65D3B]/20"
          >
            <Radio className="w-2 h-2 text-[#C65D3B]" />
            <span className="text-[8px] font-medium text-[#C65D3B] uppercase">Live</span>
          </motion.div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {sortedBatches.length > 0 ? (
          sortedBatches.map((batch) => (
            <BatchCard
              key={batch.time}
              candidate={batch}
              isSelected={selectedBatch === batch.time}
              onSelect={() => onSelectBatch(selectedBatch === batch.time ? null : batch.time)}
            />
          ))
        ) : (
          <div className="text-[11px] text-[var(--prism-slate)] font-mono text-center py-8">
            {isActive ? (
              <span>Waiting for reasoning data…</span>
            ) : (
              <span>No reasoning available for this stage.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAGE PANEL  (one per active/completed stage, S1–S6)
   - Odd stages (1,3,5): Non-AI, single container
   - Even stages (2,4,6): AI reasoning + candidates with expandable batch cards
   ═══════════════════════════════════════════════════════════════════════════════ */
function StagePanel({
  stageNum,
  candidatesByStage,
  allSteps,
  currentStageIndex,
  isComplete,
  candidateScores,
}: {
  stageNum: number;
  candidatesByStage: Record<number, Record<string, AIThinking>>;
  allSteps: { id?: string; name?: string }[];
  currentStageIndex: number;
  isComplete: boolean;
  candidateScores: CandidateScore[];
}) {
  const stageCandidates = candidatesByStage?.[stageNum] || {};
  const isStageCompleted = stageNum < currentStageIndex || isComplete;
  const isCurrentStage = stageNum === currentStageIndex && !isComplete;
  const candidateCount = Object.keys(stageCandidates).length;

  const stepDef = allSteps?.[stageNum] ?? { id: `stage-${stageNum}`, name: STAGES[stageNum]?.name || `Stage ${stageNum}` };
  // Even stages (2,4,6) are AI reasoning stages; odd stages (1,3,5) are grid computation
  const isAIStage = stageNum % 2 === 0;

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Don't render future stages with zero data
  if (candidateCount === 0 && !isCurrentStage && !isStageCompleted) return null;

  return (
    <motion.div
      id={`stage-${stageNum}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Stage header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-all duration-500 ${
            isCurrentStage
              ? 'bg-[#C65D3B] border-[#C65D3B]/30 text-white shadow-sm ring-4 ring-[#C65D3B]/10'
              : isStageCompleted
              ? 'bg-[#184131] border-[#184131]/20 text-white'
              : 'bg-white border-[rgba(0,0,0,0.08)] text-[var(--prism-slate)]'
          }`}
        >
          {stageNum}
        </div>
        <h3 className={`text-xs font-medium uppercase tracking-widest ${isCurrentStage ? 'text-[#C65D3B]' : 'text-[var(--prism-graphite)]'}`}>
          {stepDef.name}
        </h3>
        {isCurrentStage && <span className="text-[9px] font-mono text-[var(--prism-slate)] ml-auto">Stage {stageNum} of 6</span>}
      </div>

      {isAIStage ? (
        selectedBatch ? (
          /* Expanded batch: show full reasoning across the entire stage width */
          <ExpandedReasoning
            candidate={stageCandidates[selectedBatch]}
            onClose={() => setSelectedBatch(null)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReasoningPanel
              stageCandidates={stageCandidates}
              isActive={isCurrentStage}
              selectedBatch={selectedBatch}
              onSelectBatch={setSelectedBatch}
            />
            <StageCandidates scores={candidateScores} stage={stageNum} />
          </div>
        )
      ) : (
        <div className="bg-white/50 rounded-xl border border-[rgba(0,0,0,0.06)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCurrentStage ? 'bg-blue-500 animate-pulse' : 'bg-[var(--prism-pebble)]'}`} />
              <span className="text-[10px] font-bold text-[var(--prism-slate)] uppercase tracking-wider">
                {isCurrentStage ? 'Computing Mathematical Grids…' : 'Computation Complete'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--prism-slate)]">{candidateCount} variations generated</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPLETION BANNER
   ═══════════════════════════════════════════════════════════════════════════════ */
function CompletionBanner({
  result,
  sessionId,
}: {
  result: { rectifiedTime?: string; confidence?: string; accuracy?: number } | null;
  sessionId: string;
}) {
  if (!result) return null;

  return (
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
          <h2 className="text-xl font-bold text-[var(--prism-ink)] mb-1">Analysis Successfully Completed</h2>
          <p className="text-sm text-[var(--prism-graphite)] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 font-bold text-[#184131]">
              <Activity className="w-4 h-4" /> {result.rectifiedTime}
            </span>
            <span className="w-1 h-1 rounded-full bg-stone-300" />
            <span className="flex items-center gap-1.5 font-bold text-[#B8860B]">
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
          className="flex-1 md:flex-none px-6 py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all shadow-md"
        >
          View Official Report <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CANCELLED / FAILED
   ═══════════════════════════════════════════════════════════════════════════════ */
function CancelledState({
  isFailed,
  errorMessage,
  onRestart,
  isCancelling,
}: {
  isFailed: boolean;
  errorMessage?: string;
  onRestart: () => void;
  isCancelling: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border shadow-sm overflow-hidden bg-white"
      style={{ borderColor: 'rgba(198,93,59,0.2)' }}
    >
      <div className="p-6 sm:p-8 text-center">
        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2 text-[var(--prism-ink)]">{isFailed ? 'Analysis Failed' : 'Analysis Stopped'}</h2>
        <p className="mb-6 text-sm text-[var(--prism-graphite)]">{errorMessage || 'The analysis was terminated.'}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRestart}
            disabled={isCancelling}
            className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 bg-[#184131] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isCancelling ? 'animate-spin' : ''}`} /> Restart
          </button>
          <Link href="/rectify?new=true" className="px-5 py-2.5 rounded-xl font-semibold border flex items-center gap-2 border-[rgba(0,0,0,0.08)] text-[var(--prism-ink)]">
            <Home className="w-4 h-4" /> New Analysis
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const sessionId = params.id as string;
  const pageTitleId = useId();

  const session = useAnalysisSession(sessionId, isLoaded ?? false, isSignedIn ?? false, getToken);
  const actions = useAnalysisActions(sessionId);

  const setCancelledRef = useRef(actions.setCancelled);
  setCancelledRef.current = actions.setCancelled;

  useEffect(() => {
    if (session.metadata?.status === 'cancelled') setCancelledRef.current(true);
    else if (session.metadata?.status && ['pending', 'queued', 'processing', 'retrying'].includes(session.metadata.status)) {
      setCancelledRef.current(false);
    }
  }, [session.metadata?.status, session.isComplete]);

  useEffect(() => {
    if (session.isComplete && session.result) {
      try {
        localStorage.setItem(`rectification_result_${sessionId}`, JSON.stringify({
          rectifiedTime: session.result.rectifiedTime,
          accuracy: session.result.accuracy,
          confidence: session.result.confidence,
        }));
      } catch (err) {
        logger.warn('[Rectify] localStorage unavailable', { error: err instanceof Error ? err.message : String(err) });
      }
      logger.info('Analysis complete. Staying on page for review.', { sessionId });
    }
  }, [session.isComplete, session.result, sessionId]);

  if (!isLoaded) return <LoadingState />;
  if (!isSignedIn && typeof window !== 'undefined' && !(window as { isTestEnv?: boolean }).isTestEnv) {
    router.push('/sign-in');
    return <LoadingState />;
  }
  if (!actions.cancelled && !session.hasError && !session.result && !session.hasData) {
    return <LoadingState />;
  }
  if (session.hasError && !session.result) {
    return <ErrorState error={session.errorMessage} onRetry={() => router.refresh()} />;
  }

  const currentStageIndex = Math.max(session.progress?.stepIndex ?? 0, session.activeAIStage ?? 0);

  // Build sorted list of stages that have data or are active (S1–S6 only)
  const incomingStageNumbers = Object.keys(session.candidatesByStage).map(Number).filter(n => n > 0);
  const activeStageNumbers = new Set([1, 2, 3, 4, 5, 6].filter(n => n <= currentStageIndex || incomingStageNumbers.includes(n)));
  const sortedStages = Array.from(activeStageNumbers).sort((a, b) => a - b); // chronological order

  return (
    <AnalysisErrorBoundary sectionName="Analysis Page">
      <Layout hideFooter fullWidth>
        <div className="font-sans bg-[var(--prism-canvas)] min-h-screen pt-14" aria-labelledby={pageTitleId}>
        <Header
          sessionId={sessionId}
          metadata={session.metadata}
          elapsedSeconds={session.elapsedSeconds}
          isComplete={session.isComplete}
          isCancelling={actions.isCancelling}
          cancelled={actions.cancelled}
          showCancelConfirm={actions.showCancelConfirm}
          onShowCancelConfirm={actions.setShowCancelConfirm}
          onCancel={actions.handleCancel}
          pageTitleId={pageTitleId}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Step Indicator */}
          <StepIndicator currentStage={currentStageIndex} isComplete={session.isComplete} />

          {/* Status Banner */}
          <StatusBanner
            currentStage={currentStageIndex}
            isConnected={session.isConnected ?? true}
            isComplete={session.isComplete}
            elapsedSeconds={session.elapsedSeconds}
          />

          {/* Birth Details Banner */}
          {session.metadata && (
            <BirthDetailsBanner
              birthData={{
                fullName: session.metadata.fullName || '',
                dateOfBirth: session.metadata.dateOfBirth,
                tentativeTime: session.metadata.tentativeTime,
                birthPlace: session.metadata.birthPlace,
              }}
            />
          )}

          {/* Pipeline */}
          {!actions.cancelled && (
            <Pipeline
              currentStage={currentStageIndex}
              isComplete={session.isComplete}
              isConnected={session.isConnected ?? true}
              percentage={session.progress?.percentage}
            />
          )}

          {/* Cancelled / Failed */}
          <AnimatePresence>
            {(actions.cancelled || session.metadata?.status === 'failed') && (
              <CancelledState
                isFailed={session.metadata?.status === 'failed'}
                errorMessage={session.metadata?.errorMessage}
                onRestart={actions.handleRestart}
                isCancelling={actions.isCancelling}
              />
            )}
          </AnimatePresence>

          {/* Completion */}
          <AnimatePresence>
            {session.isComplete && session.result && (
              <CompletionBanner result={session.result} sessionId={sessionId} />
            )}
          </AnimatePresence>

          {/* Multi-Stage Panels */}
          {!actions.cancelled && (
            <div className="space-y-4 sm:space-y-6">
              {sortedStages.map(stageNum => (
                <StagePanel
                  key={stageNum}
                  stageNum={stageNum}
                  candidatesByStage={session.candidatesByStage}
                  allSteps={session.allSteps}
                  currentStageIndex={currentStageIndex}
                  isComplete={session.isComplete}
                  candidateScores={session.candidateScores}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </Layout>
      <SSEDebugPanel />
    </AnalysisErrorBoundary>
  );
}
