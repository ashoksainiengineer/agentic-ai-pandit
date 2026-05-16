'use client';

import React, { useState, useEffect, useCallback, memo, useRef, useMemo, useId } from 'react';
import '@/app/globals.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Brain,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Home,
  ChevronRight,
  Gem,
  AlertCircle,
  LayoutDashboard,
  Calendar,
  MapPin,
  Timer
} from 'lucide-react';
import { useAnalysisSSE } from '@/lib/use-analysis-sse';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import type { CandidateScore } from '@/lib/store/stream-types';

import { logger } from '@/lib/secure-logger';
import { env } from '@/lib/config';
import { AnalysisErrorBoundary, SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import { TestModeProvider } from '@/lib/test-mode-context';
import type { AIThinking } from '@/components/rectify/UnifiedAIPanel/types';
const AdvancedSignalsDashboard = dynamic(() => import('@/components/rectify/advanced-signals/AdvancedSignalsDashboard'), { ssr: false });
const UnifiedAIPanel = dynamic(() => import('@/components/rectify/UnifiedAIPanel').then(mod => mod.UnifiedAIPanel), { ssr: false });
const AnalysisStatusBanner = dynamic(() => import('@/components/rectify/analysis/AnalysisStatusBanner').then(mod => mod.AnalysisStatusBanner), { ssr: false });
const SimplifiedPipeline = dynamic(() => import('@/components/rectify/analysis/SimplifiedPipeline').then(mod => mod.SimplifiedPipeline), { ssr: false });
const TechnicalMethodology = dynamic(() => import('@/components/rectify/analysis/TechnicalMethodology').then(mod => mod.TechnicalMethodology), { ssr: false });
const StageLeaderboard = dynamic(() => import('@/components/rectify/analysis/StageLeaderboard').then(mod => mod.StageLeaderboard), { ssr: false });

// 🔧 Dev-only: SSE Debug Panel for real-time stream inspection
const SSEDebugPanel = env.app.isDevelopment
  ? dynamic(() => import('@/components/dev/SSEDebugPanel'), { ssr: false })
  : () => null;

const GlobalStyles = memo(() => (
  <style jsx global>{`
    .style-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .style-scroll::-webkit-scrollbar-track { background: #efefef; border-radius: 10px; }
    .style-scroll::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 10px; }
    .style-scroll::-webkit-scrollbar-thumb:hover { background: #000000; }
  `}</style>
));
GlobalStyles.displayName = 'GlobalStyles';

const THEME = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#d9d9d9',
  textPrimary: '#000000',
  textSecondary: '#636363',
  gold: '#000000',
  success: '#184131',
  error: '#C65D3B',
};

const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--prism-canvas)] text-center p-4">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
      <Gem className="w-16 h-16 text-black" />
    </motion.div>
    <h1 className="text-2xl font-medium mt-6 text-black">Starting Analysis...</h1>
    <p className="text-lg text-black/60 mt-2">Establishing secure connection...</p>
  </div>
));
LoadingState.displayName = 'LoadingState';

const ErrorDisplay = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--prism-canvas)] text-center p-4" role="alert">
    <AlertCircle className="w-16 h-16 text-red-500" />
    <h1 className="text-2xl font-medium mt-6 text-red-700">Connection Error</h1>
    <p className="text-xs text-red-600 mt-2 max-w-2xl bg-red-50 p-4 rounded border border-red-200">{error}</p>
    <button onClick={onRetry} className="mt-8 px-6 py-3 rounded-2xl font-medium text-white bg-black shadow-md flex items-center gap-2 hover:shadow-sm transition-all">
      <RefreshCw className="w-4 h-4" /> Retry
    </button>
  </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

const Breadcrumbs = memo(({ items }: { items: { label: string; href?: string; icon?: React.ReactNode }[] }) => (
  <nav aria-label="Breadcrumb" className="mb-1">
    <ol className="flex items-center gap-2 text-xs text-black/60">
      {items.map((item, index) => (
        <li key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="flex items-center gap-1.5 hover:text-black transition-colors">
              {item.icon}{item.label}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-black">{item.icon}{item.label}</span>
          )}
          {index < items.length - 1 && <span className="opacity-50">/</span>}
        </li>
      ))}
    </ol>
  </nav>
));
Breadcrumbs.displayName = 'Breadcrumbs';

