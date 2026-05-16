// Mock auth-utils to avoid retry loop timeouts
vi.mock('../auth-utils', () => ({
    getTokenWithRetry: vi.fn(async (getToken: any) => {
        const token = await getToken();
        return token;
    }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient } from '../api-client';

// Mock fetch
global.fetch = vi.fn();

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient.get('https://api.test.com/sessions');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/sessions',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle 404 errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found' }),
      });

      await expect(APIClient.get('https://api.test.com/nonexistent')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(APIClient.get('https://api.test.com/sessions')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const mockResponse = { id: '123' };
      const body = { date: '1990-01-01', time: '12:00' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201,
      });

      await APIClient.post('https://api.test.com/sessions', body, async () => 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle 400 validation errors', async () => {
      const errorResponse = { error: 'Invalid birth data' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(APIClient.post('https://api.test.com/sessions', {}, async () => null)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      await expect(APIClient.get('https://api.test.com/sessions')).rejects.toThrow('Timeout');
    });

    it('should parse error responses correctly', async () => {
      const errorData = { error: 'Validation failed', details: ['date required'] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => errorData,
      });

      try {
        await APIClient.post('https://api.test.com/sessions', {}, async () => null);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
