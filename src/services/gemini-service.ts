import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.2
            }
        });
    }

    async testApiKey(): Promise<boolean> {
        try {
            const result = await this.model.generateContent("Hello, respond with 'OK'");
            const response = await result.response;
            const text = response.text();
            return text.length > 0;
        } catch (error: any) {
            console.error('API Key test failed:', error);
            throw error;
        }
    }

    async reviewCode(code: string): Promise<string> {
        const prompt = `Review this React code/diff for critical issues. JSON only.

Rules:
1. Loops/Conditions: No hooks inside.
2. Keys: Must use stable IDs in maps.
3. Props: No direct mutation.
4. State: No redundant state.

Format:
{
  "summary": "Brief status",
  "diagnostics": [
    { "line": <num>, "message": "<str>", "severity": "error"|"warning" }
  ]
}

Code:
${code}
`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Error reviewing code:', error);

            // Handle Rate Limits (429) & Overload (503)
            if (error.message?.includes('429') || error.message?.includes('503')) {
                throw new Error('QUOTA_FULL');
            }

            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            throw new Error(`Gemini Error: ${errorMessage}`);
        }
    }
}
