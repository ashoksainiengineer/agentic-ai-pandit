import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { EditSessionClient } from './EditSessionClient';
import Layout from '@/components/Layout';
import { env } from '@/lib/config/env';
import '@/app/globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSessionFromAPI(sessionId: string, userId: string) {
  const backendUrl = env.api.backendUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${backendUrl}/api/v1/sessions/${sessionId}`, {
      headers: {
        'X-User-Id': userId,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const sessionData = await getSessionFromAPI(sessionId, user.id);
  if (!sessionData) notFound();

  return (
    <Layout>
      <Suspense fallback={<div className="p-8 text-center">Loading session...</div>}>
        <EditSessionClient sessionId={sessionId} initialData={sessionData} />
      </Suspense>
    </Layout>
  );
}
