/**
 * ChartCard Component
 * Wrapper for charts with title, subtitle, and loading state
 */

'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import type { ChartCardProps } from '@/app/types/dashboard';

export default function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  loading = false,
}: ChartCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 ${className}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="w-32 h-6 rounded bg-[#ffffff] animate-pulse" />
            <div className="w-48 h-4 rounded bg-[#ffffff] animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#ffffff] animate-pulse" />
        </div>
        <div className="h-64 rounded-xl bg-[#ffffff] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-black ">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[#636363] mt-1">{subtitle}</p>
          )}
        </div>
        <button className="p-2 rounded-lg hover:bg-[#ffffff] text-[#636363] hover:text-black transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  );
}
