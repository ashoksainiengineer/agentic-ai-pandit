'use client';

/**
 * 🔧 SSE Debug Panel — Dev-Only Floating Overlay
 * 
 * Shows real-time debugging info for the analysis page:
 * - Connection state (streaming/polling/error/idle)
 * - Last N SSE events with timestamps
 * - Current Zustand store snapshot (key fields)
 * - Quick actions (clear store, force error, etc.)
 * 
 * Only renders in development mode. Import conditionally.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamStore } from '@/lib/store/stream-store';
import { useShallow } from 'zustand/react/shallow';
import { logger } from '@/lib/secure-logger';

interface SSEEvent {
    id: number;
    type: string;
    timestamp: string;
    preview: string;
}

// Global event log — populated by monkey-patching dispatchStreamEvent
// Event log — populated via Zustand subscribe (no monkey-patching)
const eventLog: SSEEvent[] = [];
let eventCounter = 0;

function startEventCapture(): () => void {
    if (eventLog.length > 0) return () => {}; // Already capturing

    return useStreamStore.subscribe((state) => {
        eventCounter++;

        const previewParts: string[] = [];
        if (state.progress) {
            previewParts.push(`progress:${state.progress.percentage}% ${state.progress.message}`);
        }
        if (state.error) {
            previewParts.push(`error:${state.error}`);
        }
        if (state.isComplete) {
            previewParts.push('complete');
        }
        if (state.candidateScores.length > eventLog.length) {
            previewParts.push(`scores:${state.candidateScores.length}`);
        }

        if (previewParts.length === 0) return;

        eventLog.unshift({
            id: eventCounter,
            type: state.isComplete ? 'complete' : state.error ? 'error' : 'update',
            timestamp: new Date().toISOString().slice(11, 23),
            preview: previewParts.join(' | ').slice(0, 120),
        });

        if (eventLog.length > 50) eventLog.length = 50;
    });
}

export function SSEDebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'store' | 'actions'>('events');
    const [, setRefresh] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();

    const {
        sessionId, isComplete, error, progress, activeAIStage,
        candidateScores, connectionStatus, analyzedCount, totalCandidates,
        metadata
    } = useStreamStore(useShallow(state => ({
        sessionId: state.sessionId,
        isComplete: state.isComplete,
        error: state.error,
        progress: state.progress,
        activeAIStage: state.activeAIStage,
        candidateScores: state.candidateScores,
        connectionStatus: state.metadata?.status || 'unknown',
        analyzedCount: state.analyzedCount,
        totalCandidates: state.totalCandidates,
        metadata: state.metadata,
    })));

    useEffect(() => {
        const unsubscribe = startEventCapture();
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isOpen || activeTab !== 'events') return;

        intervalRef.current = setInterval(() => setRefresh(r => r + 1), 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };
    }, [isOpen, activeTab]);

    const handleClearStore = useCallback(() => {
        if (confirm('Clear Zustand store? This will reset all analysis state.')) {
            useStreamStore.getState().clearStore();
        }
    }, []);

    const handleForceError = useCallback(() => {
        useStreamStore.getState().forceError('Debug: Forced error from SSE Debug Panel');
    }, []);

    const copyStoreSnapshot = useCallback(() => {
        const state = useStreamStore.getState();
        const snapshot = {
            sessionId: state.sessionId,
            isComplete: state.isComplete,
            error: state.error,
            activeAIStage: state.activeAIStage,
            progress: state.progress,
            candidateScoresCount: state.candidateScores.length,
            candidatesByStageKeys: Object.keys(state.candidatesByStage),
            metadata: state.metadata,
            analyzedCount: state.analyzedCount,
            totalCandidates: state.totalCandidates,
            stageStats: state.stageStats,
            decisionsCount: state.decisions.length,
        };
        navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
        alert('Store snapshot copied to clipboard!');
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                    zIndex: 99999,
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: '#00d4ff',
                    border: '2px solid #00d4ff40',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
                    transition: 'all 0.2s',
                }}
                title="SSE Debug Panel"
            >
                🔧
            </button>
        );
    }

    const statusColor = isComplete ? '#22c55e' : error ? '#ef4444' : progress ? '#f59e0b' : '#6b7280';

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                zIndex: 99999,
                width: '420px',
                maxHeight: '600px',
                background: '#0f172a',
                color: '#e2e8f0',
                borderRadius: '12px',
                border: '1px solid #334155',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '8px 12px',
                background: '#1e293b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #334155',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: statusColor,
                        boxShadow: `0 0 8px ${statusColor}`,
                    }} />
                    <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>SSE DEBUG</span>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>
                        {sessionId?.slice(0, 8) || 'no-session'}
                    </span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        cursor: 'pointer', fontSize: '16px', padding: '0 4px',
                    }}
                >✕</button>
            </div>

            {/* Status Bar */}
            <div style={{
                padding: '6px 12px',
                background: '#1e293b80',
                display: 'flex',
                gap: '12px',
                fontSize: '10px',
                color: '#94a3b8',
                borderBottom: '1px solid #1e293b',
            }}>
                <span>Stage: <strong style={{ color: '#f59e0b' }}>{activeAIStage ?? '-'}</strong></span>
                <span>Step: <strong>{progress?.stepIndex ?? '-'}/{progress?.totalSteps ?? '-'}</strong></span>
                <span>Scores: <strong style={{ color: '#22d3ee' }}>{candidateScores.length}</strong></span>
                <span>Status: <strong>{connectionStatus}</strong></span>
                <span>{analyzedCount}/{totalCandidates}</span>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid #334155',
            }}>
                {(['events', 'store', 'actions'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '6px 0',
                            background: activeTab === tab ? '#334155' : 'transparent',
                            color: activeTab === tab ? '#f1f5f9' : '#64748b',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? 700 : 400,
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontFamily: 'inherit',
                        }}
                    >{tab}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', maxHeight: '380px' }}>
                {activeTab === 'events' && (
                    <div style={{ padding: '4px' }}>
                        {eventLog.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#475569' }}>
                                No SSE events yet. Waiting for stream...
                            </div>
                        ) : (
                            eventLog.slice(0, 30).map(evt => (
                                <div key={evt.id} style={{
                                    padding: '4px 8px',
                                    borderBottom: '1px solid #1e293b',
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-start',
                                }}>
                                    <span style={{ color: '#475569', minWidth: '65px', flexShrink: 0 }}>
                                        {evt.timestamp}
                                    </span>
                                    <span style={{
                                        color: evt.type === 'error' ? '#ef4444' :
                                            evt.type === 'progress' ? '#22d3ee' :
                                                evt.type === 'candidate_score' ? '#22c55e' :
                                                    evt.type === 'ai_thinking' ? '#a78bfa' :
                                                        '#f59e0b',
                                        fontWeight: 700,
                                        minWidth: '100px',
                                        flexShrink: 0,
                                    }}>
                                        {evt.type}
                                    </span>
                                    <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {evt.preview}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'store' && (
                    <div style={{ padding: '8px 12px' }}>
                        <pre style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            color: '#94a3b8',
                            lineHeight: '1.6',
                        }}>
                            {JSON.stringify({
                                sessionId,
                                isComplete,
                                error,
                                activeAIStage,
                                progressStep: progress?.stepIndex,
                                progressPct: progress?.percentage,
                                message: progress?.message?.slice(0, 80),
                                candidateScoresCount: candidateScores.length,
                                topScore: candidateScores[0]?.score,
                                topTime: candidateScores[0]?.time,
                                analyzedCount,
                                totalCandidates,
                                metadataStatus: metadata?.status,
                                metadataName: metadata?.fullName,
                            }, null, 2)}
                        </pre>
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={copyStoreSnapshot} style={actionBtnStyle}>
                            📋 Copy Store Snapshot
                        </button>
                        <button onClick={handleForceError} style={{ ...actionBtnStyle, borderColor: '#f59e0b40' }}>
                            ⚠️ Force Error State
                        </button>
                        <button onClick={handleClearStore} style={{ ...actionBtnStyle, borderColor: '#ef444440' }}>
                            🗑️ Clear Store (Reset)
                        </button>
                        <button
                        onClick={() => {
                                logger.info('📊 Full Stream Store State:', { ...useStreamStore.getState() });
                            }}
                            style={actionBtnStyle}
                        >
                            📊 Log Full State to Console
                        </button>
                        <button
                            onClick={() => {
                                eventLog.length = 0;
                                setRefresh(r => r + 1);
                            }}
                            style={actionBtnStyle}
                        >
                            🧹 Clear Event Log
                        </button>
                        <div style={{ marginTop: '8px', padding: '8px', background: '#1e293b', borderRadius: '6px', fontSize: '10px', color: '#64748b' }}>
                            <strong>Tips:</strong>
                            <ul style={{ margin: '4px 0 0 12px', padding: 0 }}>
                                <li>Install Redux DevTools extension for full state time-travel</li>
                                <li>Open Chrome DevTools → Network → Filter &quot;EventSource&quot; for SSE</li>
                                <li>Check Console tab for [DEBUG] prefixed logs</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const actionBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: '#1e293b',
    border: '1px solid #33415540',
    borderRadius: '6px',
    color: '#e2e8f0',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    fontSize: '11px',
};

export default SSEDebugPanel;
