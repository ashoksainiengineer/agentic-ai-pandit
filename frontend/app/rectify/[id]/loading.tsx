/**
 * Analysis Page Loading Skeleton
 * Sacred Ivory Light Theme — Streaming analysis with progress + results panel
 */
export default function AnalysisLoading() {
  return (
    <main className="min-h-screen bg-[var(--prism-canvas)]">
      {/* Session Header Skeleton */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[var(--prism-canvas)] rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-40" />
              <div className="h-3 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-24" />
            </div>
          </div>
          <div className="h-9 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-28" />
        </div>
      </div>

      {/* Progress Indicator Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-[var(--prism-canvas)] rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[var(--prism-canvas)] rounded-full animate-pulse w-full" />
              <div className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[var(--prism-canvas)] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Results Panel Skeleton */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-48" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
