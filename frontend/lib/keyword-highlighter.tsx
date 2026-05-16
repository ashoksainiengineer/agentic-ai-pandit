import React, { ReactNode } from 'react';

// Planetary bodies
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Houses and signs
const HOUSES = [
    '1st house', '2nd house', '3rd house', '4th house', '5th house', '6th house',
    '7th house', '8th house', '9th house', '10th house', '11th house', '12th house',
    'ascendant', 'lagna', 'Ascendant', 'Lagna',
];

// Astrological terms — richer set
const YOGAS_AND_TERMS = [
    'Exalted', 'Debilitated', 'Retrograde', 'Combust', 'Own sign',
    'Raja Yoga', 'Dhana Yoga',
    'Mahadasha', 'Antardasha', 'Dasha', 'Bhukti',
    'Navamsa', 'D9', 'D10', 'D60', 'D1', 'D3', 'D7',
    'Vargottama Placement', 'Shashtiamsha Drift',
    'Pancha-Dasha Subdivisions', 'Nadi-Amsha Window',
    'Ephemeris Engine', 'KP Sub-lord', 'KP', 'Shadbala',
    'Vimshottari', 'Ashtakavarga', 'Bhav', 'Nakshatra',
    'Transit', 'transit', 'Gochar',
];

// Analysis keywords
const ANALYSIS_TERMS = [
    'Confidence', 'Score', 'Verdict', 'Promoted', 'Rejected',
    'Eliminated', 'Candidate', 'Batch',
    'Reasoning', 'Evidence', 'Analysis',
];

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const allTerms = [
    ...PLANETS,
    ...HOUSES,
    ...YOGAS_AND_TERMS,
    ...ANALYSIS_TERMS,
].map(escapeRegExp);

const MASTER_REGEX = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');

/**
 * Parses raw text and highlights astrological keywords by wrapping them in styled <span> elements.
 * Returns an array of ReactNodes.
 */
export function highlightKeywords(text: string): ReactNode[] {
    if (!text) return [];

    const parts = text.split(MASTER_REGEX);

    return parts.map((part, index) => {
        if (!part) return null;

        const lowerPart = part.toLowerCase();

        // Planets — warm coral
        if (PLANETS.some(p => p.toLowerCase() === lowerPart)) {
            return <span key={index} className="font-semibold" style={{ color: '#C65D3B' }}>{part}</span>;
        }
        // Houses — deep emerald
        if (HOUSES.some(h => h.toLowerCase() === lowerPart)) {
            return <span key={index} className="font-semibold" style={{ color: '#184131' }}>{part}</span>;
        }
        // Analysis terms — charcoal bold
        if (ANALYSIS_TERMS.some(a => a.toLowerCase() === lowerPart)) {
            return <span key={index} className="font-bold" style={{ color: '#1A1A1E' }}>{part}</span>;
        }
        // Yogas & technical terms — violet accent
        if (YOGAS_AND_TERMS.some(y => y.toLowerCase() === lowerPart)) {
            return <span key={index} className="font-semibold" style={{ color: '#7C3AED' }}>{part}</span>;
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}

/**
 * Enhanced highlight for terminal mode — includes score highlighting
 * Returns HTML string safe for dangerouslySetInnerHTML.
 */
export function highlightKeywordsHTML(text: string): string {
    if (!text) return '';

    let result = text;

    // Highlight scores like "87.3%" or "Score: 92"
    result = result.replace(
        /(\b\d{1,3}\.\d%|\bScore:\s*\d+)/g,
        '<span style="color:#C65D3B;font-weight:700">$1</span>'
    );

    // Highlight planets (case-insensitive)
    const planetRe = new RegExp(`\\b(${PLANETS.map(escapeRegExp).join('|')})\\b`, 'gi');
    result = result.replace(planetRe, '<span style="color:#D4745C;font-weight:600">$1</span>');

    // Highlight yoga & technical terms
    const termRe = new RegExp(`\\b(${YOGAS_AND_TERMS.map(escapeRegExp).join('|')})\\b`, 'gi');
    result = result.replace(termRe, '<span style="color:#7C3AED;font-weight:600">$1</span>');

    // Highlight analysis keywords
    const analysisRe = new RegExp(`\\b(${ANALYSIS_TERMS.map(escapeRegExp).join('|')})\\b`, 'gi');
    result = result.replace(analysisRe, '<span style="color:#E8A87C;font-weight:700">$1</span>');

    return result;
}
