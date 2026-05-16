import { NextRequest, NextResponse } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export async function GET(req: NextRequest) {
  return proxyBackendJson(req, { path: '/api/v1/sessions' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyBackendJson(req, { method: 'POST', path: '/api/v1/sessions', body });
}
