'use client';

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome heading */}
      <div className="mb-8">
        <div className="h-10 bg-black/5 rounded-xl animate-pulse w-64 mb-2" />
        <div className="h-5 bg-black/5 rounded-xl animate-pulse w-48" />
      </div>

      {/* 3 Stat cards (matches real grid-cols-3) */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-black/5 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Search bar */}
      <div className="h-12 bg-black/5 rounded-xl animate-pulse w-full mb-6" />

      {/* Session list items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-black/5 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
