/**
 * Results Page Loading Skeleton
 * Sacred Ivory Light Theme — Results dashboard with charts + data cards
 */
export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-16" />
          ))}
        </div>

        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="h-9 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-72" />
          <div className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-96" />
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-3">
              <div className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-20" />
              <div className="h-8 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-32" />
              <div className="h-3 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-16" />
            </div>
          ))}
        </div>

        {/* Charts + Analysis */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-4">
            <div className="h-5 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-36" />
            <div className="h-64 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-full" />
          </div>
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 space-y-3">
            <div className="h-5 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-40" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
