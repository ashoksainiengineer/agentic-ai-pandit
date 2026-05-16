import React from 'react';
import { Award } from 'lucide-react';
import { THEME } from '../../dashboard/theme';
import { AnalysisDetails } from '../../dashboard/types';

interface ScoreAuditTableProps {
    analysisDetails: AnalysisDetails | null;
}

export function ScoreAuditTable({ analysisDetails }: ScoreAuditTableProps) {
    if (!analysisDetails?.finalCandidate?.methodScores) return null;

    const scores = analysisDetails.finalCandidate.methodScores;
    const entries = Object.entries(scores);

    if (entries.length === 0) return null;

    return (
        <div
            className="rounded-xl p-6 shadow-sm mt-6"
            style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
            <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                <Award className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                Verification Audit
            </h4>
            <div
                className="rounded-lg p-4 font-mono text-sm"
                style={{ backgroundColor: THEME.bg, border: `1px solid ${THEME.border}` }}
            >
                <table className="w-full text-left">
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                            <th className="py-2" style={{ color: THEME.textMuted }}>Methodology</th>
                            <th className="py-2 text-right" style={{ color: THEME.textMuted }}>Score Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([key, val]) => (
                            <tr
                                key={key}
                                style={{ borderBottom: `1px solid ${THEME.border}80` }}
                                className="last:border-0 hover:bg-white/50"
                            >
                                <td className="py-2 capitalize" style={{ color: THEME.textPrimary }}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="py-2 text-right font-medium" style={{ color: THEME.gold }}>+{val as number}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
