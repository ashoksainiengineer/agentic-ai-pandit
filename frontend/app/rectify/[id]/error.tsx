'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalysisError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Analysis route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[#C65D3B]/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#C65D3B]" />
          </div>

          <h1 className=" text-2xl font-medium text-black mb-2">
            Analysis Error
          </h1>
          <p className="text-[#636363] mb-8">
            Something went wrong while loading the analysis. The session may still be processing.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[rgba(0,0,0,0.08)] text-[#636363] font-medium rounded-xl hover:bg-[#ffffff] transition-colors"
            >
              <Home className="w-4 h-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
