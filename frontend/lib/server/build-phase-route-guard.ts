import { NextResponse } from 'next/server';

export function getBuildPhaseRouteResponse(): NextResponse | null {
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    return null;
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'X-Build-Phase-Route': 'true',
    },
  });
}
