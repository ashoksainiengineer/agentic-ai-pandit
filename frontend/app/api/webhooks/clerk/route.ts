/**
 * Clerk Webhook proxy — forwards webhook events to the FastAPI backend.
 */
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const backendUrl = env.api.backendUrl.replace(/\/$/, '');
  const webhookSecret = env.clerk.webhookSecret;

  // Forward the raw request to FastAPI
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key.startsWith('svix-') || key === 'content-type') {
      headers[key] = value;
    }
  });

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/v1/webhooks/clerk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'x-webhook-secret': webhookSecret || '',
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Webhook proxy failed' },
      { status: 502 },
    );
  }
}
