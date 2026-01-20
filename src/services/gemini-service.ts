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
        const prompt = `
        You are a Senior React Manager and Tech Lead.
        Review the following React code for:
        1. Hooks Optimization: Identify unnecessary re-renders and missing dependencies.
        2. Component Architecture: checks for DRY principles and proper structure.
        3. Type Safety: Ensure robust TypeScript usage.
        
        Provide concise, actionable feedback. Use bullet points.
        
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
