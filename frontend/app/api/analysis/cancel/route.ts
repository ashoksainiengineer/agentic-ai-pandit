import { NextRequest } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  const body = await req.json();
  return proxyBackendJson(req, {
    method: 'POST',
    path: '/api/queue/cancel',
    body,
  });
}
