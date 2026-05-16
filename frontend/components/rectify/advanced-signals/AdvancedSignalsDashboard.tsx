
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import { Gem } from 'lucide-react';

import dynamic from 'next/dynamic';

// 1. Dynamic imports for heavy charting components to optimize initial bundle size
const AshtakavargaChart = dynamic(() => import('./signal-cards/AshtakavargaChart'), {
  loading: () => <div className="h-[300px] animate-pulse bg-stone-100 rounded-xl border border-stone-200" />,
  ssr: false
});

const ParivartanaYogaCard = dynamic(() => import('./signal-cards/ParivartanaYogaCard'), {
  loading: () => <div className="h-[200px] animate-pulse bg-stone-100 rounded-xl border border-stone-200" />,
  ssr: false
});

const YoginiDashaTimeline = dynamic(() => import('./signal-cards/YoginiDashaTimeline'), {
  loading: () => <div className="h-[400px] animate-pulse bg-stone-100 rounded-xl border border-stone-200" />,
  ssr: false
});

import { IAdvancedSignals } from './types';

// Main Dashboard Component
// ============================================================================

interface AdvancedSignalsDashboardProps {
  signals: IAdvancedSignals | null;
  isComplete: boolean;
}

const AdvancedSignalsDashboard: React.FC<AdvancedSignalsDashboardProps> = ({
  signals,
  isComplete,
}) => {
  const hasSignals = signals && Object.values(signals).some(value => value !== undefined && (!Array.isArray(value) || value.length > 0));

  if (!hasSignals) {
    return isComplete ? null : <LoadingSkeleton />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Orchestrate the staggered animation of each SignalCard
      },
    },
  };

  return (
    <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
      <div className="mb-fib-4">
        <h2 className="text-xl font-light text-black/60">
          Astrological Deep Analysis
        </h2>
        <p className="text-sm text-black/60">These signals provide objective, astrological proof for the birth time analysis.</p>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-fib-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 2. Implement the Strategy Pattern: Render cards only if data exists */}

        {signals.ashtakavargaScores && (
          <AshtakavargaChart scores={signals.ashtakavargaScores} />
        )}

        {signals.parivartanaYogas && signals.parivartanaYogas.length > 0 && (
          <ParivartanaYogaCard yogas={signals.parivartanaYogas} />
        )}

        {signals.yoginiDasha && (
          <YoginiDashaTimeline dashaPeriods={signals.yoginiDasha} />
        )}

      </motion.div>
    </SectionErrorBoundary>
  );
};


// Loading Skeleton Component
// ============================================================================

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="p-fib-4 bg-white rounded-lg border border-black/8">
      <div className="flex items-center gap-fib-4">
        <Gem className="w-6 h-6 text-black/40 animate-pulse" />
        <div>
          <h3 className="text-base font-medium text-black/60">Analyzing Advanced Signals...</h3>
          <p className="text-sm text-black/40">Extracting deep astrological patterns from the planetary data.</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSignalsDashboard;

