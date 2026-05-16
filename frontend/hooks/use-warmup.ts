'use client';

import { useEffect, useRef } from 'react';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';

/**
 * Hook to warm up backend + ephemeris services when the BTR form loads.
 *
 * Sends a single GET to /api/warmup — a public, rate-limited endpoint that
 * fire-and-forgets an ephemeris health ping. Since worker stays alive via
 * min=1 / Pub/Sub, this primarily warms the API container (cold start ~1s)
 * and pre-loads the ephemeris Python kernel (~3-8s cold start).
 *
 * By the time the user fills in the form and hits Submit (typically 2-5 min),
 * all downstream services are warm and the pipeline starts instantly.
 *
 * Critical services excluded from warmup:
 *   - Worker:  min=1, Pub/Sub subscribed — always warm
 *   - Redis:   always connected via ioredis — no cold start
 *   - Neon DB: pool manages connections — no cold start
 */
export function useWarmup() {
    const hasWarmedUp = useRef(false);

    useEffect(() => {
        if (hasWarmedUp.current || !env.warmup.enabled) return;

        const warmupEngine = async () => {
            try {
                const url = `${env.api.backendUrl}/api/warmup`;
                logger.info('[WARMUP] Pre-warming backend engine...');

                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    headers: { 'Accept': 'application/json' },
                });

                if (response.ok) {
                    hasWarmedUp.current = true;
                    logger.info('[WARMUP] Engine warmed up successfully');
                } else {
                    logger.warn('[WARMUP] Warmup returned non-OK', { status: response.status });
                }
            } catch (error) {
                logger.warn('[WARMUP] Warmup request failed (expected on cold start)', { error });
            }
        };

        // Small delay (1s) to prioritize main page rendering
        const timeoutId = setTimeout(warmupEngine, 1000);
        return () => clearTimeout(timeoutId);
    }, []);
}
