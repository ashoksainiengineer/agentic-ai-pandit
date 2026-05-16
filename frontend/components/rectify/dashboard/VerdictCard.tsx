'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { THEME } from './theme';

interface VerdictCardProps {
    rectifiedTime: string;
    accuracy: number;
}

export function VerdictCard({ rectifiedTime, accuracy }: VerdictCardProps) {
    return (
        <div
            className="rounded-xl p-8 text-center relative overflow-hidden group shadow-lg transition-all hover:shadow-2xl"
            style={{
                backgroundColor: THEME.surface,
                border: `2px solid ${THEME.gold}`,
                boxShadow: `0 0 30px ${THEME.gold}10`
            }}
        >
            <div
                className="absolute top-0 left-0 w-full h-1 opacity-50"
                style={{ background: `linear-gradient(to right, transparent, ${THEME.gold}, transparent)` }}
            />

            <h3
                className="uppercase tracking-[0.2em] text-xs mb-4 font-mono"
                style={{ color: THEME.textMuted }}
            >
                Rectified Birth Time
            </h3>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-6xl font-black font-mono tracking-tighter mb-4"
                style={{ color: THEME.gold }}
            >
                {rectifiedTime}
            </motion.div>
            <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mb-3"
                style={{
                    backgroundColor: `${THEME.gold}10`,
                    border: `1px solid ${THEME.gold}50`,
                    color: THEME.gold
                }}
            >
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                Confidence: {accuracy}%
            </div>
            {accuracy > 90 && (
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mt-2"
                    style={{ color: THEME.gold }}
                >
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    🔱 God-Tier Precision
                </motion.div>
            )}
        </div>
    );
}
