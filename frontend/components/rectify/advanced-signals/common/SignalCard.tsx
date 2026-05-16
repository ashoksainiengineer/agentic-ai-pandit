
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

// ============================================================================
// Interface for SignalCard Props
// ============================================================================

interface SignalCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string; // Optional className for custom styling
  infoTooltip?: string; // Optional tooltip text for the info icon
}

// ============================================================================
// Reusable SignalCard Component
// ============================================================================

const SignalCard: React.FC<SignalCardProps> = ({ title, icon, children, className, infoTooltip }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } // A more sophisticated ease
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className={`bg-white border border-black/8 rounded-fib-4 overflow-hidden shadow-phi-subtle ${className || ''}`}
      role="region"
      aria-labelledby={`signal-card-title-${title.replace(/\s+/g, '-')}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-fib-4 border-b border-black/8 bg-bg-elevated">
        <div className="flex items-center gap-fib-3">
          <div className="text-accent-primary">{icon}</div>
          <h3 id={`signal-card-title-${title.replace(/\s+/g, '-')}`} className="text-h6 font-sans font-medium text-text-primary">
            {title}
          </h3>
        </div>
        {infoTooltip && (
          <div className="relative group">
            <Info className="w-fib-2 h-fib-2 text-black/60 cursor-help" />
            <div 
              className="absolute bottom-full right-0 mb-fib-2 w-64 p-fib-3 bg-bg-input text-text-secondary text-phi-xs rounded-fib-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-phi-fast pointer-events-none"
              role="tooltip"
            >
              {infoTooltip}
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-fib-4">
        {children}
      </div>
    </motion.div>
  );
};

export default SignalCard;
