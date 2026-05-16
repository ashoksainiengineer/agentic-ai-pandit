/**
 * Function Warmup Utility
 * Keeps the deployed web service warm to reduce cold starts
 */

import { logger } from './logger';
import { env } from './config/env';

interface WarmupConfig {
  endpoints: string[];
  intervalMs: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: WarmupConfig = {
  endpoints: ['/api/health'],
  intervalMs: 2 * 60 * 1000, // 2 minutes
  timeoutMs: 5000,
};

/**
 * Ping a single endpoint to keep it warm
 */
async function pingEndpoint(url: string, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    logger.info(`Warmup ping successful`, { url, status: response.status });
  } catch (error) {
    logger.warn(`Warmup ping failed`, { url, error: (error as Error).message });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Execute warmup pings for all configured endpoints
 */
export async function executeWarmup(config: Partial<WarmupConfig> = {}): Promise<void> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const baseUrl = env.app.baseUrl;

  const pingPromises = mergedConfig.endpoints.map((endpoint) => {
    if (!baseUrl && !endpoint.startsWith('http')) {
      logger.warn('Skipping warmup endpoint because no public app URL is configured', { endpoint });
      return Promise.resolve();
    }
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    return pingEndpoint(url, mergedConfig.timeoutMs);
  });

  await Promise.all(pingPromises);
}

/**
 * Start continuous warmup (for use in long-running processes)
 */
export function startContinuousWarmup(config: Partial<WarmupConfig> = {}): () => void {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const intervalId = setInterval(() => {
    executeWarmup(config).catch((error) => {
      logger.error('Warmup execution failed', { error });
    });
  }, mergedConfig.intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
