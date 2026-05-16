export interface StageConfig {
    id: number;
    name: string;
    shortName: string;
    description: string;
}

export const STAGES: StageConfig[] = [
    { id: 0, name: 'Initialization: Engine Setup', shortName: 'Init', description: 'Preparing analysis engine and loading birth data' },
    { id: 1, name: 'Rashi Grid Synthesis: Initial search space creation', shortName: 'Rashi', description: 'Initial search space creation via primary gravitational grids' },
    { id: 2, name: 'Amsha-Varga Elimination: The first primary filtering phase', shortName: 'Amsha', description: 'The first primary filtering phase using recursive Varga displacement' },
    { id: 3, name: 'Temporal Refinement: High-resolution time window search', shortName: 'Zoom', description: 'High-resolution time window search for potential candidates' },
    { id: 4, name: 'Divisional Analysis: Deep AI evaluation of sub-charts', shortName: 'Varga', description: 'Deep AI evaluation of sub-charts and lifecycle events' },
    { id: 5, name: 'Nadi-Amsha Convergence: 48-second window precision check', shortName: 'Nadi', description: '48-second window precision check across Shashtiamsha boundaries' },
    { id: 6, name: 'Prana-Dasha Verdict: Final alignment calculation', shortName: 'Prana', description: 'Final alignment calculation and astrological event synthesis' },
];
