import { logger } from './secure-logger';

/**
 * 🔱 GOD-TIER TOKEN RETRIEVAL
 * Robustly acquires a Clerk token with retries and exponential backoff.
 */
export async function getTokenWithRetry(
    getToken: (options?: Record<string, unknown>) => Promise<string | null>,
    options: Record<string, unknown> = {},
    maxRetries = 10,
    isTestMode = false
): Promise<string | null> {
    if (isTestMode) {
        return 'mock-token-123456789012345678901234567890';
    }

    for (let i = 0; i < maxRetries; i++) {
        try {
            const token = await getToken(options);

            // Clean common garbage tokens
            if (token && token !== 'null' && token !== 'undefined' && token.length > 20) {
                if (i > 0) logger.info(`✅ [Auth] Token acquired after ${i} retries (len: ${token.length})`);
                return token;
            }

            if (i === 0) logger.debug('⏳ [Auth] Waiting for Clerk session...');
        } catch (err) {
            logger.warn(`⚠️ [Auth] Retry ${i} failed`, err instanceof Error ? { message: err.message } : undefined);
        }

        // Exponential backoff
        const delay = Math.min(100 * Math.pow(1.5, i), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    logger.error('❌ [Auth] Maximum retries reached for token acquisition');
    return null;
}
