import { NextRequest } from 'next/server';
import { proxyBackendJson } from '@/lib/server/backend-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyBackendJson(req, { path: `/api/v1/sessions/${id}` });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyBackendJson(req, { method: 'PUT', path: `/api/v1/sessions/${id}`, body });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyBackendJson(req, { method: 'DELETE', path: `/api/v1/sessions/${id}` });
}
