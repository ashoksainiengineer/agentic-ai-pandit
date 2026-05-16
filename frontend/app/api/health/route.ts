import { NextRequest } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export async function GET() {
  return proxyBackendJson({} as NextRequest, { path: '/api/v1/health' });
}
