/**
 * StatsCard Component
 * Displays key metrics with trend indicators
 */

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MetricCardProps } from '@/app/types/dashboard';

export default function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  trend = 'neutral',
  loading = false,
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50';
      case 'down':
        return 'text-rose-600 bg-rose-50';
      default:
        return 'text-amber-600 bg-amber-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#ffffff] animate-pulse" />
          <div className="w-20 h-8 rounded-full bg-[#ffffff] animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-4 rounded bg-[#ffffff] animate-pulse" />
          <div className="w-32 h-8 rounded bg-[#ffffff] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#000000]/10 to-[#000000]/10 flex items-center justify-center text-black">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-[#636363]">{title}</p>
        <p className="text-2xl font-medium text-black ">
          {formatValue(value)}
        </p>
        {change !== undefined && (
          <p className="text-xs text-[#959595]">{changeLabel}</p>
        )}
      </div>
    </motion.div>
  );
}
