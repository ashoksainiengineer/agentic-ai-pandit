'use client';

import React from 'react';
import { logger } from '@/lib/secure-logger';
import { AlertTriangle } from 'lucide-react';
import { THEME } from '../../dashboard/theme';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ResultsErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('ResultsDashboard Error:', error, { componentStack: errorInfo.componentStack });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: THEME.bg }}>
                    <div className="rounded-xl p-8 max-w-md text-center shadow-lg" style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.error}30` }}>
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: THEME.error }} />
                        <h2 className="text-xl font-medium mb-2" style={{ color: THEME.textPrimary }}>Something Went Wrong</h2>
                        <p className="text-sm mb-4" style={{ color: THEME.textSecondary }}>
                            We encountered an error displaying your results. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: THEME.gold, color: 'white' }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
