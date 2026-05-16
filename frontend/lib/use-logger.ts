// use-logger.ts — React hook extracted from secure-logger.ts to break circular dependency
// BUG-019: logger.ts ↔ secure-logger.ts circular import resolved

import { useMemo } from 'react';
import { logger, SecureLogger } from './secure-logger.js';

export function useLogger(context?: Record<string, unknown>): SecureLogger {
    return useMemo(() => {
        if (context) {
            return logger.child(context);
        }
        return logger;
    }, [context]);
}
