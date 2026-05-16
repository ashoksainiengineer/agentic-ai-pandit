'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { env } from '@/lib/config/env';
import nextDynamic from 'next/dynamic';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import StatsCard from '@/app/components/dashboard/StatsCard';
import ChartCard from '@/app/components/dashboard/ChartCard';
import RecentReadingsTable from '@/app/components/dashboard/RecentReadingsTable';
import '@/app/globals.css';

const ReadingsChart = nextDynamic(() => import('@/app/components/dashboard/charts/ReadingsChart'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-black/5 animate-pulse" />
});
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';
import type {
  DashboardMetrics,
  Reading,
  TimeSeriesData,
} from '@/app/types/dashboard';

// API client
const API_BASE_URL = env.app.baseUrl;

async function fetchDashboardMetrics(token: string): Promise<DashboardMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/metrics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch metrics');
    return data.data;
  } catch (err) {
    throw new Error(`Failed to fetch metrics: ${err instanceof Error ? err.message : err}`);
  }
}

async function fetchRecentReadings(token: string): Promise<Reading[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/readings?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch readings');
    return data.data;
  } catch (err) {
    throw new Error(`Failed to fetch readings: ${err instanceof Error ? err.message : err}`);
  }
}

async function fetchTimeSeriesData(token: string): Promise<TimeSeriesData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/analytics/timeseries?days=30`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch analytics');
    return data.data;
  } catch (err) {
    throw new Error(`Failed to fetch time series: ${err instanceof Error ? err.message : err}`);
  }
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('Authentication required');
        const [metricsData, readingsData, timeSeries] = await Promise.all([
          fetchDashboardMetrics(token),
          fetchRecentReadings(token),
          fetchTimeSeriesData(token),
        ]);
        setMetrics(metricsData);
        setReadings(readingsData);
        setTimeSeriesData(timeSeries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [getToken]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">Failed to load dashboard</h3>
            <p className="text-black/60">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-black font-sans">
          Dashboard Overview
        </h1>
        <p className="text-black/60 mt-1">
          Monitor your birth time rectification platform performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Readings"
          value={metrics?.totalReadings || 0}
          change={12.5}
          changeLabel="vs last month"
          icon={<Activity className="w-6 h-6" />}
          trend="up"
          loading={loading}
        />
        <StatsCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          change={8.2}
          changeLabel="vs last month"
          icon={<Users className="w-6 h-6" />}
          trend="up"
          loading={loading}
        />
        <StatsCard
          title="Success Rate"
          value={`${metrics?.successRate || 0}%`}
          change={2.1}
          changeLabel="vs last month"
          icon={<CheckCircle2 className="w-6 h-6" />}
          trend="up"
          loading={loading}
        />
        <StatsCard
          title="Avg. Processing Time"
          value={`${metrics?.averageProcessingTime || 0}m`}
          change={-5.3}
          changeLabel="vs last month"
          icon={<Timer className="w-6 h-6" />}
          trend="up"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard
          title="Readings Over Time"
          subtitle="Daily readings for the past 30 days"
          className="lg:col-span-2"
          loading={loading}
        >
          <ReadingsChart data={timeSeriesData} loading={loading} />
        </ChartCard>

        <ChartCard title="Quick Stats" loading={loading}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Today&apos;s Readings</p>
                  <p className="text-xl font-medium text-black">
                    {metrics?.readingsToday || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Processing</p>
                  <p className="text-xl font-medium text-black">
                    {metrics?.activeReadings || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">This Week</p>
                  <p className="text-xl font-medium text-black">
                    {metrics?.readingsThisWeek || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Readings */}
      <RecentReadingsTable readings={readings} loading={loading} />
    </DashboardLayout>
  );
}
