import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/secure-logger';
import { getServerAuth } from '@/lib/server/auth';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

/**
 * /api/log-client/route.ts
 * Secure endpoint for receiving and processing client-side logs.
 * Ensures that browser errors and lifecycle events are visible in server logs.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    try {
        const sessionAuth = await getServerAuth();

        // Require authentication for client logging (BUG-023: prevent log flooding)
        if (!sessionAuth) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }
        // BUG-FIX NOTE: No body size limit — add Content-Length check in production
        const body = await req.json();

        const logEntry = {
            ...body,
            userId: sessionAuth.providerId,
            source: 'browser-client',
            receivedAt: new Date().toISOString(),
        };

        // In production, stdout is captured by the hosting platform and monitoring pipeline.
        logger.info(`[CLIENT_LOG] ${JSON.stringify(logEntry)}`);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      // BUG-FIX: Log the failure so broken log pipeline is detectable
      console.warn('[CLIENT_LOG] Failed to process client log:', error);
      return NextResponse.json({ success: false }, { status: 500 });
}
}
