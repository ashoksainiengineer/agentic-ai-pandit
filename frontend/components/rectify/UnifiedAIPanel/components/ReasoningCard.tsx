import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { sanitizeAIContent } from '@/lib/xss-sanitizer';
import { highlightKeywords } from '@/lib/keyword-highlighter';

export const ReasoningCard = memo(function ReasoningCard({
    title,
    content,
    isLive,
    onClick,
    startedAt,
    updatedAt,
    score,
    isWinner,
}: {
    title: string;
    content: string;
    isLive: boolean;
    onClick: () => void;
    batchIndex: number;
    startedAt?: number;
    updatedAt?: number;
    score?: number;
    isWinner?: boolean;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [elapsed, setElapsed] = useState(0);
    const highlightedContent = useMemo(() => {
        const sanitized = sanitizeAIContent(content);
        return highlightKeywords(sanitized);
    }, [content]);

    // Auto-scroll when live
    useEffect(() => {
        if (scrollRef.current && isLive) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content, isLive]);

    // Timer logic
    useEffect(() => {
        if (!startedAt) return;
        if (isLive) {
            setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
            const interval = setInterval(() => {
                setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            const end = updatedAt || Date.now();
            setElapsed(Math.max(0, Math.floor((end - startedAt) / 1000)));
        }
    }, [isLive, startedAt, updatedAt]);

    return (
        <div
            onClick={onClick}
            style={{ contain: 'strict' }}
            className={`
        relative p-3 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col h-[180px]
        ${isWinner
                    ? 'bg-[#FFFCF9] border-[#C65D3B]/40 ring-1 ring-[#C65D3B]/20 shadow-[0_0_20px_rgba(198,93,59,0.12)]'
                    : isLive
                        ? 'bg-[#FFFCF9] border-[#C65D3B]/30 shadow-sm ring-1 ring-[#C65D3B]/15'
                        : 'bg-white border-[rgba(0,0,0,0.06)] hover:border-[#C65D3B]/40 hover:shadow-sm'
                }
      `}
        >
            {/* Score Bar */}
            {score !== undefined && score > 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-lg">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        className={`h-full ${score >= 85 ? 'bg-[#184131]' :
                            score >= 70 ? 'bg-[#C65D3B]' :
                                'bg-[#6B6560]'
                            }`}
                    />
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#C65D3B] animate-pulse' : 'bg-[#6B6560]/30'}`} />
                    <span className="text-[10px] font-mono text-black/60 truncate max-w-[100px]">
                        {title}
                    </span>
                </div>
                {isLive && (
                    <span className="text-[8px] font-medium text-[#C65D3B] bg-[#C65D3B]/[0.08] px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                        <Radio className="w-2 h-2 animate-pulse" /> Live
                    </span>
                )}
            </div>

            {/* Content — TRUNCATED preview only */}
            <div
                ref={scrollRef}
                className="text-[10px] text-black/60 leading-relaxed font-mono overflow-y-auto flex-grow relative"
            >
                {!content ? (
                    <span className="text-stone-400 italic text-[9px]">Evaluating...</span>
                ) : (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-black/60 leading-relaxed">
                        {highlightedContent}
                        {isLive && (
                            <span className="inline-block w-1 h-3 bg-[#000000] animate-pulse ml-0.5 align-middle" />
                        )}
                    </pre>
                )}
                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* Footer */}
            <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {elapsed > 0 && (
                        <span className="text-[9px] text-[#6B6560] font-mono flex items-center gap-1">
                            {elapsed}s
                        </span>
                    )}
                    <span className="text-[8px] text-stone-400 font-mono">
                        {content.length > 0 ? `${(content.length / 1000).toFixed(1)}k` : '0'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {isWinner && (
                        <span className="text-[9px] font-black text-[#184131] flex items-center gap-0.5">
                        MATCH
                        </span>
                    )}
                    <span className="text-[8px] font-medium text-black">
                        View →
                    </span>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.content === next.content &&
        prev.isLive === next.isLive &&
        prev.title === next.title &&
        prev.score === next.score &&
        prev.isWinner === next.isWinner
    );
});
