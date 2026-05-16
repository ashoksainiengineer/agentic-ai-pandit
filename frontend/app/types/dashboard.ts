/**
 * Dashboard Component Types
 * Production-grade type definitions for dashboard components
 */

// Core dashboard metrics
export interface DashboardMetrics {
  totalReadings: number;
  activeReadings: number;
  completedReadings: number;
  successRate: number;
  averageProcessingTime: number; // in minutes
  totalUsers: number;
  activeUsers: number;
  readingsToday: number;
  readingsThisWeek: number;
  readingsThisMonth: number;
}

// Reading/Birth Time Rectification Session
export interface Reading {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  confidence?: number;
  rectifiedTime?: string;
  processingDuration?: number; // in seconds
}

// Time series data for charts
export interface TimeSeriesData {
  date: string;
  readings: number;
  users: number;
  avgConfidence: number;
}

export interface ConfidenceDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Component prop types
export interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  loading?: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

// Filter and pagination types
export interface FilterOptions {
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  confidence?: {
    min: number;
    max: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Date range presets
export type DateRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  start?: string;
  end?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
