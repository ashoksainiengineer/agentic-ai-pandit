/**
 * Rectify Page Loading Skeleton
 * Sacred Ivory Light Theme — Multi-step form skeleton
 */
export default function RectifyLoading() {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)]">
      {/* Step Indicators */}
      <div className="pt-28 pb-8">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-12">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-[var(--prism-canvas)] rounded-full animate-pulse"
                style={{ width: `${48 + i * 8}px` }}
              />
            ))}
          </div>

          {/* Form Area */}
          <div className="space-y-6">
            <div className="h-8 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-48 mx-auto" />
            <div className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-80 mx-auto" />

            <div className="space-y-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-[var(--prism-canvas)] rounded-lg animate-pulse w-24" />
                  <div className="h-12 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-full" />
                </div>
              ))}
            </div>

            <div className="h-32 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-full mt-4" />
          </div>
        </div>
      </div>

      {/* Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(0,0,0,0.08)] p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="h-10 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-24" />
          <div className="h-10 bg-[var(--prism-canvas)] rounded-xl animate-pulse w-32" />
        </div>
      </div>
    </div>
  );
}
