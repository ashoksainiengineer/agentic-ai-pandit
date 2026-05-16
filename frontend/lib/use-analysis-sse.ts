'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useStreamStore } from '@/lib/store/stream-store';
import { useAuth } from '@clerk/nextjs';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/secure-logger';

const RECONNECT_INTERVAL_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 50;

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useAnalysisSSE(sessionId: string | null) {
    const dispatchStreamEvent = useStreamStore((s) => s.dispatchStreamEvent);
    const setSessionId = useStreamStore((s) => s.setSessionId);
    const { getToken } = useAuth();

    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const abortRef = useRef<AbortController | null>(null);
    const reconnectAttemptRef = useRef(0);
    const mountedRef = useRef(true);
    const sessionRef = useRef<string | null>(null);

    const connect = useCallback(async () => {
        if (!sessionId || !mountedRef.current) return;

        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setConnectionState('connecting');

        try {
            const token = await getToken();
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');
            const lastSeq = sessionRef.current === sessionId ? (useStreamStore.getState().lastEventId || 0) : 0;
            const url = `${backendUrl}/api/stream/${encodeURIComponent(sessionId)}?lastSeq=${lastSeq}`;

            await fetchEventSource(url, {
                method: 'GET',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    Accept: 'text/event-stream',
                },
                signal: controller.signal,
                openWhenHidden: true,

                onopen: async (response) => {
                    if (!response.ok || !mountedRef.current) {
                        throw new Error(`SSE connection failed: ${response.status}`);
                    }
                    setConnectionState('connected');
                    reconnectAttemptRef.current = 0;
                    logger.info('[SSE] Connection established', { sessionId: sessionId.slice(0, 8) });
                },

                onmessage: (event) => {
                    if (!mountedRef.current) return;

                    if (!event.data || event.data.trim() === '') return;

                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed && typeof parsed.type === 'string') {
                            dispatchStreamEvent(parsed.type, parsed);
                            if (event.id) {
                                const seq = parseInt(event.id, 10);
                                if (!isNaN(seq)) {
                                    useStreamStore.getState().setLastEventId(seq);
                                }
                            }

                            if (parsed.type === 'complete' || parsed.type === 'error') {
                                logger.info('[SSE] Terminal event received', {
                                    sessionId: sessionId.slice(0, 8),
                                    type: parsed.type,
                                });
                                controller.abort();
                            }
                        }
                    } catch {
                        // Skip non-JSON messages (e.g., heartbeats are comment lines)
                    }
                },

                onerror: (err) => {
                    if (!mountedRef.current) {
                        throw err;
                    }

                    setConnectionState('error');
                    reconnectAttemptRef.current++;

                    if (reconnectAttemptRef.current > MAX_RECONNECT_ATTEMPTS) {
                        logger.error('[SSE] Max reconnect attempts reached', { sessionId: sessionId.slice(0, 8) });
                        throw err;
                    }

                    logger.warn('[SSE] Connection error, will retry', {
                        sessionId: sessionId.slice(0, 8),
                        attempt: reconnectAttemptRef.current,
                        error: err instanceof Error ? err.message : String(err),
                    });

                    return RECONNECT_INTERVAL_MS;
                },

                onclose: () => {
                    if (mountedRef.current) {
                        setConnectionState('disconnected');
                    }
                },
            });
        } catch (err) {
            if (mountedRef.current) {
                setConnectionState('error');
                logger.error('[SSE] Fatal connection error', {
                    sessionId: sessionId?.slice(0, 8),
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }, [sessionId, getToken, dispatchStreamEvent]);

    useEffect(() => {
        mountedRef.current = true;
        sessionRef.current = sessionId;

        if (sessionId) {
            setSessionId(sessionId);
            connect();
        } else {
            if (abortRef.current) {
                abortRef.current.abort();
            }
            setConnectionState('disconnected');
        }

        return () => {
            mountedRef.current = false;
            sessionRef.current = null;
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [sessionId, connect, setSessionId]);

    const isConnected = connectionState === 'connected';
    const isConnecting = connectionState === 'connecting';

    return { isConnected, isConnecting, connectionState };
}
