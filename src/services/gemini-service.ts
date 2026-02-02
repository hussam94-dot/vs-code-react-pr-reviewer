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
        const prompt = `You are an expert code reviewer with deep knowledge of software engineering best practices, design patterns, and common vulnerabilities across multiple programming languages.

Your task is to analyze code and provide structured, actionable feedback in JSON format.

ALWAYS respond with valid JSON following this exact structure:
{
  "summary": "Brief 1-2 sentence overview of code quality",
  "diagnostics": [
    {
      "line": <line_number>,
      "message": "<clear description of the issue>",
      "severity": "error" | "warning" | "info",
      "category": "<category_name>",
      "suggestion": "<how to fix it>",
      "code_snippet": "<problematic code excerpt>"
    }
  ],
  "overall_quality": {
    "score": <1-10>,
    "maintainability": "poor" | "fair" | "good" | "excellent",
    "complexity": "low" | "medium" | "high"
  },
  "strengths": ["positive aspect 1", "positive aspect 2"],
  "improvements": ["suggestion 1", "suggestion 2"]
}

Severity levels:
- error: Critical issues that will cause bugs or security vulnerabilities
- warning: Issues that should be addressed but won't break functionality
- info: Suggestions for improvement or best practices

Categories:
- Security
- Performance
- Best Practices
- Bug Risk
- Code Smell
- Maintainability
- Testing
- Documentation

Code:
${code}`;

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
