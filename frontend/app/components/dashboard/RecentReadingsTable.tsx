/**
 * RecentReadingsTable Component
 * Displays recent birth time rectification readings with status
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import type { Reading } from '@/app/types/dashboard';

interface RecentReadingsTableProps {
  readings: Reading[];
  loading?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  queued: {
    label: 'Queued',
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  retrying: {
    label: 'Retrying',
    icon: Loader2,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
};

function formatReadingDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function RecentReadingsTable({ readings, loading }: RecentReadingsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
          <div className="w-48 h-6 rounded bg-[#ffffff] animate-pulse" />
        </div>
        <div className="divide-y divide-[rgba(0,0,0,0.08)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#ffffff] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 rounded bg-[#ffffff] animate-pulse" />
                <div className="w-48 h-3 rounded bg-[#ffffff] animate-pulse" />
              </div>
              <div className="w-24 h-8 rounded-full bg-[#ffffff] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ffffff] flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-[#959595]" />
        </div>
        <h3 className="text-lg font-medium text-black mb-2">No readings yet</h3>
        <p className="text-[#636363]">Readings will appear here once users start using the service.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] overflow-hidden"
    >
      <div className="p-6 border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between">
        <h3 className="text-lg font-medium text-black ">
          Recent Readings
        </h3>
        <Link
          href="/admin/readings"
          className="text-sm text-black hover:text-black font-medium flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-[rgba(0,0,0,0.08)]">
        {readings.map((reading, index) => {
          const status = statusConfig[reading.status];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={reading.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="p-4 hover:bg-[#ffffff] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#000000]/10 to-[#000000]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="font-medium text-black">{reading.userName}</p>
                    <div className="flex items-center gap-3 text-sm text-[#636363]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatReadingDate(reading.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {reading.birthPlace}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {reading.confidence && (
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-black">
                        {(reading.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-[#636363]">Confidence</p>
                    </div>
                  )}

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status.color}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${reading.status === 'processing' ? 'animate-spin' : ''}`} />
                    {status.label}
                  </div>

                  <Link
                    href={`/admin/readings/${reading.id}`}
                    className="p-2 rounded-lg hover:bg-[rgba(0,0,0,0.08)]/50 text-[#636363] hover:text-black transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
