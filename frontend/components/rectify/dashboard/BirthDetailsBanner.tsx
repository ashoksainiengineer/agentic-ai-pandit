'use client';

import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin } from 'lucide-react';
import { BirthData } from './types';
import { THEME } from './theme';
import { formatDate, sanitizeHtml, truncateText } from './utils';

export function BirthDetailsBanner({ birthData }: { birthData: BirthData | null | undefined }) {
    if (!birthData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 mb-6 shadow-sm"
            style={{
                background: `linear-gradient(to right, ${THEME.surface}, #FDF9F3)`,
                border: `1px solid ${THEME.gold}20`
            }}
        >
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: `${THEME.gold}10` }}
                        aria-hidden="true"
                    >
                        <User className="w-5 h-5" style={{ color: THEME.gold }} />
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: THEME.textMuted }}>Subject</div>
                        <div className="text-sm font-medium" style={{ color: THEME.textPrimary }}>
                            {sanitizeHtml(truncateText(birthData.fullName, 50)) || 'N/A'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: '#8B5CF610' }}
                        aria-hidden="true"
                    >
                        <Calendar className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: THEME.textMuted }}>Date of Birth</div>
                        <div className="text-sm font-medium" style={{ color: THEME.textPrimary }}>{formatDate(birthData.dateOfBirth)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: '#3B82F610' }}
                        aria-hidden="true"
                    >
                        <Clock className="w-5 h-5" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: THEME.textMuted }}>Tentative Time</div>
                        <div className="text-sm font-medium" style={{ color: THEME.textPrimary }}>{birthData.tentativeTime || 'N/A'}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: '#10B98110' }}
                        aria-hidden="true"
                    >
                        <MapPin className="w-5 h-5" style={{ color: '#10B981' }} />
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: THEME.textMuted }}>Birth Place</div>
                        <div className="text-sm font-medium max-w-[200px] truncate" style={{ color: THEME.textPrimary }}>
                            {sanitizeHtml(truncateText(birthData.birthPlace, 100)) || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
