
export class OpenRouterService {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
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
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://github.com/vs-code-react-pr-reviewer", // Optional but good practice
                    "X-Title": "VS Code React PR Reviewer",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": this.model,
                    "messages": [
                        { "role": "user", "content": prompt }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.choices[0]?.message?.content;

            if (!content) {
                throw new Error("Received empty response from OpenRouter");
            }

            return content;
        } catch (error: any) {
            console.error('Error reviewing code with OpenRouter:', error);
            throw error;
        }
    }
}
