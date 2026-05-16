import { NextRequest } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyBackendJson(req, { method: 'POST', path: `/api/v1/sessions/${id}/clone` });
}
