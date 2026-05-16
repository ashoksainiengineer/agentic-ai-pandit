'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Star,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  CopyPlus,
} from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { statusConfig, confidenceConfig } from './session-card-shared';

interface SessionCardListProps {
  session: DashboardSession;
  isSelected?: boolean;
  isFavorite?: boolean;
  formattedDate: string;
  sessionUrl: string;
  onSelect?: (id: string) => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onCloneClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  isCloning: boolean;
}

export const SessionCardList = memo(function SessionCardList({
  session,
  isSelected,
  isFavorite,
  formattedDate,
  sessionUrl,
  onSelect,
  onFavoriteClick,
  onCloneClick,
  onDeleteClick,
  isCloning,
}: SessionCardListProps) {
  const status = statusConfig[session.status] || statusConfig.draft;
  const confidence = session.confidence ? confidenceConfig[session.confidence] : null;
  const isLive = ['processing', 'pending', 'queued', 'retrying'].includes(session.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border
        ${isSelected ? 'bg-primary/5 border-primary' : 'bg-white border-surface-muted'}
        hover:border-primary-dark/50 transition-all
      `}
    >
      {/* Mobile Header Row */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Selection */}
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(session.id)}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-primary-dark/30 text-primary focus:ring-primary"
          />
        )}

        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.bgColor.replace('/10', '')}`} />

        {/* Name & Status - Mobile Only */}
        <div className="flex-1 min-w-0 sm:hidden">
          <h3 className="font-medium text-content-primary truncate text-sm">{session.fullName}</h3>
          <span className={`
            inline-flex items-center gap-1 text-[10px] font-medium
            ${status.textColor}
          `}>
            {status.icon}
            {session.status}
            {isLive && (
              <span className="flex h-1 w-1 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1 w-1 bg-current"></span>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Link
        href={sessionUrl}
        className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start sm:items-center"
      >
        {/* Name & Status - Desktop Only */}
        <div className="hidden sm:block col-span-3 min-w-0">
          <h3 className="font-medium text-content-primary truncate">{session.fullName}</h3>
          <span className={`
            inline-flex items-center gap-1 text-xs font-medium
            ${status.textColor}
          `}>
            {status.icon}
            {session.status}
            {isLive && (
              <span className="flex h-1 w-1 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1 w-1 bg-current"></span>
              </span>
            )}
          </span>
        </div>

        {/* Birth Info */}
        <div className="col-span-12 sm:col-span-2 text-xs sm:text-sm text-content-secondary flex flex-row sm:flex-col gap-2 sm:gap-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {session.dateOfBirth}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-primary font-medium">{session.tentativeTime || 'Not set'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">{session.birthPlace}</span>
          </div>
          {session.offsetConfig && (
            <div className="flex items-center gap-1 text-[10px] text-content-disabled">
              <span className="bg-surface-elevated px-1.5 py-0.5 rounded">
                ±{session.offsetConfig.customMinutes || 60}min
              </span>
            </div>
          )}
        </div>

        {/* Rectified Time */}
        <div className="col-span-12 sm:col-span-2">
          {session.rectifiedTime ? (
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono font-medium text-sm">{session.rectifiedTime}</span>
              {confidence && (
                <span className="text-xs" style={{ color: confidence.color }}>
                  {confidence.label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-content-secondary">Pending</span>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="col-span-12 sm:col-span-2">
          {session.accuracy ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-trust"
                  style={{ width: `${session.accuracy}%` }}
                />
              </div>
              <span className="text-xs text-content-secondary">{session.accuracy}%</span>
            </div>
          ) : (
            <span className="text-xs text-content-secondary">No accuracy</span>
          )}
        </div>

        {/* Date */}
        <div className="col-span-12 sm:col-span-2 text-xs text-content-secondary sm:text-right">
          <div className="text-[10px] uppercase tracking-wider text-content-disabled mb-0.5">Last Updated</div>
          <div>{formattedDate}</div>
          <div className="text-[10px] text-primary mt-0.5">
            <ClientOnly>
              {new Date(session.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </ClientOnly>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <button
          onClick={onFavoriteClick}
          className={`
            p-1.5 sm:p-2 rounded-lg transition-colors
            ${isFavorite
              ? 'text-primary'
              : 'text-content-disabled hover:text-primary'
            }
          `}
        >
          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <Link
          href={sessionUrl}
          className="p-1.5 sm:p-2 text-content-disabled hover:text-primary rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>

        <button
          onClick={onCloneClick}
          disabled={isCloning}
          className="p-1.5 sm:p-2 text-content-disabled hover:text-primary disabled:opacity-50 rounded-lg transition-colors"
          title="Duplicate session"
        >
          {isCloning ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <CopyPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <button
          onClick={onDeleteClick}
          className="p-1.5 sm:p-2 text-content-disabled hover:text-destructive rounded-lg transition-colors"
          title="Delete session"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
});
