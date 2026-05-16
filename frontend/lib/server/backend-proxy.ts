import { getServerAuth } from '@/lib/server/auth';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/config/env';

type ProxyOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  searchParams?: URLSearchParams;
};

export async function proxyBackendJson(req: NextRequest, options: ProxyOptions): Promise<NextResponse> {
  const sessionAuth = await getServerAuth();
  if (!sessionAuth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = await sessionAuth.getToken();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const backendUrl = new URL(`${env.api.backendUrl}${options.path}`);
  if (options.searchParams) {
    backendUrl.search = options.searchParams.toString();
  }

  let response: Response;
  try {
    response = await fetch(backendUrl.toString(), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend unreachable. Please try again.' },
      { status: 502 }
    );
  }
  const contentType = response.headers.get('content-type') || 'application/json';
  let text = await response.text();

  // Normalize Express structured errors {error:{code,message}} to flat {error:"message"}
  if (contentType.includes('json') && !response.ok) {
    try {
      const json = JSON.parse(text);
      if (json?.error && typeof json.error === 'object' && json.error.message) {
        json.error = json.error.message; // Flatten structured error
        text = JSON.stringify(json);
      }
    } catch { /* not valid JSON, pass through */ }
  }

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}
