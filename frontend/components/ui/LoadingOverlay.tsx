'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import '@/app/globals.css';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export const LoadingOverlay = memo(function LoadingOverlay({ isVisible, message = 'Processing...' }: LoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-prism-snow/60 backdrop-blur-md"
                >
                    <div className="relative flex flex-col items-center">
                        {/* Animated Background Glow */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute w-48 h-48 bg-prism-ink/10 rounded-full blur-3xl pointer-events-none"
                        />

                        <div className="relative bg-prism-snow border border-prism-pebble p-8 rounded-prism-xl shadow-prism-sm flex flex-col items-center gap-6 max-w-sm text-center">
                            {/* Prism Ornament */}
                            <div className="w-16 h-16 rounded-prism-lg bg-gradient-to-br from-prism-canvas to-prism-fog border border-prism-pebble flex items-center justify-center shadow-inner relative overflow-hidden">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#000000_0%,_transparent_70%)]"
                                />
                                <Loader2 className="w-8 h-8 text-prism-ink animate-spin" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-medium text-prism-ink font-prism flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 text-prism-graphite" />
                                    {message}
                                </h3>
                                <p className="text-sm text-prism-graphite font-prism">
                                    Navigating the divine alignment for you...
                                </p>
                            </div>

                            {/* Progress dots */}
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 1, 0.3],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                        className="w-2 h-2 rounded-full bg-prism-ink"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
