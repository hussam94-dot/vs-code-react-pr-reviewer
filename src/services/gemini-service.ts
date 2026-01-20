import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
        const prompt = `You are a Senior React.js Lead and Tech Architect.

Review the following React code for React-specific anti-patterns and issues.

**Critical Rules (return as "error"):**
1. **Hooks Violations:** Hooks called inside loops/conditions, missing useEffect dependencies
2. **Performance Issues:** Missing or incorrect key props in .map(), using index as key
3. **Props Mutation:** Direct mutation of props (anti-pattern)

**Best Practices (return as "warning"):**
4. **State Management:** Unnecessary useState for values derivable from props
5. **Component Size:** Components larger than 200 lines should be broken down
6. **Modern React:** Missing useCallback on props, class components that should be functional
7. **React 19 Features:** Opportunities to use useOptimistic or the new use() hook

**IMPORTANT:** Return ONLY a JSON object in this exact format:
\`\`\`json
{
  "summary": "Brief health assessment (e.g., 'High-risk due to multiple hook violations')",
  "diagnostics": [
    {
      "line": <line_number>,
      "message": "<detailed explanation>",
      "severity": "error" | "warning"
    }
  ]
}
\`\`\`

If no issues found, return: { "summary": "No issues found", "diagnostics": [] }

Code to review:
${code}
`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Error reviewing code:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            throw new Error(`Failed to review code with Gemini: ${errorMessage}`);
        }
    }
}
