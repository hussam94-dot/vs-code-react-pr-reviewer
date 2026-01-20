/**
 * Utility to parse AI response and extract diagnostic information
 */

export interface DiagnosticItem {
    line: number;
    message: string;
    severity: 'error' | 'warning';
}

export interface AIReviewResponse {
    diagnostics: DiagnosticItem[];
    summary?: string;
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

            // Check if it's an object with diagnostics array
            if (parsed.diagnostics && Array.isArray(parsed.diagnostics)) {
                return {
                    diagnostics: validateDiagnostics(parsed.diagnostics),
                    summary: parsed.summary
                };
            }

            // Otherwise assume it's just the diagnostics array
            return { diagnostics: validateDiagnostics(parsed) };
        }

        // Try to parse as plain JSON
        const parsed = JSON.parse(text);

        if (parsed.diagnostics && Array.isArray(parsed.diagnostics)) {
            return {
                diagnostics: validateDiagnostics(parsed.diagnostics),
                summary: parsed.summary
            };
        }

        return { diagnostics: validateDiagnostics(parsed) };
    } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        return { diagnostics: [] };
    }
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
        (item.severity === 'error' || item.severity === 'warning')
    );
}
