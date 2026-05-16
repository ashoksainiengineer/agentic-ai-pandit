import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap } from 'lucide-react';

interface ShuddhiProps {
    shuddhi: {
        kunda: { score: number; details: string };
        tatwa: { score: number; details: string };
    };
}

export const VedicShuddhiRadar: React.FC<ShuddhiProps> = ({ shuddhi }) => {
    return (
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-black" />
            </div>

            <h4 className="text-black font-medium mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-black" />
                Divine Purification (Shuddhi)
            </h4>

            <div className="space-y-6">
                {/* Kunda Shuddhi Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-black/60 uppercase font-mono">Kunda (Lunar-Asc) Alignment</span>
                        <span className="text-black font-medium">{shuddhi.kunda.score}%</span>
                    </div>
                    <div className="h-2 bg-[var(--prism-canvas)] rounded-full overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shuddhi.kunda.score}%` }}
                            className="h-full bg-gradient-to-r from-[#000000]/40 to-[#000000]"
                        />
                    </div>
                    <p className="text-[10px] text-black/60 mt-2 font-mono italic">
                        {shuddhi.kunda.details}
                    </p>
                </div>

                {/* Tatwa Shuddhi Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-black/60 uppercase font-mono">Tatwa (Elemental Path)</span>
                        <span className="text-black font-medium">{shuddhi.tatwa.score}%</span>
                    </div>
                    <div className="h-2 bg-[var(--prism-canvas)] rounded-full overflow-hidden border border-[rgba(0,0,0,0.08)]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shuddhi.tatwa.score}%` }}
                            className="h-full bg-gradient-to-r from-[#000000]/40 to-[#000000]"
                        />
                    </div>
                    <p className="text-[10px] text-black/60 mt-2 font-mono italic">
                        {shuddhi.tatwa.details}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.08)]/50">
                <div className="text-[10px] text-black/60 leading-relaxed">
                    The universe exists in 90-minute Tatwa cycles relative to Dinamaana (Day-Length). This candidate aligns perfectly with your physical manifestation.
                </div>
            </div>
        </div>
    );
};
