/**
 * Lightweight Ping Endpoint
 * Optimized for minimal cold start time
 * Used by cron jobs and health checks to keep the web service warm
 */

import { NextResponse } from 'next/server';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(_request: Request): Promise<NextResponse> {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse as NextResponse;

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: Date.now(),
      region: process.env.APP_REGION || process.env.CLOUD_RUN_REGION || process.env.VERCEL_REGION || 'unknown',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': 'true',
      },
    }
  );
}

export async function HEAD(_request: Request): Promise<Response> {
  const buildPhaseResponse = getBuildPhaseRouteResponse();
  if (buildPhaseResponse) return buildPhaseResponse;

  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Check': 'true',
    },
  });
}
