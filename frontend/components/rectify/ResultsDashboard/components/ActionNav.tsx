import React from 'react';
import Link from 'next/link';
import { CopyPlus, CheckCircle, Copy, ExternalLink, Download } from 'lucide-react';
import { THEME } from '../../dashboard/theme';

interface ActionNavProps {
    sessionId: string;
    isCloning: boolean;
    hasCopied: boolean;
    isGenerating: boolean;
    handleClone: () => void;
    copyShareLink: () => void;
    exportJSON: () => void;
    generatePDF: () => void;
}

export function ActionNav({
    sessionId: _sessionId,
    isCloning,
    hasCopied,
    isGenerating,
    handleClone,
    copyShareLink,
    exportJSON,
    generatePDF
}: ActionNavProps) {
    return (
        <nav
            className="sticky top-0 z-50 backdrop-blur-xl border-b"
            style={{ backgroundColor: `${THEME.bg}90`, borderColor: `${THEME.gold}10` }}
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <span
                            className="font-medium text-xl tracking-tight"
                            style={{ color: THEME.gold }}
                        >
                            AI Pandit
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium transition-colors hover:text-black"
                            style={{ color: THEME.textSecondary }}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/rectify?new=true"
                            className="text-sm font-medium transition-colors hover:text-black"
                            style={{ color: THEME.textSecondary }}
                        >
                            New Analysis
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClone}
                        disabled={isCloning}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:shadow-md disabled:opacity-50"
                        style={{
                            backgroundColor: `${THEME.gold}10`,
                            border: `1px solid ${THEME.gold}50`,
                            color: THEME.gold
                        }}
                        aria-label="Duplicate and edit this analysis"
                    >
                        {isCloning ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#000000] border-t-transparent" aria-hidden="true" />
                        ) : (
                            <CopyPlus className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">Duplicate & Edit</span>
                    </button>

                    <button
                        onClick={copyShareLink}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:shadow-md"
                        style={{
                            backgroundColor: THEME.surface,
                            border: `1px solid ${THEME.border}`,
                            color: THEME.textSecondary
                        }}
                        aria-label={hasCopied ? 'Link copied' : 'Copy share link'}
                    >
                        {hasCopied ? (
                            <CheckCircle className="w-4 h-4" style={{ color: THEME.success }} aria-hidden="true" />
                        ) : (
                            <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">{hasCopied ? 'Copied!' : 'Share'}</span>
                    </button>

                    <button
                        onClick={exportJSON}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:shadow-md"
                        style={{
                            backgroundColor: THEME.surface,
                            border: `1px solid ${THEME.border}`,
                            color: THEME.textSecondary
                        }}
                        aria-label="Export as JSON"
                    >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">JSON</span>
                    </button>

                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg"
                        style={{
                            background: `linear-gradient(to right, ${THEME.gold}, ${THEME.goldLight})`,
                            color: 'white',
                            boxShadow: `0 4px 14px ${THEME.gold}20`
                        }}
                        aria-label="Download PDF report"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" aria-hidden="true" />
                        ) : (
                            <Download className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="hidden xs:inline">PDF</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
