/**
 * Dashboard Page Loading Skeleton
 * Light Theme — Stats grid + session list + sidebar
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)]">
      {/* Nav Skeleton */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-10 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-48" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="h-10 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-64 mb-4" />
          <div className="h-5 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-96" />
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--prism-canvas)] rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Content: Session List + Sidebar */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Session List */}
          <div className="lg:col-span-2 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--prism-canvas)] rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="h-64 bg-[var(--prism-canvas)] rounded-2xl animate-pulse" />
            <div className="h-48 bg-[var(--prism-canvas)] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
