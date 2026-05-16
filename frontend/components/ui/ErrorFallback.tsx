'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail, Clipboard } from 'lucide-react';
import '@/app/prism-design-system.css';
import { env } from '@/lib/config/env';

interface ErrorFallbackProps {
  title: string;
  message: string;
  showDetails?: boolean;
  onReset?: () => void;
  error?: Error & { digest?: string };
  errorId?: string;
  homeHref?: string;
  homeLabel?: string;
  supportHref?: string;
}

export default function ErrorFallback({
  title,
  message,
  showDetails = false,
  onReset,
  error,
  errorId,
  homeHref = '/',
  homeLabel = 'Return Home',
  supportHref = 'mailto:app.aipandit@gmail.com',
}: ErrorFallbackProps) {
  const copyErrorId = () => {
    if (errorId) {
      navigator.clipboard.writeText(errorId);
    }
  };

  return (
    <div className="min-h-screen bg-prism-canvas flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-prism-snow border border-prism-pebble rounded-prism-xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="font-prism text-2xl font-medium text-prism-ink text-center mb-2">
            {title}
          </h1>

          {/* Message */}
          <p className="text-prism-graphite text-center mb-6 font-prism">{message}</p>

          {/* Error Reference ID */}
          {errorId && (
            <div className="bg-prism-fog border border-prism-pebble rounded-prism-lg p-4 mb-6">
              <p className="text-xs text-prism-graphite uppercase tracking-wider mb-2 font-prism">Error Reference ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm text-prism-ink bg-prism-snow px-3 py-2 rounded border border-prism-pebble">
                  {errorId}
                </code>
                <button
                  onClick={copyErrorId}
                  className="p-2 text-prism-graphite hover:text-prism-ink hover:bg-prism-fog rounded-lg transition-colors"
                  title="Copy error ID"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-prism-slate mt-2 font-prism">
                Please provide this ID if you contact support
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onReset && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-prism-ink text-prism-snow font-medium rounded-prism-xl hover:bg-prism-graphite transition-colors font-prism"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <Link
              href={homeHref}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-prism-pebble text-prism-graphite font-medium rounded-prism-xl hover:bg-prism-fog transition-colors font-prism"
            >
              <Home className="w-4 h-4" />
              {homeLabel}
            </Link>

            <a
              href={supportHref}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-prism-graphite hover:text-prism-ink transition-colors font-prism"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {showDetails && error && !env.app.isProduction && (
          <div className="mt-6 p-4 bg-prism-ink rounded-prism-xl overflow-auto">
            <p className="text-xs text-prism-slate uppercase tracking-wider mb-2 font-prism">Technical Details (Dev Only)</p>
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
