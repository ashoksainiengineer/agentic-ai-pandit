/**
 * Dashboard Page — Server Component
 *
 * Renders the page shell immediately (TTFB ~200ms).
 * Session data streams in on the client via Suspense.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import Layout from '@/components/Layout';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardContent } from './DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <Layout hideFooter>
        <div className="min-h-[60vh] flex items-center justify-center bg-[var(--prism-canvas)]">
          <div className="bg-white rounded-3xl shadow-lg border border-black/5 p-8 max-w-md text-center">
            <h1 className="text-2xl font-medium text-black mb-4">
              Please Sign In
            </h1>
            <p className="text-sm text-black/60 mb-6">
              Access your dashboard to view and manage your birth time rectification sessions.
            </p>
            <Link 
              href="/sign-in" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="pt-8 pb-12 bg-[var(--prism-canvas)] min-h-screen">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent externalId={user.id} userName={user.firstName || 'User'} />
        </Suspense>
      </div>
    </Layout>
  );
}
