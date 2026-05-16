'use client';

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Sparkles, Search, BarChart3, CheckCircle2, Activity } from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';

interface DashboardClientProps {
  initialSessions: DashboardSession[];
  userName: string;
}

const ITEMS_PER_PAGE = 10;

interface DashboardStats {
  total: number;
  completed: number;
  accuracy: number;
}

function getPageNumbers(current: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    if (current > 3) pages.push(null);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(null);
    pages.push(total);
    return pages;
}

function calculateStats(sessions: DashboardSession[]): DashboardStats {
  const completed = sessions.filter(s => s.status === 'complete');
  const withAccuracy = completed.filter(s => s.accuracy != null);
  const avgAccuracy = withAccuracy.length > 0
    ? Math.round(withAccuracy.reduce((acc, s) => acc + Number(s.accuracy), 0) / withAccuracy.length)
    : 0;

  return {
    total: sessions.length,
    completed: completed.length,
    accuracy: avgAccuracy
  };
}

const StatCard = memo(function StatCard({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-[var(--prism-canvas)] rounded-lg">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-lg sm:text-2xl font-medium text-black">{value}</div>
          <div className="text-xs sm:text-sm text-[#636363] truncate">{label}</div>
        </div>
      </div>
    </div>
  );
});

export function DashboardClient({ initialSessions, userName }: DashboardClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  // Debounce search to avoid O(n) filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const removeSessionFromDashboard = useCallback((deletedId: string) => {
    setSessions(prev => prev.filter(s => s.id !== deletedId));
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(session =>
      session.fullName?.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const navigateToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const createNewSession = useCallback(() => {
    router.push('/rectify?new=true');
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
      {/* Breadcrumbs */}
      <Breadcrumbs items={predefinedBreadcrumbs.dashboard()} className="mb-4" />

      {/* Header - Mobile Responsive */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-xl sm:text-3xl font-medium text-black ">
            Welcome, {userName}
          </h1>
          <p className="text-sm sm:text-base text-[#636363] mt-1">
            Manage your BTR sessions
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={createNewSession}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-[#000000] text-black rounded-xl font-medium hover:bg-[#000000]/10 transition-all text-xs sm:text-sm disabled:opacity-50"
          >
            + New Person
          </button>
          <Link
            href="/rectify?new=true"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-black text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#000000]/20 transition-all text-sm sm:text-base"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            Continue Analysis
          </Link>
        </div>
      </div>

      {/* Stats - Mobile Responsive Grid */}
      <div
        className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <StatCard
          icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
          value={stats.total}
          label="Total"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#184131]" />}
          value={stats.completed}
          label="Done"
        />
        <StatCard
          icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B9AC4]" />}
          value={`${stats.accuracy}%`}
          label="Accuracy"
        />
      </div>

      {/* Search */}
      <div
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#636363]" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8E0D5] rounded-xl text-black placeholder-[#959595] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none transition-all"
        />
      </div>

      {/* Sessions List */}
      <div
        className="space-y-3"
      >

        {paginatedSessions.length === 0 ? (
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔮</div>
            <h3 className="text-xl font-medium text-black mb-2">
              {searchQuery ? 'No matches found' : 'No sessions yet'}
            </h3>
            <p className="text-[#636363] mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start your first birth time rectification analysis'}
            </p>
            {!searchQuery && (
              <Link
                href="/rectify?new=true"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-5 h-5" />
                Start First Analysis
              </Link>
            )}
          </div>
        ) : (
          paginatedSessions.map(session => (
            <div
              key={session.id}
            >
              <SessionCard
                session={session}
                viewMode="list"
                isSelected={false}
                isFavorite={false}
                onDelete={removeSessionFromDashboard}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination - Mobile Responsive with windowing */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#636363] hover:text-black disabled:opacity-30 transition-colors"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === null ? (
              <span key={`e${i}`} className="px-1 text-[#636363] text-xs sm:text-sm">...</span>
            ) : (
              <button
                key={page}
                onClick={() => navigateToPage(page)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#000000] text-white'
                    : 'text-[#636363] hover:bg-[var(--prism-canvas)]'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#636363] hover:text-black disabled:opacity-30 transition-colors"
          >
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      )}

    </div>
  );
}
