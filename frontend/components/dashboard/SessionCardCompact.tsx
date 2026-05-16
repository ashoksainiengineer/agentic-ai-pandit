'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardSession } from '@/lib/dashboard/types';
import { statusConfig } from './session-card-shared';

interface SessionCardCompactProps {
  session: DashboardSession;
  isSelected?: boolean;
  formattedDate: string;
  onSelect?: (id: string) => void;
}

export const SessionCardCompact = memo(function SessionCardCompact({
  session,
  isSelected,
  formattedDate,
  onSelect,
}: SessionCardCompactProps) {
  const status = statusConfig[session.status] || statusConfig.draft;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        flex items-center gap-3 p-3 rounded-xl border cursor-pointer
        ${isSelected
          ? 'bg-primary/5 border-primary'
          : 'bg-white border-surface-muted hover:border-primary-dark/50'
        }
        transition-all
      `}
      onClick={() => onSelect?.(session.id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => { }}
        className="w-4 h-4 rounded border-primary-dark/30 text-primary focus:ring-primary"
      />
      <div className={`w-2 h-2 rounded-full ${status.bgColor.replace('/10', '')}`} />
      <span className="flex-1 truncate text-sm text-content-primary">{session.fullName}</span>
      <span className="text-xs text-content-secondary">{formattedDate}</span>
    </motion.div>
  );
});
