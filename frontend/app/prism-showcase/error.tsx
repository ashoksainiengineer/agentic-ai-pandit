'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/secure-logger';
import Link from 'next/link';

export default function PrismShowcaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Prism showcase error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-medium text-black mb-2">Component showcase unavailable</h1>
        <p className="text-[#636363] mb-6">Something went wrong loading the showcase</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-black text-white rounded-xl hover:bg-black/80 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2 border border-[#d9d9d9] rounded-xl hover:bg-[var(--prism-canvas)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
