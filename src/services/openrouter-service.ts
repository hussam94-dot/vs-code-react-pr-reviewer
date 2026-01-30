
export class OpenRouterService {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
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
