/**
 * Global Error Page
 * Catches errors that escape the root layout (e.g., during rendering)
 * This MUST be a Client Component
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              backgroundColor: '#C65D3B10',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#000000',
              marginBottom: '8px'
            }}>
              Critical Error
            </h1>
            
            <p style={{
              color: '#636363',
              marginBottom: '24px',
              lineHeight: 1.5
            }}>
              The application encountered a critical error. Please refresh the page to try again.
            </p>

            <button
              onClick={reset}
              style={{
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Refresh Page
            </button>

            <Link
              href="/"
              style={{
                display: 'block',
                marginTop: '16px',
                color: '#636363',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
