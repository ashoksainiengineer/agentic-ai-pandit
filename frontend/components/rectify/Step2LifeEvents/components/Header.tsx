import React from 'react';
import { motion } from 'framer-motion';

export function Header() {
    return (
        <>
            {/* Header - Centered */}
            <div className="text-center my-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffffff] to-white border border-[rgba(0,0,0,0.08)] rounded-full text-xs mb-6 shadow-sm"
                >
                    <span className="text-black font-medium tracking-wider">STEP 2 OF 3</span>
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-medium text-black leading-tight mb-2">
                    Life <span className="text-black">Events</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-black/60">
                    Add events for birth time rectification
                </motion.p>
            </div>
        </>
    );
}
