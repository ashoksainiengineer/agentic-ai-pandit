'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { THEME } from './theme';
import { sanitizeHtml, truncateText } from './utils';

import { AnalysisDetails } from './types';

interface FormattedAIReasoningProps {
    reasoningLogs?: string | AnalysisDetails;
    analysisDetails?: AnalysisDetails;
}

export function FormattedAIReasoning({
    reasoningLogs,
    analysisDetails
}: FormattedAIReasoningProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const rawText = useMemo(() => {
        if (!reasoningLogs) return analysisDetails?.finalCandidate?.thinking || analysisDetails?.aiAnalysis || '';

        // Case 1: Standard string reasoning
        if (typeof reasoningLogs === 'string') {
            // Check if it's actually JSON
            if (reasoningLogs.startsWith('{') || reasoningLogs.startsWith('[')) {
                try {
                    const parsed = JSON.parse(reasoningLogs);
                    return formatStructuredLogsForDisplay(parsed);
                } catch {
                    return reasoningLogs;
                }
            }
            return reasoningLogs;
        }

        // Case 2: Structured object (stageHistory or similar)
        return formatStructuredLogsForDisplay(reasoningLogs);
    }, [reasoningLogs, analysisDetails]);

    // Helper to extract text from structured stage history
    function formatStructuredLogsForDisplay(data: Record<string, unknown>): string {
        if (!data) return '';

        // If it's the finalCandidate/AnalysisDetails object itself
        if ((data.finalCandidate as Record<string, unknown>)?.thinking) return (data.finalCandidate as Record<string, unknown>).thinking as string;

        // If it's stageHistory { [key: number]: string }
        if (typeof data === 'object' && !Array.isArray(data)) {
            const stages = Object.keys(data).map(Number).sort((a, b) => a - b);
            if (stages.length > 0) {
                return stages.map(s => {
                    const stageText = data[s];
                    if (typeof stageText === 'string') {
                        // If it's just one stage, don't add header to avoid redundancy
                        if (stages.length === 1) return stageText;
                        return `--- STAGE ${s} ---\n${stageText}`;
                    }
                    return '';
                }).join('\n\n');
            }
        }

        return typeof data === 'string' ? data : JSON.stringify(data);
    }

    const displayText = useMemo(() => {
        return isExpanded ? rawText : truncateText(rawText, 1000);
    }, [rawText, isExpanded]);

    const formattedSections = useMemo(() => {
        if (!displayText) return [];
        const sections = displayText.split(/\n(?=(?:DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL))/gi);

        return sections.map((section, idx) => {
            const lines = section.split('\n');
            const firstLine = lines[0];
            const isHeader = /^(DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL)/i.test(firstLine);

            if (isHeader) {
                const [header, ...rest] = lines;
                return {
                    type: 'header' as const,
                    header: sanitizeHtml(header.split(':')[0]),
                    content: sanitizeHtml(rest.join('\n')),
                    key: idx,
                };
            }

            return {
                type: 'text' as const,
                content: sanitizeHtml(section),
                key: idx,
            };
        });
    }, [displayText]);

    if (!rawText) {
        return (
            <div className="text-center italic py-10" style={{ color: THEME.textMuted }}>
                [AI Reasoning data not available for this session]
            </div>
        );
    }

    return (
        <div
            className="rounded-xl p-6 transition-all hover:shadow-lg"
            style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}` }}
        >
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                    <Sparkles className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                    AI Reasoning Transcript
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-50" style={{ color: THEME.textMuted }}>
                        {rawText.length.toLocaleString()} chars
                    </span>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded bg-gold-50/20 hover:bg-gold-50/50"
                        style={{ color: THEME.gold }}
                    >
                        {isExpanded ? 'Show Less' : 'Full Log'}
                    </button>
                </div>
            </div>

            <div className={`max-h-[400px] overflow-y-auto custom-scrollbar pr-2 transition-all`}>
                {formattedSections.map((section) => {
                    if (section.type === 'header') {
                        return (
                            <div key={section.key} className="mb-4">
                                <div
                                    className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded mb-1.5 shadow-sm"
                                    style={{
                                        backgroundColor: `${THEME.gold}10`,
                                        color: THEME.gold,
                                        border: `1px solid ${THEME.gold}20`
                                    }}
                                >
                                    {section.header}
                                </div>
                                <p
                                    className="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                                    style={{ color: THEME.textSecondary }}
                                >
                                    {section.content}
                                </p>
                            </div>
                        );
                    }
                    return (
                        <p
                            key={section.key}
                            className="text-sm leading-relaxed mb-4 whitespace-pre-wrap opacity-90"
                            style={{ color: THEME.textSecondary }}
                        >
                            {section.content}
                        </p>
                    );
                })}
            </div>
        </div>
    );
}
