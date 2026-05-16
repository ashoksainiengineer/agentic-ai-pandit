'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/secure-logger';

/**
 * Debug Provider - Development only
 * Attaches debug utilities to window for console debugging
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let checkStore: ReturnType<typeof setInterval> | null = null;

      // Dynamically import debug utilities to avoid build issues
      void (async () => {
        let debugAnalysis: Record<string, unknown> = {};
        try {
          const debugModule = await import('@/lib/debug/analysis-debug');
          debugAnalysis = debugModule.debugAnalysis || {};
        } catch {
          // Debug module not available in production build
          debugAnalysis = {
            logStreamState: () => console.log('Debug not available'),
            checkMemory: () => console.log('Debug not available'),
            monitorSSE: () => console.log('Debug not available'),
            checkRenders: () => console.log('Debug not available'),
            inspectCandidate: () => console.log('Debug not available'),
            getErrors: () => console.log('Debug not available'),
          };
        }

        // Attach to window
        (window as unknown as Record<string, unknown>).debugAnalysis = debugAnalysis;

        // Expose Zustand store if available
        checkStore = setInterval(() => {
          const store = (window as unknown as Record<string, unknown>).__STREAM_STORE__ ||
                       (window as unknown as Record<string, unknown>).useStreamStore;
          if (store) {
            (window as unknown as Record<string, unknown>).__STREAM_STORE__ = store;
            if (checkStore) clearInterval(checkStore);
          }
        }, 1000);

        logger.info('🔧 Debug utilities loaded! Try:');
        logger.info('  debugAnalysis.logStreamState()');
        logger.info('  debugAnalysis.checkMemory()');
        logger.info('  debugAnalysis.getErrors()');
      })();

      return () => {
        if (checkStore) clearInterval(checkStore);
      };
    }
  }, []);

  return <>{children}</>;
}
