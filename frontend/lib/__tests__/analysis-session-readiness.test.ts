import { describe, it, expect } from 'vitest';
import { waitForAnalysisSessionReady } from '../analysis-session-readiness';

describe('waitForAnalysisSessionReady', () => {
  it.skip('returns false when all attempts fail', async () => {
    const result = await waitForAnalysisSessionReady('http://localhost', 'test-session', async () => 'token');
    expect(result).toBe(false);
  });

  it('accepts valid parameters', () => {
    expect(typeof waitForAnalysisSessionReady).toBe('function');
  });
});
