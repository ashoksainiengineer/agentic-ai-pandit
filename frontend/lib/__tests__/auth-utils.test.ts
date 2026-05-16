import { describe, it, expect, vi } from 'vitest';
import { getTokenWithRetry } from '../auth-utils';

describe('getTokenWithRetry', () => {
  it('returns mock token in test mode', async () => {
    const token = await getTokenWithRetry(async () => 'real-token', {}, 3, true);
    expect(token).toBe('mock-token-123456789012345678901234567890');
  });

  it('returns valid token on first try', async () => {
    const getToken = vi.fn().mockResolvedValue('valid-token-with-more-than-20-chars');
    const token = await getTokenWithRetry(getToken, {}, 3, false);
    expect(token).toBe('valid-token-with-more-than-20-chars');
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('retries on null token', async () => {
    const getToken = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('valid-token-with-more-than-20-chars');
    const token = await getTokenWithRetry(getToken, {}, 5, false);
    expect(token).toBe('valid-token-with-more-than-20-chars');
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it('returns null after max retries', async () => {
    const getToken = vi.fn().mockResolvedValue(null);
    const token = await getTokenWithRetry(getToken, {}, 2, false);
    expect(token).toBeNull();
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it('rejects short tokens as garbage', async () => {
    const getToken = vi.fn()
      .mockResolvedValueOnce('short')
      .mockResolvedValueOnce('valid-token-with-more-than-20-chars');
    const token = await getTokenWithRetry(getToken, {}, 3, false);
    expect(token).toBe('valid-token-with-more-than-20-chars');
  });
});
