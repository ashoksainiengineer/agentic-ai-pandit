
'use client';

import React from 'react';
import SignalCard from '../common/SignalCard';
import { IParivartanaYoga, TPlanet } from '../types';
import { Repeat } from 'lucide-react';

// A mapping for simple planet icons (could be replaced with actual image icons)
const planetIcons: Record<TPlanet, string> = {
  Sun: '☀️',
  Moon: '🌙',
  Mars: '♂️',
  Mercury: '☿️',
  Jupiter: '♃',
  Venus: '♀️',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
  Ascendant: '📍'
};


// ============================================================================
// Interface for ParivartanaYogaCard Props
// ============================================================================

interface ParivartanaYogaCardProps {
  yogas: IParivartanaYoga[];
}

// ============================================================================
// Main ParivartanaYogaCard Component
// ============================================================================

const ParivartanaYogaCard: React.FC<ParivartanaYogaCardProps> = ({ yogas }) => {
  if (!yogas || yogas.length === 0) {
    return null; // Don't render the card if there are no yogas
  }

  return (
    <SignalCard
      title="Planetary Exchange"
      icon={<Repeat className="w-5 h-5" />}
      infoTooltip="A Parivartana Yoga, or exchange of signs, creates a powerful and inseparable link between two planets, amplifying their effects."
    >
      <div className="flex flex-col gap-fib-4">
        {yogas.map((yoga, index) => (
          <div key={`${yoga.planets[0]}-${yoga.planets[1]}-${yoga.yogaType || index}`} className="text-center">

            {/* Yoga Type Badge */}
            <div className="mb-fib-3">
              <span className="px-fib-2 py-fib-1 text-phi-xs font-medium text-accent-primary bg-bg-elevated rounded-full border border-border-accent">
                {yoga.yogaType}
              </span>
            </div>

            {/* Visual Diagram of the Exchange */}
            <div className="flex items-center justify-center gap-fib-3">

              {/* Planet 1 */}
              <div className="flex flex-col items-center p-fib-2 bg-bg-elevated rounded-fib-3 border border-black/8">
                <span className="text-2xl">{planetIcons[yoga.planets[0]]}</span>
                <span className="text-phi-xs text-text-primary font-medium">{yoga.planets[0]}</span>
                <span className="text-phi-xs text-black/60">in {yoga.signs[1].slice(0, 4)}</span>
              </div>

              {/* Exchange Icon */}
              <div className="text-black/60">
                <Repeat className="w-6 h-6" />
              </div>

              {/* Planet 2 */}
              <div className="flex flex-col items-center p-fib-2 bg-bg-elevated rounded-fib-3 border border-black/8">
                <span className="text-2xl">{planetIcons[yoga.planets[1]]}</span>
                <span className="text-phi-xs text-text-primary font-medium">{yoga.planets[1]}</span>
                <span className="text-phi-xs text-black/60">in {yoga.signs[0].slice(0, 4)}</span>
              </div>

            </div>

          </div>
        ))}
      </div>
    </SignalCard>
  );
};

export default ParivartanaYogaCard;
