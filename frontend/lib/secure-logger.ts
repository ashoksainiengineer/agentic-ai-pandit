/**
 * lib/secure-logger.ts
 * Production-grade secure logging utility
 * Prevents PII/PHI exposure in production environments
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    redactPatterns: RegExp[];
    samplingRate: number; // 0-1, for high-volume logs
}

const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_CONFIG: LoggerConfig = {
    level: isProduction ? 'warn' : 'debug',
    enableConsole: !isProduction,
    enableRemote: isProduction || (typeof window !== 'undefined' && window.__AI_PANDIT_TEST_MODE__ === true),
    redactPatterns: [
        // Email addresses
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        // Phone numbers (various formats)
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        // SSN patterns
        /\b\d{3}-\d{2}-\d{4}\b/g,
        // Credit card numbers (basic pattern)
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        // JWT tokens
        /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
        // API keys (common patterns)
        /[a-zA-Z0-9]{32,}/g,
        // Session IDs (long alphanumeric)
        /\b[a-f0-9]{32,}\b/gi,
    ],
    samplingRate: 1.0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOG LEVEL PRIORITY
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function sanitizeMessage(message: string, config: LoggerConfig): string {
    let sanitized = message;

    for (const pattern of config.redactPatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
}

function sanitizeObject<T extends Record<string, unknown>>(obj: T, config: LoggerConfig, depth = 0): T {
    if (depth > 3) {
        return '[Max Depth]' as unknown as T;
    }

    const sensitiveKeys = new Set([
        'password', 'token', 'secret', 'key', 'auth', 'credential',
        'email', 'phone', 'ssn', 'dob', 'birthDate', 'address',
        'name', 'fullName', 'firstName', 'lastName',
    ]);

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveKeys.has(lowerKey) || sensitiveKeys.has(key)) {
            result[key] = '[REDACTED]';
        } else if (typeof value === 'string') {
            result[key] = sanitizeMessage(value, config);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value as Record<string, unknown>, config, depth + 1);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMOTE LOGGING (Production)
// ═══════════════════════════════════════════════════════════════════════════════

function sendToRemoteLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    const payload = {
        level,
        message,
        meta,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
    };

    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/log-client', blob);
    } else {
        // Fallback to fetch with keepalive
        fetch('/api/log-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch((err) => {
            // BUG-FIX: Log to console so broken log pipeline is detectable
            console.warn('[SecureLogger] Failed to send log to server:', err);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class SecureLogger {
    private config: LoggerConfig;
    private baseMeta: Record<string, unknown>;

    constructor(config: Partial<LoggerConfig> = {}, baseMeta: Record<string, unknown> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.baseMeta = baseMeta;
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
    }

    private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        const mergedMeta = { ...this.baseMeta, ...meta };

        if (Object.keys(mergedMeta).length > 0) {
            return `${prefix} ${message} ${JSON.stringify(mergedMeta)}`;
        }

        return `${prefix} ${message}`;
    }

    debug(message: string, meta?: Record<string, unknown>) {
        if (!this.shouldLog('debug')) return;

        // Sampling for high-volume debug logs
        if (Math.random() > this.config.samplingRate) return;

        const sanitizedMessage = sanitizeMessage(message, this.config);
        const sanitizedMeta = meta ? sanitizeObject(meta, this.config) : undefined;

        if (this.config.enableConsole) {
            // eslint-disable-next-line no-console
            console.debug(this.formatMessage('debug', sanitizedMessage, sanitizedMeta));
        }
    }

    info(message: string, meta?: Record<string, unknown>) {
        if (!this.shouldLog('info')) return;

        const sanitizedMessage = sanitizeMessage(message, this.config);
        const sanitizedMeta = meta ? sanitizeObject(meta, this.config) : undefined;

        if (this.config.enableConsole) {
            // eslint-disable-next-line no-console
            console.info(this.formatMessage('info', sanitizedMessage, sanitizedMeta));
        }

        if (this.config.enableRemote) {
            sendToRemoteLog('info', sanitizedMessage, sanitizedMeta);
        }
    }

    warn(message: string, meta?: Record<string, unknown>) {
        if (!this.shouldLog('warn')) return;

        const sanitizedMessage = sanitizeMessage(message, this.config);
        const sanitizedMeta = meta ? sanitizeObject(meta, this.config) : undefined;

        if (this.config.enableConsole) {
            // eslint-disable-next-line no-console
            console.warn(this.formatMessage('warn', sanitizedMessage, sanitizedMeta));
        }

        if (this.config.enableRemote) {
            sendToRemoteLog('warn', sanitizedMessage, sanitizedMeta);
        }
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
        if (!this.shouldLog('error')) return;

        let errorMeta: Record<string, unknown> = { ...meta };

        if (error instanceof Error) {
            errorMeta = {
                ...errorMeta,
                errorName: error.name,
                errorMessage: sanitizeMessage(error.message, this.config),
                errorStack: !isProduction ? error.stack : undefined,
            };
        } else if (error !== undefined) {
            errorMeta = {
                ...errorMeta,
                errorValue: String(error),
            };
        }

        const sanitizedMessage = sanitizeMessage(message, this.config);

        if (this.config.enableConsole) {
            // eslint-disable-next-line no-console
            console.error(this.formatMessage('error', sanitizedMessage, errorMeta));
        }

        if (this.config.enableRemote) {
            sendToRemoteLog('error', sanitizedMessage, errorMeta);
        }
    }

    // Group logging for related operations
    group(label: string): { end: () => void } {
        if (this.config.enableConsole && typeof console.group === 'function') {
            console.group(sanitizeMessage(label, this.config));
        }

        return {
            end: () => {
                if (this.config.enableConsole && typeof console.groupEnd === 'function') {
                    console.groupEnd();
                }
            },
        };
    }

    // Create child logger with additional context
    child(context: Record<string, unknown>): SecureLogger {
        return new SecureLogger(
            { ...this.config },
            { ...this.baseMeta, ...context }
        );
    }

    // Enable test mode (for e2e/playwright environments)
    enableTestMode(): void {
        this.config.enableRemote = true;
        this.config.enableConsole = true;
        if (this.config.level !== 'error') {
            this.config.level = 'debug';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const logger = new SecureLogger();

/**
 * Enable test mode globally on the singleton logger.
 * Called by RootTestModeProvider when window.__AI_PANDIT_TEST_MODE__ is detected.
 */
export function enableGlobalTestMode(): void {
    logger.enableTestMode();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useLogger — MOVED to ./use-logger.ts to break circular dependency with logger.ts
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM-SPECIFIC LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

export const streamLogger = logger.child({ component: 'useStreamProgress' });

export default logger;
