'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useClipboard(timeout = 2000) {
    const [hasCopied, setHasCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const copyToClipboard = useCallback(async (text: string) => {
        setError(null);

        const handleSuccess = () => {
            setHasCopied(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setHasCopied(false);
            }, timeout);
        };

        // Modern API
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                handleSuccess();
                return true;
            } catch (err) {
                // Fallback to execCommand if navigator.clipboard fails
                console.warn('navigator.clipboard.writeText failed, falling back to execCommand', err);
            }
        }

        // Fallback: execCommand
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;

            // Avoid scrolling to bottom
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            // BUG-FIX NOTE: execCommand is deprecated but still the only reliable fallback for older browsers
            // navigator.clipboard API is tried first above
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                handleSuccess();
                return true;
            } else {
                throw new Error('Fallback copy command failed');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            setError(err instanceof Error ? err : new Error('Copy failed'));
            return false;
        }
    }, [timeout]);

    return { copyToClipboard, hasCopied, error };
}
