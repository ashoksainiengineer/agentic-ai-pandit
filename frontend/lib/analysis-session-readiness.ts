const READINESS_MAX_ATTEMPTS = 12;
const READINESS_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForAnalysisSessionReady(
  backendUrl: string,
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<boolean> {
  for (let attempt = 1; attempt <= READINESS_MAX_ATTEMPTS; attempt++) {
    try {
      const token = getToken ? await getToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const baseUrl = backendUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/queue/progress?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'GET',
        cache: 'no-store',
        headers,
      });

      if (res.ok) {
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        return false;
      }
    } catch {
      // Retry transient network failures.
    }

    await sleep(READINESS_DELAY_MS);
  }

  return false;
}
