
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SignalCard from '../common/SignalCard';
import { TPlanet, IAshtakavargaScores } from '../types';
import { SlidersHorizontal } from 'lucide-react';

// ============================================================================
// Interface for AshtakavargaChart Props
// ============================================================================

interface AshtakavargaChartProps {
  scores: IAshtakavargaScores;
}

// ============================================================================
// Helper function to get color based on score
// ============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 6) return '#000000'; // accent-gold
  if (score === 5) return '#C9A961'; // accent-gold-muted
  if (score === 4) return '#8C7F72'; // text-muted
  if (score >= 2) return '#5A6475'; // text-disabled
  return '#2A3442'; // border-default
};

// ============================================================================
// Main AshtakavargaChart Component
// ============================================================================

const AshtakavargaChart: React.FC<AshtakavargaChartProps> = ({ scores }) => {

  // Order of planets for display
  const planetOrder: TPlanet[] = ['Ascendant', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const houseLabels = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Stagger the animation of each cell
      },
    },
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <SignalCard
      title="Ashtakavarga Scores"
      icon={<SlidersHorizontal className="w-5 h-5" />}
      infoTooltip="This table shows the benefic points for each planet in each house. Higher scores (4+) indicate strength and support for the planet in that house."
      className="col-span-full lg:col-span-2" // Take more space as it's a detailed chart
    >
      <div className="overflow-x-auto">
        <motion.div
          className="grid grid-cols-13 gap-1 font-mono text-phi-xs"
          style={{ gridTemplateColumns: '50px repeat(12, 1fr)' }} // Fixed width for planet labels
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Row */}
          <div className="font-medium text-black/60"></div>
          {houseLabels.map(label => (
            <div key={`header-${label}`} className="text-center font-medium text-black/60">{label}</div>
          ))}

          {/* Planet Rows */}
          {planetOrder.map(planet => (
            <React.Fragment key={planet}>
              <div className="font-medium text-text-secondary pr-2 text-right self-center">{planet.slice(0, 3)}</div>
              {scores[planet]?.map((score, houseIndex) => (
                <motion.div
                  key={`${planet}-${houseIndex}`}
                  variants={cellVariants}
                  className="w-full h-8 flex items-center justify-center rounded-fib-1"
                  style={{ backgroundColor: getScoreColor(score) }}
                  title={`Score: ${score}`}
                >
                  <span className="font-medium text-white mix-blend-overlay">{score}</span>
                </motion.div>
              )) || Array(12).fill(null).map((_, i) => <div key={`empty-${planet}-${i}`} className="w-full h-8 rounded-fib-1 bg-bg-input"></div>)
              }
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </SignalCard>
  );
};

export default AshtakavargaChart;
