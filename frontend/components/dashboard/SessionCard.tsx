/**
 * SessionCard Component
 * Displays a single session with rich information and actions
 * Sacred Ivory Light Theme
 */

'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Star,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CopyPlus,
} from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';
import dynamic from 'next/dynamic';

const DeleteConfirmModal = dynamic(() => import('./DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })), { ssr: false });
const LoadingOverlay = dynamic(() => import('@/components/ui/LoadingOverlay').then(m => ({ default: m.LoadingOverlay })), { ssr: false });
import { ClientOnly } from '@/components/ui/ClientOnly';
import { logger } from '@/lib/secure-logger';

interface SessionCardProps {
  session: DashboardSession;
  isSelected?: boolean;
  isFavorite?: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  onSelect?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const statusConfig = {
  complete: {
    label: '✓ Verified',
    bgColor: 'bg-[#184131]/10',
    textColor: 'text-[#184131]',
    borderColor: 'border-[#184131]/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'Analyzing',
    bgColor: 'bg-[#000000]/10',
    textColor: 'text-black',
    borderColor: 'border-[#000000]/30',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  pending: {
    label: 'Queued',
    bgColor: 'bg-[#3B82F6]/10',
    textColor: 'text-[#3B82F6]',
    borderColor: 'border-[#3B82F6]/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  queued: {
    label: 'Queued',
    bgColor: 'bg-[#3B82F6]/10',
    textColor: 'text-[#3B82F6]',
    borderColor: 'border-[#3B82F6]/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  retrying: {
    label: 'Retrying',
    bgColor: 'bg-[#8B4A9C]/10',
    textColor: 'text-[#8B4A9C]',
    borderColor: 'border-[#8B4A9C]/30',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  draft: {
    label: 'Draft',
    bgColor: 'bg-[#3B82F6]/10',
    textColor: 'text-[#3B82F6]',
    borderColor: 'border-[#3B82F6]/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-[#C65D3B]/10',
    textColor: 'text-[#C65D3B]',
    borderColor: 'border-[#C65D3B]/30',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

const confidenceConfig = {
  'god-tier': { color: '#000000', label: 'GOD-TIER' },
  'high': { color: '#184131', label: 'HIGH' },
  'medium': { color: '#000000', label: 'MEDIUM' },
  'low': { color: '#C65D3B', label: 'LOW' },
};

export const SessionCard = memo(function SessionCard({
  session,
  isSelected,
  isFavorite,
  viewMode,
  onSelect,
  onFavorite,
  onDelete,
  onDuplicate,
}: SessionCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [cloneError, setCloneError] = useState<string | null>(null);
  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.draft;
  const confidence = session.confidence ? confidenceConfig[session.confidence as keyof typeof confidenceConfig] : null;

  const isLive = ['processing', 'pending', 'queued', 'retrying'].includes(session.status);

  const sessionUrl = useMemo(() => {
    if (session.status === 'complete') return `/rectify/${session.id}/results`;
    if (isLive) return `/rectify/${session.id}`;
    return `/rectify/${session.id}/edit`;
  }, [session.status, session.id, isLive]);

  const formattedDate = useMemo(() => new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }), [session.createdAt]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(session.id);
  }, [onFavorite, session.id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onDelete?.(session.id);
        setShowDeleteConfirm(false);
      } else {
        setDeleteError(data.error || data.details || 'Failed to delete session');
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? (error as Error).message : 'Network error');
    } finally {
      setIsDeleting(false);
    }
  }, [getToken, session.id, onDelete]);

  const handleCloneClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCloning(true);

    try {
      const token = await getToken();
      const res = await fetch(`/api/sessions/${session.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();

      if (data.success && data.data?.id) {
        onDuplicate?.(data.data.id);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        let isReady = false;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          let readinessRes: Response | undefined;
          try {
            readinessRes = await fetch(`/api/sessions/${data.data.id}`, {
              headers,
              cache: 'no-store',
            });
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }

            if (readinessRes.ok) {
              const readinessData = await readinessRes.json();
              if (readinessData?.success) {
                isReady = true;
                break;
              }
            }

          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!isReady) {
          // Use inline message instead of alert()
          setCloneError('Session duplicated, but it is still syncing. Please retry in a few seconds.');
          setIsCloning(false);
          return;
        }

        router.push(`/rectify/${data.data.id}/edit`);
      } else {
        logger.error('Failed to clone session', new Error(data.error || 'Failed to clone session'));
        setCloneError('Failed to clone session: ' + (data.error || 'Unknown error'));
        setIsCloning(false);
      }
    } catch (error: unknown) {
      logger.error('Clone error', error);
      setCloneError('Clone failed: ' + (error as Error).message);
      setIsCloning(false);
    }
  }, [getToken, onDuplicate, router, session.id]);

  // Compact View
  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          flex items-center gap-3 p-3 rounded-xl border cursor-pointer
          ${isSelected
            ? 'bg-[#000000]/5 border-[#000000]'
            : 'bg-white border-[rgba(0,0,0,0.08)] hover:border-[#000000]/50'
          }
          transition-all
        `}
        onClick={() => onSelect?.(session.id)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => { }}
          className="w-4 h-4 rounded border-[#000000]/30 text-black focus:ring-[#000000]"
        />
        <div className={`w-2 h-2 rounded-full ${status.bgColor.replace('/10', '')}`} />
        <span className="flex-1 truncate text-sm text-black">{session.fullName}</span>
        <span className="text-xs text-[#636363]">{formattedDate}</span>
      </motion.div>
    );
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={`
          relative group rounded-2xl border p-5 bg-white
          ${isSelected ? 'border-[#000000] ring-1 ring-[#000000]' : 'border-[rgba(0,0,0,0.08)]'}
          hover:border-[#000000]/50 hover:shadow-[#000000]/5
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
              className="w-5 h-5 rounded border-[#000000]/30 text-black focus:ring-[#000000]"
            />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`
            absolute top-4 right-4 p-2 rounded-xl transition-all duration-200
            ${isFavorite
              ? 'text-black bg-[#000000]/10'
              : 'text-[#959595] hover:text-black hover:bg-[#000000]/5'
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
            <h3 className="mt-4 text-lg font-medium text-black truncate">
              {session.fullName}
            </h3>

            {/* Details */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#636363]">
                <Calendar className="w-4 h-4" />
                {session.dateOfBirth}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#636363]">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{session.birthPlace}</span>
              </div>
            </div>

            {/* Rectified Time */}
            {session.rectifiedTime && (
              <div className="mt-4 p-3 bg-[#ffffff] rounded-xl border border-[#000000]/20">
                <span className="text-xs text-[#636363] uppercase tracking-wider">Rectified Time</span>
                <p className="text-black font-mono font-medium">{session.rectifiedTime}</p>
              </div>
            )}

            {/* Confidence & Accuracy */}
            {confidence && session.accuracy && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#636363]">Confidence:</span>
                  <span className="text-xs font-medium" style={{ color: confidence.color }}>
                    {confidence.label}
                  </span>
                </div>
                <div className="w-16 h-1.5 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
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
            <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.08)] text-xs text-[#959595]">
              Updated {formattedDate}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // List View (Default) - Sacred Ivory Light Theme
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border
        ${isSelected ? 'bg-[#000000]/5 border-[#000000]' : 'bg-white border-[rgba(0,0,0,0.08)]'}
        hover:border-[#000000]/50 transition-all
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
            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[#000000]/30 text-black focus:ring-[#000000]"
          />
        )}

        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.bgColor.replace('/10', '')}`} />

        {/* Name & Status - Mobile Only */}
        <div className="flex-1 min-w-0 sm:hidden">
          <h3 className="font-medium text-black truncate text-sm">{session.fullName}</h3>
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
          <h3 className="font-medium text-black truncate">{session.fullName}</h3>
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
        <div className="col-span-12 sm:col-span-2 text-xs sm:text-sm text-[#636363] flex flex-row sm:flex-col gap-2 sm:gap-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {session.dateOfBirth}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-black font-medium">{session.tentativeTime || 'Not set'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">{session.birthPlace}</span>
          </div>
          {/* Offset Config */}
          {session.offsetConfig && (
            <div className="flex items-center gap-1 text-[10px] text-[#959595]">
              <span className="bg-[var(--prism-canvas)] px-1.5 py-0.5 rounded">
                ±{session.offsetConfig.customMinutes || 60}min
              </span>
            </div>
          )}
        </div>

        {/* Rectified Time */}
        <div className="col-span-12 sm:col-span-2">
          {session.rectifiedTime ? (
            <div className="flex items-center gap-2">
              <span className="text-black font-mono font-medium text-sm">{session.rectifiedTime}</span>
              {confidence && (
                <span className="text-xs" style={{ color: confidence.color }}>
                  {confidence.label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-[#636363]">Pending</span>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="col-span-12 sm:col-span-2">
          {session.accuracy != null ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#000000] to-[#184131]"
                  style={{ width: `${session.accuracy}%` }}
                />
              </div>
              <span className="text-xs text-[#636363]">{session.accuracy}%</span>
            </div>
          ) : (
            <span className="text-xs text-[#636363]">No accuracy</span>
          )}
        </div>

        {/* Date */}
        <div className="col-span-12 sm:col-span-2 text-xs text-[#636363] sm:text-right">
          <div className="text-[10px] uppercase tracking-wider text-[#959595] mb-0.5">Last Updated</div>
          <div>{formattedDate}</div>
          <div className="text-[10px] text-black mt-0.5">
            <ClientOnly>
              {new Date(session.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </ClientOnly>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <button
          onClick={handleFavoriteClick}
          className={`
            p-1.5 sm:p-2 rounded-lg transition-colors
            ${isFavorite
              ? 'text-black'
              : 'text-[#959595] hover:text-black'
            }
          `}
        >
          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <Link
          href={sessionUrl}
          className="p-1.5 sm:p-2 text-[#959595] hover:text-black rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>

        {/* Duplicate Button */}
        <button
          onClick={handleCloneClick}
          disabled={isCloning}
          className="p-1.5 sm:p-2 text-[#959595] hover:text-black disabled:opacity-50 rounded-lg transition-colors"
          title="Duplicate session"
        >
          {isCloning ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <CopyPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="p-1.5 sm:p-2 text-[#959595] hover:text-red-500 rounded-lg transition-colors"
          title="Delete session"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Clone Error */}
      {cloneError && (
        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">{cloneError}</p>
          <button
            onClick={() => setCloneError(null)}
            className="text-xs text-amber-500 hover:text-amber-700 mt-1 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Duplication Loading Overlay */}
      <LoadingOverlay
        isVisible={isCloning}
        message="Duplicating your session..."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        session={session}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </motion.div>
  );
});
