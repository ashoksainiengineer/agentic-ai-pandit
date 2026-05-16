'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TermsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Terms page error:', error); }, [error]);
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-black mb-2">Something went wrong</h1>
        <p className="text-[#636363] mb-6">Please try again</p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="px-6 py-2 bg-black text-white rounded-xl">Try again</button>
          <Link href="/" className="px-6 py-2 border rounded-xl">Back to Home</Link>
        </div>
      </div>
    </main>
  );
}
