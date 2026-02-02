/**
 * Utility to parse AI response and extract diagnostic information
 */

export interface DiagnosticItem {
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface OverallQuality {
    score: number;
    maintainability: 'poor' | 'fair' | 'good' | 'excellent';
    complexity: 'low' | 'medium' | 'high';
}

export interface AIReviewResponse {
    diagnostics: DiagnosticItem[];
    summary?: string;
    overall_quality?: OverallQuality;
    strengths?: string[];
    improvements?: string[];
}

/**
 * Extracts JSON from Gemini's response which may be wrapped in markdown code blocks
 */
export function parseAIResponse(text: string): AIReviewResponse {
    try {
        // Try to find JSON in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            return normalizeResponse(parsed);
        }

        // Try to parse as plain JSON
        const parsed = JSON.parse(text);
        return normalizeResponse(parsed);

    } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        return { diagnostics: [] };
    }
}

function normalizeResponse(parsed: any): AIReviewResponse {
    const diagnostics = (parsed.diagnostics && Array.isArray(parsed.diagnostics))
        ? validateDiagnostics(parsed.diagnostics)
        : (Array.isArray(parsed) ? validateDiagnostics(parsed) : []);

    return {
        diagnostics,
        summary: parsed.summary,
        overall_quality: parsed.overall_quality,
        strengths: parsed.strengths,
        improvements: parsed.improvements
    };
}


/**
 * Validates and filters diagnostic items
 */
function validateDiagnostics(data: any): DiagnosticItem[] {
    if (!Array.isArray(data)) {
        return [];
    }

    return data.filter(isDiagnosticItem);
}

/**
 * Type guard for DiagnosticItem
 */
function isDiagnosticItem(item: any): item is DiagnosticItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.line === 'number' &&
        item.line > 0 &&
        typeof item.message === 'string' &&
        item.message.length > 0 &&
        (item.severity === 'error' || item.severity === 'warning' || item.severity === 'info')
    );
}
