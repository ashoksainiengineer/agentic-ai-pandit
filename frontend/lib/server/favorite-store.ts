import { NextResponse } from 'next/server';
import { proxyBackendJson } from './backend-proxy';

export async function setFavorite(_req: Request, userId: string, sessionId: string) {
  return NextResponse.json({ success: true });
}

export async function toggleFavorite(req: Request, userId: string, sessionId: string) {
  return NextResponse.json({ success: true, favorited: true });
}

export async function getFavoriteSetForSessions(req: Request, sessionIds: string[]) {
  return new Set<string>();
}
