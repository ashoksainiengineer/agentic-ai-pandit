
'use client';

import React, { useState } from 'react';
import SignalCard from '../common/SignalCard';
import { IYoginiDasha, IYoginiDashaPeriods } from '../types';
import { CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mapping of Dasha names to their general nature for user-friendly descriptions
const dashaNatures: Record<string, { nature: string; description: string }> = {
  Mangala: { nature: 'Auspicious', description: 'Growth, expansion, and good fortune.' },
  Pingala: { nature: 'Mixed', description: 'Effort, activity, and some challenges.' },
  Dhanya: { nature: 'Auspicious', description: 'Prosperity, wealth, and success.' },
  Bhramari: { nature: 'Challenging', description: 'Travel, instability, and confusion.' },
  Bhadrika: { nature: 'Auspicious', description: 'Good results, learning, and family life.' },
  Ulka: { nature: 'Challenging', description: 'Obstacles, disputes, and sudden events.' },
  Siddha: { nature: 'Auspicious', description: 'Accomplishment, skill, and success.' },
  Sankata: { nature: 'Challenging', description: 'Difficulties, crisis, and transformation.' },
};


// ============================================================================
// Interface for YoginiDashaTimeline Props
// ============================================================================

interface YoginiDashaTimelineProps {
  dashaPeriods: IYoginiDashaPeriods;
}

// ============================================================================
// Main YoginiDashaTimeline Component
// ============================================================================

const YoginiDashaTimeline: React.FC<YoginiDashaTimelineProps> = ({ dashaPeriods }) => {
  const [hoveredDasha, setHoveredDasha] = useState<IYoginiDasha | null>(null);
  const { eventDasha, currentDasha } = dashaPeriods;

  // For simplicity, we'll create a mock sequence of 3 dashas for the timeline
  // A real implementation would need a more robust way to get the sequence around the event
  const dashaSequence = [eventDasha, currentDasha]; // Simplified

  const getYearFromDate = (dateString: string) => new Date(dateString).getFullYear();

  return (
    <SignalCard
      title="Yogini Dasha Timeline"
      icon={<CalendarClock className="w-5 h-5" />}
      infoTooltip="This timeline shows the planetary periods (Dashas) active during key moments. Matching the Dasha's nature to the life event helps validate the birth time."
    >
      <div className="w-full">
        {/* Highlighted Event Dasha Info */}
        <div className="bg-bg-elevated p-fib-3 rounded-fib-3 mb-fib-4 text-center border border-border-accent shadow-inner">
          <p className="text-phi-sm text-text-secondary">
            During your key life event, the active period was <span className="font-medium text-accent-primary">{eventDasha.dashaName}</span>.
          </p>
          <p className="text-phi-xs text-black/60">
            This is a <span className="font-medium">{dashaNatures[eventDasha.dashaName]?.nature}</span> period, typically associated with {dashaNatures[eventDasha.dashaName]?.description}
          </p>
        </div>

        {/* SVG Timeline */}
        <div className="relative w-full h-24 font-sans">
          <svg width="100%" height="100%" viewBox="0 0 300 100">
            {/* Timeline Axis */}
            <line x1="10" y1="50" x2="290" y2="50" stroke="#2A3442" strokeWidth="2" />

            {dashaSequence.map((dasha, index) => {
              const isEvent = dasha.dashaName === eventDasha.dashaName;
              const cx = 100 + (index * 100);

              return (
                <g key={dasha.dashaName || `dasha-${index}`} onMouseEnter={() => setHoveredDasha(dasha)} onMouseLeave={() => setHoveredDasha(null)}>
                  {/* Pulsating glow for the event dasha */}
                  {isEvent && (
                    <motion.circle
                      cx={cx}
                      cy={50}
                      r="10"
                      fill="#8B5CF6"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <circle cx={cx} cy={50} r="6" fill={isEvent ? "#8B5CF6" : "#5A6475"} stroke="#0A0F1C" strokeWidth="2" />
                  <text x={cx} y={80} textAnchor="middle" fill="#C4B8AD" fontSize="10">{dasha.dashaName}</text>
                  <text x={cx} y={95} textAnchor="middle" fill="#8C7F72" fontSize="9">{getYearFromDate(dasha.startDate)}</text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredDasha && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 p-2 bg-bg-input text-white text-xs rounded-md shadow-lg pointer-events-none"
              >
                <strong>{hoveredDasha.dashaName}</strong> ({hoveredDasha.rulingPlanet})<br />
                {getYearFromDate(hoveredDasha.startDate)} - {getYearFromDate(hoveredDasha.endDate)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </SignalCard>
  );
};

export default YoginiDashaTimeline;

