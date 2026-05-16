/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
    if (!input) return '';

    return input
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<[^>]+\s+on\w+\s*=/gi, (match) => match.replace(/on\w+\s*=/gi, ''));
}

/**
 * Truncates text safely for display
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength) + '...';
}

/**
 * Formats a Date object or ISO string to a human-readable format
 */
export function formatDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'N/A';
    }
}

/**
 * Extracts a clean verdict from AI analysis text
 */
export function cleanSummary(rawSummary: string | undefined): string {
    if (!rawSummary) {
        return 'The logical convergence of Dasha patterns and Divisional Chart markers strongly favors this specific time.';
    }

    // Try to extract a clean verdict line
    const verdictMatch = rawSummary.match(/(?:VERDICT|RECOMMENDATION|CONCLUSION)[:\s]*([^\n]{10,150})/i);
    if (verdictMatch) {
        return sanitizeHtml(verdictMatch[1].trim());
    }

    // Try to find a meaningful sentence
    const sentences = rawSummary.split(/[.!]/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
        const cleanSentence = sentences[0].trim().substring(0, 150);
        return sanitizeHtml(cleanSentence + (cleanSentence.length < sentences[0].trim().length ? '...' : '.'));
    }

    return sanitizeHtml(truncateText(rawSummary, 150));
}
