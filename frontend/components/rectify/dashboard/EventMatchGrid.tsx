'use client';

import { useMemo } from 'react';
import { CheckCircle, Activity } from 'lucide-react';
import { AnalysisDetails, EventMatch } from './types';
import { THEME } from './theme';
import { sanitizeHtml } from './utils';

interface EventMatchGridProps {
    events?: EventMatch[];
    analysisDetails?: AnalysisDetails;
}

export function EventMatchGrid({
    events,
    analysisDetails
}: EventMatchGridProps) {
    const eventMatches = useMemo(() => {
        return analysisDetails?.eventMatches || events || [];
    }, [analysisDetails?.eventMatches, events]);

    if (!eventMatches || eventMatches.length === 0) {
        return (
            <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}>
                <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                    <CheckCircle className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                    Event Correlation Audit
                </h4>
                <div className="text-center text-sm italic py-8 bg-gold-50/10 rounded-lg border border-dashed border-gold-200/20" style={{ color: THEME.textSecondary }}>
                    No event correlations available yet.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                <CheckCircle className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                Event Correlation Audit
            </h4>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {eventMatches.map((evt, idx) => (
                    <div
                        key={evt.event || evt.name || evt.dasha || `event-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gold-50/20"
                        style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}80` }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center`}
                                style={{ backgroundColor: evt.match ? `${THEME.success}20` : '#F59E0B20' }}
                                aria-hidden="true"
                            >
                                {evt.match ? (
                                    <CheckCircle className="w-3.5 h-3.5" style={{ color: THEME.success }} />
                                ) : (
                                    <Activity className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                                )}
                            </div>
                            <span className="text-sm font-medium" style={{ color: THEME.textPrimary }}>
                                {sanitizeHtml(evt.event || evt.name || 'Unknown Event')}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono font-medium" style={{ color: THEME.gold }}>{evt.dasha || 'N/A'}</div>
                            <div
                                className="text-[9px] uppercase tracking-wider font-extrabold"
                                style={{ color: evt.match ? THEME.success : '#F59E0B' }}
                            >
                                {evt.match ? 'Strong Match' : 'Partial'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
