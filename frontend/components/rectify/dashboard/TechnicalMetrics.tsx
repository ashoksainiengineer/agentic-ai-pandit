'use client';

import { motion } from 'framer-motion';
import { Activity, Gauge, BarChart3 } from 'lucide-react';
import { THEME } from './theme';

interface TechnicalMetricsProps {
    accuracy: number;
    confidence: string;
    marginOfError?: number;
}

export function TechnicalMetrics({ accuracy, confidence, marginOfError = 3 }: TechnicalMetricsProps) {
    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: THEME.textPrimary }}>
                <Gauge className="w-4 h-4" style={{ color: THEME.gold }} aria-hidden="true" />
                Technical Precision Audit
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Confidence</div>
                    <div className="text-xl font-medium flex items-center gap-2" style={{ color: THEME.gold }}>
                        <Activity className="w-4 h-4" />
                        {accuracy}%
                    </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Reliability</div>
                    <div className="text-xl font-medium flex items-center gap-2" style={{ color: THEME.success }}>
                        <BarChart3 className="w-4 h-4" />
                        {confidence.toUpperCase()}
                    </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.textMuted }}>Margin of Error</div>
                    <div className="text-xl font-medium" style={{ color: THEME.textPrimary }}>
                        ±{marginOfError}s
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex justify-between text-[10px] uppercase tracking-wider mb-2" style={{ color: THEME.textMuted }}>
                    <span>Statistical Probability</span>
                    <span style={{ color: THEME.gold }}>High Convergence</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${THEME.border}50` }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(to right, ${THEME.gold}, ${THEME.goldLight})`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