const AnalysisTimer = memo(({ startedAt, isComplete, updatedAt }: { startedAt: string | null; isComplete: boolean; updatedAt?: string }) => {
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const finalDurationRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const effectiveStart = startedAt || updatedAt;
    if (!effectiveStart) return;

    const startDate = new Date(effectiveStart);
    if (isNaN(startDate.getTime())) return;
    const startMs = startDate.getTime();

    if (isComplete) {
      if (finalDurationRef.current === null) {
        finalDurationRef.current = Date.now() - startMs;
      }
      setDuration(finalDurationRef.current);
      return;
    }

    const interval = setInterval(() => setDuration(Date.now() - startMs), 1000);
    setDuration(Date.now() - startMs);
    return () => clearInterval(interval);
  }, [startedAt, updatedAt, isComplete]);

  if (!mounted || (!startedAt && !updatedAt)) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-sm bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
        <Clock className="w-3.5 h-3.5 text-black/60" />
        <span className="text-xs font-medium">Waiting...</span>
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(duration / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
      <Clock className="w-3.5 h-3.5 text-black/60" />
      <span className="font-medium">{minutes}:{seconds}</span>
    </div>
  );
});
AnalysisTimer.displayName = 'AnalysisTimer';

// (Removed broken local ETA calculator)

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const pageTitleId = useId();

  const { isConnected } = useAnalysisSSE(sessionId);

  const connectionState = { status: isConnected ? 'connected' as const : 'polling' as const, url: '', lastError: null };

  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRY PATTERN: Batched shallow selectors (Linear/Vercel/Figma pattern)
  // Instead of 17 individual subscriptions each triggering independent re-renders,
  // we use 2 batched selectors with shallow equality comparison.
  // React only re-renders when actual VALUES change, not object identity.
  // ═══════════════════════════════════════════════════════════════════════════
  // Batched shallow selectors (Standardized Pattern)
  const {
    isComplete,
    streamError,
    progress,
    candidateScores,
    advancedSignals,
    result,
    startedAt,
    allSteps,
    metadata,
    activeAIStage,
    analyzedCount,
    totalCandidates
  } = useStreamStore(useShallow(state => ({
    isComplete: state.isComplete,
    streamError: state.error,
    progress: state.progress,
    candidateScores: state.candidateScores,
    advancedSignals: state.advancedSignals,
    result: state.result,
    startedAt: state.startedAt,
    allSteps: state.allSteps,
    metadata: state.metadata,
    activeAIStage: state.activeAIStage,
    analyzedCount: state.analyzedCount,
    totalCandidates: state.totalCandidates,
  })));

  const {
    candidatesByStage,
    stageHistory,
    displayedCandidate,
    setDisplayedCandidate,
    stageStats
  } = useStreamStore(useShallow(state => ({
    candidatesByStage: state.candidatesByStage,
    stageHistory: state.stageHistory,
    displayedCandidate: state.displayedCandidate,
    setDisplayedCandidate: state.setDisplayedCandidate,
    stageStats: state.stageStats,
  })));

  // isConnected declared above with the connectionState constant

  const [isCancelling, _setIsCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // High-precision Varga state synchronization
  const offsetMinutes = useMemo(() => {
    return metadata?.offsetConfig?.customMinutes ??
      (metadata?.offsetConfig?.preset === '30min' ? 30 :
        metadata?.offsetConfig?.preset === '1hour' ? 60 :
          metadata?.offsetConfig?.preset === '2hours' ? 120 :
            metadata?.offsetConfig?.preset === '4hours' ? 240 :
              metadata?.offsetConfig?.preset === '6hours' ? 360 :
                metadata?.offsetConfig?.preset === '12hours' ? 720 : 60);
  }, [metadata?.offsetConfig]);

  useEffect(() => {
    if (metadata?.status === 'cancelled') setCancelled(true);
    else if (metadata?.status && ['pending', 'queued', 'processing'].includes(metadata.status)) setCancelled(false);

    // Removed the stale isComplete check that caused the UI to reset back to 'Starting analysis...'
  }, [metadata?.status, isComplete]);

  useEffect(() => {
    if (isComplete) {
      // Guard: Don't process if store rehydrated stale isComplete from localStorage
      // Polling is always active; result is from store

      // Save result to localStorage if available (SSE provides it, polling may not)
      if (result) {
        try {
          localStorage.setItem(`rectification_result_${sessionId}`, JSON.stringify({
            rectifiedTime: result.rectifiedTime,
            accuracy: result.accuracy,
            confidence: result.confidence,
          }));
        } catch (err) { console.warn('[DebugAnalysis] localStorage unavailable:', err); }
      }

      // Standard: We no longer auto-redirect.
      // User stays on this page to review all reasoning stages.
      logger.info('Analysis complete. Staying on page for review.', { sessionId });
    }
  }, [isComplete, result, sessionId, connectionState.status]);

  const cancelActiveAnalysis = useCallback(async () => {
    alert("Cancel disabled in Debug Mode");
    return;
  }, []);

  const restartAnalysisSession = useCallback(async () => {
    alert("Restart disabled in Debug Mode");
    return;
  }, []);

  const selectAnalysisStage = useCallback((stageId: number) => {
    const el = document.getElementById(`stage-${stageId}`);
    if (el) {
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Live elapsed timer — updates every second
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!startedAt) { setElapsedSeconds(0); return; }
    const startMs = new Date(startedAt).getTime();
    if (isNaN(startMs)) { setElapsedSeconds(0); return; }
    // Set initial value immediately
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);


  const sortedCandidateScores = useMemo(() => {
    if (!candidateScores || candidateScores.length === 0) return [];

    // Standard: Prioritize the LATEST stage that has scores
    // This ensures that Stage 4/6 precision results "win" over Stage 2 coarse results
    // BUG-FIX: Use reduce instead of spread to avoid large intermediate array
    const maxStage = candidateScores.reduce((max, s) => Math.max(max, s.stage), 0);

    // Filter for unique candidates in the latest stage
    // (If latest stage only has a few, we might want to fallback, but typically 
    // the backend emits scores for all batch survivors)
    const uniqueMap = new Map<string, CandidateScore>();

    // Strategy: Take scores from the highest stage only to avoid apples-to-oranges comparisons
    const latestStageScores = candidateScores.filter(s => s.stage === maxStage);

    latestStageScores.forEach(s => {
      const existing = uniqueMap.get(s.time);
      if (!existing || s.score > existing.score) {
        uniqueMap.set(s.time, s);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => b.score - a.score);
  }, [candidateScores]);

  const hasError = streamError;
  const errorMessage = streamError || 'Unknown error';
  // Polling is always active; only hasData indicates state
  const hasData = progress || candidateScores.length > 0 || Object.keys(candidatesByStage).length > 0;
  if (!hasError && !result && !hasData) {
    return <LoadingState />;
  }

  if (hasError && !result) {
    return <ErrorDisplay error={errorMessage} onRetry={() => router.push(`/rectify/${sessionId}`)} />;
  }

  return (
    <TestModeProvider value={true}>
      <AnalysisErrorBoundary sectionName="Analysis Page">
      <GlobalStyles />
      <main className="min-h-screen font-sans" style={{ backgroundColor: THEME.bg }} aria-labelledby={pageTitleId}>

        <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-white/90 backdrop-blur-prism-lg" style={{ borderColor: THEME.border }} role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <Breadcrumbs items={[
              { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
              { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { label: 'Analysis', icon: <Activity className="w-4 h-4" /> },
            ]} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
              <div>
                <h1 id={pageTitleId} className="text-lg sm:text-xl font-medium flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                  {metadata?.fullName || 'Birth Time Analysis'}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-black/60">
                    {sessionId.slice(0, 8)}
                  </span>
                </h1>

                {/* Birth Details */}
                {(metadata?.dateOfBirth || metadata?.tentativeTime || metadata?.birthPlace || metadata?.offsetConfig) && (
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-black/60">
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
                <AnalysisTimer startedAt={startedAt || null} updatedAt={metadata?.updatedAt} isComplete={isComplete} />

                {!isComplete && !cancelled && (
                  <div className="relative">
                    {showCancelConfirm ? (
                      <div className="flex items-center gap-2">
                        <button onClick={cancelActiveAnalysis} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                          Confirm
                        </button>
                        <button onClick={() => setShowCancelConfirm(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                          Keep Running
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowCancelConfirm(true)} disabled={isCancelling} className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-red-50 flex items-center gap-1.5" style={{ borderColor: `${THEME.error}40`, color: THEME.error }}>
                        <XCircle className="w-3.5 h-3.5" /> Stop
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

          <AnalysisStatusBanner
            currentStage={progress?.stepIndex ?? 0}
            candidateCount={candidateScores.length}
            totalCandidates={totalCandidates || 100}
            analyzedCount={analyzedCount}
            elapsedSeconds={elapsedSeconds}
            isConnected={isConnected}
            isComplete={isComplete}
            activeAIStage={activeAIStage}
            offsetMinutes={offsetMinutes}
          />

          <TechnicalMethodology offsetMinutes={offsetMinutes} />

          <AnimatePresence>
            {(cancelled || metadata?.status === 'failed') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: THEME.surface, borderColor: `${THEME.error}30` }}>
                <div className="p-6 sm:p-8 text-center">
                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-lg font-medium mb-2" style={{ color: THEME.textPrimary }}>
                    {metadata?.status === 'failed' ? 'Analysis Failed' : 'Analysis Stopped'}
                  </h2>
                  <p className="mb-6 text-sm text-black/60">{metadata?.errorMessage || 'The analysis was terminated.'}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={restartAnalysisSession} disabled={isCancelling} className="px-5 py-2.5 rounded-2xl font-medium text-white flex items-center gap-2" style={{ backgroundColor: THEME.success }}>
                      <RefreshCw className={`w-4 h-4 ${isCancelling ? 'animate-spin' : ''}`} /> Restart
                    </button>
                    <Link href="/rectify?new=true" className="px-5 py-2.5 rounded-2xl font-medium border flex items-center gap-2" style={{ borderColor: THEME.border, color: THEME.textPrimary }}>
                      <Home className="w-4 h-4" /> New Analysis
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isComplete && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-[#184131]/10 to-white border-[#184131]/30 shadow-sm shadow-[#184131]/5"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-[#184131]/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-8 h-8 text-[#184131]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-black mb-1">Analysis Successfully Completed</h2>
                    <p className="text-sm text-black/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1.5 font-medium text-[#184131]">
                        <Activity className="w-4 h-4" /> {result.rectifiedTime}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-stone-300" />
                      <span className="flex items-center gap-1.5 font-medium text-black">
                        <Zap className="w-4 h-4" /> {result.confidence} Confidence
                      </span>
                      <span className="w-1 h-1 rounded-full bg-stone-300" />
                      <span className="text-stone-500">
                        Accuracy: {result.accuracy}%
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link
                    href={`/rectify/${sessionId}/results`}
                    className="flex-1 md:flex-none px-6 py-3 bg-black text-white rounded-2xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-sm transition-all shadow-md"
                  >
                    View Official Report <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                    className="flex-1 md:flex-none px-6 py-3 bg-white/90 backdrop-blur-prism-lg border border-stone-200 text-stone-600 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
                  >
                    Quick Review
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!cancelled && (
            <SectionErrorBoundary sectionName="Pipeline" icon={<Activity className="w-5 h-5" />}>
              <SimplifiedPipeline
                currentStage={progress?.stepIndex ?? 0}
                isComplete={isComplete}
                isConnected={isConnected}
                aiModel={metadata?.aiModel}
                activeAIStage={activeAIStage}
                offsetMinutes={offsetMinutes}
                onStageClick={selectAnalysisStage}
              />
            </SectionErrorBoundary>
          )}

          {!cancelled && sortedCandidateScores.length > 0 && (
            <SectionErrorBoundary sectionName="Top Candidates" icon={<Brain className="w-5 h-5" />}>
              <StageLeaderboard
                stage={sortedCandidateScores.reduce((max, s) => Math.max(max, s.stage), 0)}
                scores={sortedCandidateScores}
                isCompleted={isComplete}
                sessionId={sessionId}
              />
            </SectionErrorBoundary>
          )}

          <div className="flex flex-col gap-6 lg:gap-8 w-full">
            <div className="space-y-4 sm:space-y-6">
              {(Object.keys(candidatesByStage).length > 0 || (progress?.stepIndex ?? 0) >= 1) && !cancelled && (
                <SectionErrorBoundary sectionName="AI Reasoning" icon={<Brain className="w-5 h-5" />}>
                  {(() => {
                    // INDUSTRY: Render stages from actual data, not positional index (Vercel Build Log pattern)
                    // Fallback to activeAIStage (emitted directly by ai_thinking payload) if progress lags
                    const currentStageIndex = Math.max(progress?.stepIndex ?? 0, activeAIStage ?? 0);

                    // Get all stage numbers that have data or are targets for high-fidelity rendering
                    // Standard: We now show ALL stages [1, 2, 3, 4, 5, 6] if they are active or have past data
                    const incomingStageNumbers = Object.keys(candidatesByStage).map(Number).filter(n => n > 0);
                    const activeStageNumbers = new Set([1, 2, 3, 4, 5, 6].filter(n => n <= currentStageIndex || incomingStageNumbers.includes(n)));

                    const sortedStages = Array.from(activeStageNumbers).sort((a, b) => b - a);

                    return sortedStages.map((stageNum) => {
                      const stageCandidates = candidatesByStage?.[stageNum] || {};
                      const isStageCompleted = stageNum < currentStageIndex;
                      const actualCandidatesOut = stageStats?.find(s => s.stage === stageNum)?.candidateCount || 0;
                      const candidateCount = Object.keys(stageCandidates).length || actualCandidatesOut;
                      const isCurrentStage = stageNum === currentStageIndex || (!isStageCompleted && incomingStageNumbers.includes(stageNum));

                      // Fallback stage name if not found in allSteps
                      const stepDef = (typeof allSteps !== 'undefined' && allSteps?.[stageNum]) ? allSteps[stageNum] : { id: `stage-${stageNum}`, name: `Stage ${stageNum}` };

                      // Standard Filtering: Distinguish between AI Reasoning and Structural Calculus
                      // Standard: All stages from Batch Tournament onwards are AI-driven
                      const isAIStage = [2, 4, 6].includes(stageNum);

                      // Skip rendering future stages that haven't started and have no data
                      if (candidateCount === 0 && !isCurrentStage && !isStageCompleted) return null;

                      return (
                        <div
                          key={stepDef.id}
                          id={`stage-${stageNum}`}
                          className={`mb-12 last:mb-0 border-l-2 pl-4 sm:pl-6 py-2 transition-colors duration-500 relative
                            ${isCurrentStage ? 'border-amber-200 bg-amber-50/5' : 'border-stone-100'}
                          `}
                          style={{ contain: 'paint', minHeight: '150px' }}
                        >
                          <div className="flex items-center gap-2 mb-4 -ml-7 sm:-ml-9">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-all duration-500
                              ${isCurrentStage
                                ? 'bg-amber-500 border-amber-200 text-white shadow-sm ring-4 ring-amber-500/10'
                                : isStageCompleted
                                  ? 'bg-[#184131] border-[#184131]/20 text-white'
                                  : 'bg-white/90 backdrop-blur-prism-lg border-stone-200 text-stone-400'
                              }`}>
                              {stageNum}
                            </div>
                            <h3 className={`text-xs font-medium uppercase tracking-widest ${isCurrentStage ? 'text-amber-700' : 'text-stone-500'}`}>
                              {stepDef.name}
                            </h3>
                          </div>

                          {isAIStage ? (
                            <UnifiedAIPanel
                              thinking={isCurrentStage && !isStageCompleted && stageCandidates
                                ? (() => {
                                  const entries = Object.values(stageCandidates) as AIThinking[];
                                  if (entries.length === 0) return null;
                                  return entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
                                })()
                                : null}
                              stageHistory={stageHistory}
                              isActive={isCurrentStage && !isStageCompleted}
                              isCompleted={isStageCompleted}
                              stage={stageNum}
                              allCandidates={stageCandidates}
                              displayedCandidate={displayedCandidate}
                              onSelectCandidate={setDisplayedCandidate}
                              candidateScores={candidateScores}
                              title={stepDef.name}
                              offsetMinutes={offsetMinutes}
                            />
                          ) : (
                            <div className="bg-white/90 backdrop-blur-prism-lg rounded-2xl border border-stone-100 p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isCurrentStage ? 'bg-blue-500 animate-pulse' : 'bg-stone-300'}`} />
                                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                                    {isCurrentStage ? 'Computing Mathematical Grids...' : 'Computation Complete'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-stone-400">
                                  {candidateCount} variations generated
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </SectionErrorBoundary>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6 w-full">
              {advancedSignals && (
                <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
                  <AdvancedSignalsDashboard signals={advancedSignals} isComplete={isComplete} />
                </SectionErrorBoundary>
              )}
            </div>
          </div>

        </div>
      </main>
      {/* 🔧 Dev-only: SSE Debug Panel */}
      <SSEDebugPanel />
    </AnalysisErrorBoundary>
    </TestModeProvider>
  );
}
