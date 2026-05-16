/**
 * Global Error Boundary
 * Catches errors in React components and displays a graceful fallback UI
 */

'use client';

import { env } from '@/lib/config/env';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail, Clipboard } from 'lucide-react';
import { logger } from '@/lib/secure-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Generate a unique error reference ID
function generateErrorId(): string {
  return `ERR-${Date.now()}-${crypto.randomUUID()}`;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const errorId = generateErrorId();

  useEffect(() => {
    logger.error('Error caught by boundary', error, {
      errorId,
      digest: error.digest,
      isProduction: env.app.isProduction,
    });

    // In production, send to error tracking endpoint
    if (env.app.isProduction && typeof window !== 'undefined') {
      fetch('/api/log-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: `Error boundary: ${error.message}`,
          meta: { errorId, digest: error.digest, url: window.location.href },
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      }).catch((err) => {
        // BUG-FIX: Log failure so broken error pipeline is detectable
        console.warn('[ErrorBoundary] Failed to report error:', err);
      });
    }
  }, [error, errorId]);

  const copyErrorId = () => {
    navigator.clipboard.writeText(errorId);
  };

  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-white border border-black/8 rounded-2xl p-8 shadow-lg">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-black/5 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-black" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-light text-black text-center mb-2">
            Something Went Wrong
          </h1>

          {/* Message */}
          <p className="text-black/60 text-center mb-6">
            We apologize for the inconvenience. Our team has been notified and we&apos;re working to fix this issue.
          </p>

          {/* Error Reference ID */}
          <div className="bg-white border border-black/8 rounded-xl p-4 mb-6">
            <p className="text-xs text-black/60 uppercase tracking-wider mb-2">Error Reference ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm text-black bg-white px-3 py-2 rounded border border-black/8">
                {errorId}
              </code>
              <button
                onClick={copyErrorId}
                className="p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                title="Copy error ID"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-black/40 mt-2">
              Please provide this ID if you contact support
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-black/8 text-black/60 font-medium rounded-xl hover:bg-white transition-colors"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>

            <a
              href={`mailto:app.aipandit@gmail.com?subject=Error%20Report%20-%20${errorId}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-black/60 hover:text-black transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {!env.app.isProduction && (
          <div className="mt-6 p-4 bg-black rounded-xl overflow-auto">
            <p className="text-xs text-black/40 uppercase tracking-wider mb-2">Technical Details (Dev Only)</p>
            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
