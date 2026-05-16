import { NextRequest } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  return proxyBackendJson(req, {
    path: '/api/v1/sessions/export',
    searchParams,
  });
}
