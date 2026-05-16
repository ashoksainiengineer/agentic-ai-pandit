/**
 * Dashboard Type Definitions
 * Production-grade type safety for all dashboard features
 */

import { Session, TimeOffsetConfig } from '@/lib/types';

export type SessionStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'cancelled';
export type SortField = 'createdAt' | 'fullName' | 'status' | 'confidence' | 'accuracy';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list' | 'compact';
export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface DashboardSession extends Session {
  isFavorite?: boolean;
  tags?: string[];
  notes?: string;
  analysisResult?: AnalysisResultSummary;
  offsetConfig?: TimeOffsetConfig;
}


export interface AnalysisResultSummary {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'low' | 'medium' | 'high' | 'god-tier';
  processingTime?: number;
  candidateCount?: number;
}

export interface DashboardStats {
  totalAnalyses: number;
  completedAnalyses: number;
  processingAnalyses: number;
  failedAnalyses: number;
  averageAccuracy: number;
  highConfidenceRate: number;
  totalProcessingTime: number;
  weeklyGrowth: number;
  favoriteCount: number;
}

export interface ActivityData {
  date: string;
  count: number;
  status: SessionStatus;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface FilterState {
  searchQuery: string;
  statusFilter: SessionStatus[];
  confidenceFilter: string[];
  dateRange: { from?: Date; to?: Date };
  hasResults: boolean | null;
  favoritesOnly: boolean;
}

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DashboardPreferences {
  viewMode: ViewMode;
  pageSize: number;
  defaultSort: SortState;
  showAnalytics: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface SessionComparison {
  sessions: DashboardSession[];
  differences: Record<string, { values: unknown[]; isDifferent: boolean }>;
  similarities: string[];
}

export interface InsightItem {
  id: string;
  type: 'trend' | 'pattern' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  includeResults: boolean;
  includeLogs: boolean;
  dateRange?: { from: Date; to: Date };
  sessions?: string[];
}

export interface BatchOperation {
  type: 'delete' | 'export' | 'favorite' | 'tag';
  sessionIds: string[];
  payload?: unknown;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: { label: string; href: string };
}

export interface HeatmapCell {
  date: string;
  intensity: number;
  sessions: number;
  completed: number;
}

export interface DashboardContextValue {
  sessions: DashboardSession[];
  stats: DashboardStats;
  filteredSessions: DashboardSession[];
  filterState: FilterState;
  sortState: SortState;
  pagination: PaginationState;
  preferences: DashboardPreferences;
  selectedSessions: Set<string>;
  comparisonMode: boolean;
  insights: InsightItem[];
  notifications: NotificationItem[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: SortState) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPreferences: (prefs: Partial<DashboardPreferences>) => void;
  toggleFavorite: (sessionId: string) => Promise<void>;
  toggleSelection: (sessionId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  executeBatchOperation: (operation: BatchOperation) => Promise<void>;
  refresh: () => Promise<void>;
  exportSessions: (options: ExportOptions) => Promise<void>;
  compareSessions: (sessionIds: string[]) => SessionComparison;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
}
