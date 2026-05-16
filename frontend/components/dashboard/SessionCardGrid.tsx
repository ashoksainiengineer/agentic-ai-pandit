'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Calendar, MapPin } from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';
import { statusConfig, confidenceConfig } from './session-card-shared';

interface SessionCardGridProps {
  session: DashboardSession;
  isSelected?: boolean;
  isFavorite?: boolean;
  formattedDate: string;
  sessionUrl: string;
  onSelect?: (id: string) => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
}

export const SessionCardGrid = memo(function SessionCardGrid({
  session,
  isSelected,
  isFavorite,
  formattedDate,
  sessionUrl,
  onSelect,
  onFavoriteClick,
}: SessionCardGridProps) {
  const status = statusConfig[session.status] || statusConfig.draft;
  const confidence = session.confidence ? confidenceConfig[session.confidence] : null;
  const isLive = ['processing', 'pending', 'queued', 'retrying'].includes(session.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`
        relative group rounded-2xl border p-5 bg-white
        ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-surface-muted'}
        hover:border-primary-dark/50 hover:shadow-primary-dark/5
        transition-all duration-300
      `}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-4 left-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(session.id)}
            className="w-5 h-5 rounded border-primary-dark/30 text-primary focus:ring-primary"
          />
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={onFavoriteClick}
        className={`
          absolute top-4 right-4 p-2 rounded-xl transition-all duration-200
          ${isFavorite
            ? 'text-primary bg-primary/10'
            : 'text-content-disabled hover:text-primary hover:bg-primary/5'
          }
        `}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Content */}
      <Link href={sessionUrl}>
        <div className="pt-8">
          {/* Status Badge */}
          <div className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            ${status.bgColor} ${status.textColor} border ${status.borderColor}
            ${session.status === 'processing' ? 'animate-pulse' : ''}
          `}>
            {status.icon}
            {status.label}
            {isLive && (
              <span className="flex h-1.5 w-1.5 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="mt-4 text-lg font-medium text-content-primary truncate">
            {session.fullName}
          </h3>

          {/* Details */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <Calendar className="w-4 h-4" />
              {session.dateOfBirth}
            </div>
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{session.birthPlace}</span>
            </div>
          </div>

          {/* Rectified Time */}
          {session.rectifiedTime && (
            <div className="mt-4 p-3 bg-surface-raised rounded-xl border border-primary-dark/20">
              <span className="text-xs text-content-secondary uppercase tracking-wider">Rectified Time</span>
              <p className="text-primary font-mono font-medium">{session.rectifiedTime}</p>
            </div>
          )}

          {/* Confidence & Accuracy */}
          {confidence && session.accuracy && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-content-secondary">Confidence:</span>
                <span className="text-xs font-medium" style={{ color: confidence.color }}>
                  {confidence.label}
                </span>
              </div>
              <div className="w-16 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${session.accuracy}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: confidence.color }}
                />
              </div>
            </div>
          )}

          {/* Date */}
          <div className="mt-4 pt-4 border-t border-surface-muted text-xs text-content-disabled">
            Updated {formattedDate}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
