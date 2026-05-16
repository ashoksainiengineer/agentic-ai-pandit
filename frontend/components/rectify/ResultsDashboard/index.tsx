'use client';

import React from 'react';
import { ResultsDashboardProps } from '../dashboard/types';
import { THEME } from '../dashboard/theme';
import { BirthDetailsBanner } from '../dashboard/BirthDetailsBanner';
import { ResultsErrorBoundary } from './components/ResultsErrorBoundary';
import { ActionNav } from './components/ActionNav';
import { LeftMetricsColumn } from './components/LeftMetricsColumn';
import { TabPanels } from './components/TabPanels';
import { useResultsDashboard } from './hooks/useResultsDashboard';

function ResultsDashboardContent(props: ResultsDashboardProps) {
    const engine = useResultsDashboard(props);

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: THEME.bg, color: THEME.textPrimary }}>
            {engine.error && (
                <div className="max-w-7xl mx-auto px-6 mt-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {engine.error}
                    </div>
                </div>
            )}
            <ActionNav
                sessionId={props.sessionId}
                isCloning={engine.isCloning}
                hasCopied={engine.hasCopied}
                isGenerating={engine.isGenerating}
                handleClone={engine.handleClone}
                copyShareLink={engine.copyShareLink}
                exportJSON={engine.exportJSON}
                generatePDF={engine.generatePDF}
            />

            {/* Birth Details Banner */}
            <div className="max-w-7xl mx-auto px-6 mt-6">
                <BirthDetailsBanner birthData={props.birthData} />
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <LeftMetricsColumn data={props.data} analysisDetails={engine.analysisDetails} />

                {/* Right Column: Detailed Analysis Tabs */}
                <div className="lg:col-span-8 flex flex-col h-full">
                    {/* Navigation Tabs */}
                    <div
                        className="flex border-b mb-6 space-x-4 overflow-x-auto"
                        style={{ borderColor: THEME.border }}
                        role="tablist"
                    >
                        {(['summary', 'comparison', 'audit'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => engine.setActiveTab(tab)}
                                className={`pb-4 px-2 text-sm font-medium uppercase tracking-wider transition-colors whitespace-nowrap ${engine.activeTab === tab
                                    ? 'border-b-2'
                                    : 'hover:text-black'
                                    }`}
                                style={{
                                    color: engine.activeTab === tab ? THEME.gold : THEME.textMuted,
                                    borderColor: engine.activeTab === tab ? THEME.gold : 'transparent'
                                }}
                                role="tab"
                                aria-selected={engine.activeTab === tab}
                                aria-controls={`${tab}-panel`}
                            >
                                {tab === 'summary' && 'Executive Summary'}
                                {tab === 'comparison' && 'Candidate Comparison'}
                                {tab === 'audit' && 'Deep Audit'}
                            </button>
                        ))}
                    </div>

                    <TabPanels
                        activeTab={engine.activeTab}
                        data={props.data}
                        analysisDetails={engine.analysisDetails}
                        topCandidates={engine.topCandidates}
                    />
                </div>
            </div>
        </div>
    );
}

export default function ResultsDashboard(props: ResultsDashboardProps) {
    return (
        <ResultsErrorBoundary>
            <ResultsDashboardContent {...props} />
        </ResultsErrorBoundary>
    );
}
