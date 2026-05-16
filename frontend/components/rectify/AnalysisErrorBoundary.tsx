'use client';

// components/rectify/AnalysisErrorBoundary.tsx
// Production-grade error boundary for analysis page with graceful degradation

import { Component, ReactNode, ErrorInfo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, Activity, Bug } from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
    children?: ReactNode;
    fallback?: ReactNode;
    sectionName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
    showDetails: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const THEME = {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceWarm: '#ffffff',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#000000',
    textSecondary: '#636363',
    textMuted: '#636363',
    gold: '#000000',
    goldLight: '#000000',
    success: '#184131',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Generate unique error ID for support tracking
// ═══════════════════════════════════════════════════════════════════════════════

function generateErrorId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
    return `ERR-${timestamp}-${randomPart}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ERROR BOUNDARY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export class AnalysisErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
            errorId: generateErrorId(),
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // Send to error tracking service (Sentry, LogRocket, etc.)
            this.logErrorToService(error, errorInfo);
        }

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // Update state with error info
        this.setState({ errorInfo });
    }

    private logErrorToService(error: Error, errorInfo: ErrorInfo) {
        // Placeholder for production error logging
        // In production, integrate with your error tracking service
        const errorPayload = {
            errorId: this.state.errorId,
            section: this.props.sectionName || 'AnalysisPage',
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        };

        // Send beacon for reliability
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([JSON.stringify(errorPayload)], { type: 'application/json' });
            navigator.sendBeacon('/api/log-error', blob);
        }
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            showDetails: false,
        });
        this.props.onReset?.();
    };

    private handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    private toggleDetails = () => {
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return (
                    <div role="alert" aria-live="assertive">
                        {this.props.fallback}
                    </div>
                );
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    errorId={this.state.errorId}
                    sectionName={this.props.sectionName}
                    showDetails={this.state.showDetails}
                    onReset={this.handleReset}
                    onReload={this.handleReload}
                    onToggleDetails={this.toggleDetails}
                />
            );
        }

        return this.props.children;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR FALLBACK UI COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorFallbackProps {
    error: Error | null;
    errorId: string;
    sectionName?: string;
    showDetails: boolean;
    onReset: () => void;
    onReload: () => void;
    onToggleDetails: () => void;
}

function ErrorFallback({
    error,
    errorId,
    sectionName,
    showDetails,
    onReset,
    onReload,
    onToggleDetails,
}: ErrorFallbackProps) {
    const isRecoverable = sectionName !== 'AnalysisPage'; // Page-level errors need reload

    return (
        <motion.div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border p-8 text-center"
            style={{
                backgroundColor: THEME.surface,
                borderColor: `${THEME.error}30`,
            }}
        >
            {/* Error Icon */}
            <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${THEME.error}10` }}
                aria-hidden="true"
            >
                <AlertCircle className="w-8 h-8" style={{ color: THEME.error }} />
            </div>

            {/* Error Title */}
            <h2
                className="text-2xl font-medium mb-2"
                style={{ color: THEME.textPrimary }}
            >
                {sectionName ? `${sectionName} Error` : 'Something Went Wrong'}
            </h2>

            {/* Error Description */}
            <p className="mb-2" style={{ color: THEME.textMuted }}>
                We encountered an unexpected error.
                {isRecoverable
                    ? ' This section has been isolated to prevent data loss.'
                    : ' Your analysis progress is safe.'}
            </p>

            {/* Error ID for Support */}
            <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6 text-sm font-mono"
                style={{
                    backgroundColor: THEME.surfaceWarm,
                    color: THEME.textMuted,
                }}
            >
                <Bug className="w-4 h-4" />
                Error ID: {errorId}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {isRecoverable ? (
                    <button
                        onClick={onReset}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.goldLight})`,
                        }}
                        aria-label="Try to recover this section"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                ) : (
                    <button
                        onClick={onReload}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.goldLight})`,
                        }}
                        aria-label="Reload the page"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </button>
                )}

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                        borderColor: THEME.border,
                        color: THEME.textSecondary,
                    }}
                    aria-label="Return to dashboard"
                >
                    <Home className="w-4 h-4" />
                    Dashboard
                </Link>
            </div>

            {/* Technical Details (Collapsible) */}
            {process.env.NODE_ENV === 'development' && error && (
                <div className="mt-6">
                    <button
                        onClick={onToggleDetails}
                        className="text-sm underline"
                        style={{ color: THEME.textMuted }}
                        aria-expanded={showDetails}
                        aria-controls="error-details"
                    >
                        {showDetails ? 'Hide' : 'Show'} Technical Details
                    </button>

                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                id="error-details"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 overflow-hidden"
                            >
                                <pre
                                    className="text-left text-xs p-4 rounded-lg overflow-auto max-h-64"
                                    style={{
                                        backgroundColor: THEME.surfaceWarm,
                                        color: THEME.error,
                                    }}
                                >
                                    {error.message}
                                    {'\n\n'}
                                    {error.stack}
                                </pre>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION-SPECIFIC ERROR BOUNDARY (For granular error isolation)
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionErrorBoundaryProps {
    children?: ReactNode;
    sectionName: string;
    icon?: ReactNode;
}

export function SectionErrorBoundary({
    children,
    sectionName,
    icon,
}: SectionErrorBoundaryProps) {
    return (
        <AnalysisErrorBoundary
            sectionName={sectionName}
            fallback={
                <SectionErrorFallback
                    sectionName={sectionName}
                    icon={icon}
                />
            }
        >
            {children}
        </AnalysisErrorBoundary>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ERROR FALLBACK (Compact inline version)
// ═══════════════════════════════════════════════════════════════════════════════

function SectionErrorFallback({
    sectionName,
    icon,
}: {
    sectionName: string;
    icon?: ReactNode;
}) {
    return (
        <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{
                backgroundColor: `${THEME.error}05`,
                borderColor: `${THEME.error}20`,
            }}
        >
            {icon || <Activity className="w-5 h-5" style={{ color: THEME.error }} />}
            <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: THEME.textSecondary }}>
                    {sectionName} temporarily unavailable
                </p>
                <p className="text-xs" style={{ color: THEME.textMuted }}>
                    This section will recover automatically when data is available.
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useErrorHandler (for functional components)
// ═══════════════════════════════════════════════════════════════════════════════


interface UseErrorHandlerReturn {
    error: Error | null;
    handleError: (error: Error) => void;
    clearError: () => void;
    errorId: string;
}

export function useErrorHandler(): UseErrorHandlerReturn {
    const [error, setError] = useState<Error | null>(null);
    const [errorId] = useState(() => generateErrorId());

    const handleError = useCallback((err: Error) => {
        setError(err);

        // Log to service in production
        if (process.env.NODE_ENV === 'production') {
            const errorPayload = {
                errorId,
                message: err.message,
                stack: err.stack,
                timestamp: new Date().toISOString(),
            };

            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([JSON.stringify(errorPayload)], { type: 'application/json' });
                navigator.sendBeacon('/api/log-error', blob);
            }
        }
    }, [errorId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { error, handleError, clearError, errorId };
}

export default AnalysisErrorBoundary;
