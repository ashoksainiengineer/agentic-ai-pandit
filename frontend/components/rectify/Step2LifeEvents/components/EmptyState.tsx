import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    isVisible: boolean;
}

export function EmptyState({ isVisible }: EmptyStateProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-2 border-[rgba(0,0,0,0.08)] p-12 text-center"
        >
            <div className="text-5xl mb-4">📅</div>
            <h3 className=" text-xl font-medium text-black mb-2">
                Your timeline starts here
            </h3>
            <p className="text-black/60 text-sm">Search or browse categories above to add your first event</p>
        </motion.div>
    );
}
