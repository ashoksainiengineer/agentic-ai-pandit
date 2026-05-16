'use client';

import React, { memo, useRef, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Radio } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { highlightKeywords } from '@/lib/keyword-highlighter';

interface ReasoningContentProps {
    content: string;
    isActive: boolean;
    /** Incremental chunks for line-by-line terminal display */
    chunks?: string[];
    /** Dark terminal mode (default: true) */
    terminalMode?: boolean;
}

export const ReasoningContent = memo(function ReasoningContent({
    content,
    isActive,
    chunks,
    terminalMode = true,
}: ReasoningContentProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [visibleChunks, setVisibleChunks] = useState(0);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && isActive) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content, isActive, visibleChunks]);

    // Animate chunks line-by-line when streaming
    useEffect(() => {
        if (!chunks || chunks.length === 0) return;
        if (!isActive) {
            setVisibleChunks(chunks.length);
            return;
        }

        setVisibleChunks(0);
        const interval = setInterval(() => {
            setVisibleChunks(prev => {
                const next = Math.min(prev + 1, chunks.length);
                if (next >= chunks.length) clearInterval(interval);
                return next;
            });
        }, 30); // Fast line-by-line reveal

        return () => clearInterval(interval);
    }, [chunks, isActive]);

    const displayLines = useMemo(() => {
        if (chunks && chunks.length > 0 && visibleChunks < chunks.length) {
            // Show only the visible chunks during streaming
            return chunks.slice(0, visibleChunks + 1).map((chunk) => {
                const sanitized = sanitizeAIContent(chunk);
                return sanitized;
            });
        }

        // Full text fallback
        const sanitizedContent = sanitizeAIContent(content);
        const trimmedContent = sanitizedContent.length > 50000
            ? sanitizedContent.slice(-50000)
            : sanitizedContent;

        if (!trimmedContent.trim()) return [];

        return trimmedContent.split('\n').filter(line => line.trim().length > 0);
    }, [content, chunks, visibleChunks]);

    if (!content && (!chunks || chunks.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-[#1A1A1E]/5 flex items-center justify-center mb-4"
                >
                    <Brain className="w-8 h-8 text-[#1A1A1E]/40" />
                </motion.div>
                <p className="text-sm text-[#6B6560]">
                    Waiting for AI reasoning stream...
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A837D] animate-pulse" />
                    <span className="text-[9px] font-mono text-[#8A837D] uppercase tracking-wider">Idle</span>
                </div>
            </div>
        );
    }

    const bgClass = terminalMode
        ? 'bg-[#141416]'
        : 'bg-[#FAF8F5]';
    const textClass = terminalMode
        ? 'text-[#D4CFC9]'
        : 'text-[#1A1A1E]/60';
    const borderClass = terminalMode
        ? 'border-[#2C2C30]'
        : 'border-[rgba(0,0,0,0.06)]';

    return (
        <div className={`relative ${bgClass} border-t ${borderClass} overflow-hidden`}>
            {/* Scanline overlay */}
            {terminalMode && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                    }}
                />
            )}

            {/* LIVE indicator */}
            {isActive && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                    <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-[#C65D3B]/15 rounded-full border border-[#C65D3B]/30"
                    >
                        <Radio className="w-2.5 h-2.5 text-[#C65D3B]" />
                        <span className="text-[9px] font-medium text-[#C65D3B] uppercase tracking-wider">LIVE</span>
                    </motion.div>
                </div>
            )}

            {/* Terminal header bar */}
            {terminalMode && (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1E] border-b border-[#2C2C30] select-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    <span className="ml-3 text-[9px] font-mono text-[#8A837D] uppercase tracking-wider">
                        ai-pandit-reasoning-engine
                    </span>
                    {isActive && (
                        <span className="ml-auto text-[9px] font-mono text-[#C65D3B] animate-pulse">
                            streaming...
                        </span>
                    )}
                </div>
            )}

            {/* Content area */}
            <div
                ref={scrollRef}
                className={`
                    overflow-y-auto font-mono text-[13px] leading-7 style-scroll
                    ${terminalMode ? 'max-h-[420px] p-4' : 'max-h-[400px] p-5'}
                `}
            >
                <AnimatePresence initial={false}>
                    {displayLines.map((line, idx) => {
                        const isNew = isActive && (displayLines.length <= 3 || idx >= displayLines.length - 3);
                        const highlighted = highlightKeywords(line);

                        return (
                            <motion.div
                                key={`${idx}-${line.slice(0, 20)}`}
                                initial={isNew ? { opacity: 0, x: -4 } : false}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.12, ease: 'easeOut' }}
                                className="flex items-start group"
                            >
                                {/* Line number */}
                                <span className={`
                                    select-none shrink-0 w-7 text-right mr-3
                                    ${terminalMode ? 'text-[#3C3C42]' : 'text-[#C0BAB2]'}
                                    text-[10px] font-mono
                                `}>
                                    {String(idx + 1).padStart(2, ' ')}
                                </span>

                                {/* Content */}
                                <span className={`
                                    flex-1 whitespace-pre-wrap break-words
                                    ${textClass}
                                `}>
                                    {highlighted}
                                </span>
                            </motion.div>
                        );
                    })}

                    {/* Cursor blink */}
                    {isActive && displayLines.length > 0 && (
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'steps(1)' }}
                            className={`
                                inline-block w-1.5 h-4 align-middle -mb-0.5
                                ${terminalMode ? 'bg-[#C65D3B]' : 'bg-[#1A1A1E]'}
                            `}
                        >
                            {'\u258C'}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Empty state hint when content exists but no lines */}
                {displayLines.length === 0 && content && (
                    <p className={`text-sm italic ${terminalMode ? 'text-[#5C5A56]' : 'text-[#8A837D]'}`}>
                        {isActive ? 'Processing...' : 'Content loaded'}
                    </p>
                )}
            </div>
        </div>
    );
});

export default ReasoningContent;
