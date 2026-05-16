'use client';

import { XCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export function CancelConfirmation({ onConfirm, onAbort }: { onConfirm: () => void, onAbort: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-0 bottom-full mb-4 mx-4 p-6 rounded-2xl bg-black/90 border border-red-500/50 shadow-2xl backdrop-blur-xl z-50 text-center"
        >
            <div className="flex items-center justify-center gap-3 mb-4 text-red-400">
                <XCircle className="w-8 h-8" />
                <h3 className="text-lg font-medium">Cancel Analysis?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
                All current progress and intermediate mathematical solutions will be lost. This cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={onConfirm}
                    className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-red-900 border border-red-700 text-red-100 hover:bg-red-800 h-9 px-4 py-2 rounded-md w-32"
                >
                    Yes, Cancel
                </button>
                <button
                    onClick={onAbort}
                    className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 h-9 px-4 py-2 w-32 rounded-md"
                >
                    <Play className="w-4 h-4 mr-2" /> Keep Running
                </button>
            </div>
        </motion.div>
    );
}
