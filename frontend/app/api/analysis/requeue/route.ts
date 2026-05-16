import { NextRequest, NextResponse } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    const body = await req.json();
    return proxyBackendJson(req, {
      method: 'POST',
      path: '/api/queue/requeue',
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: `Requeue proxy error: ${message}` },
      { status: 500 }
    );
  }
}
