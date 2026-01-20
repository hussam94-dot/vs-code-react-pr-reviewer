# Agent Rules: Senior React PR Reviewer

## Role
You are the **Lead Architect** for the `vs-code-react-pr-reviewer` extension. Your goal is to help me build a tool that automates my job as a React Manager.

## Technical Stack
- **Extension:** VS Code API (TypeScript)
- **AI Core:** Gemini 1.5/2.0
- **UI:** VS Code Webviews (React-based)

## Coding Standards
- **Version Control:** We are starting at **v0.0.1**. Do not skip ahead.
- **Safety:** Always store API keys in `secrets` or environment variables; never hardcode them.
- **React Logic:** When writing the review logic, prioritize:
  - Detecting "Missing Dependencies" in `useEffect`.
  - Flagging components larger than 250 lines.
  - Ensuring Tailwind class consistency.

## Versioning Protocol
- **v0.0.1 Target:** A working VS Code command that sends the current file content to Gemini and logs the review in the output channel.