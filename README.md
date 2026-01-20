# VS Code React PR Reviewer (AI-Powered)
**Version:** v0.0.1  
**Author:** React Team Manager  
**Repository:** git@github:tsrajandavid/vs-code-react-pr-reviewer.git

---

## 🚀 Overview
This extension is designed for React Team Managers to streamline Pull Request reviews. It leverages **Antigravity** and **Gemini 1.5/2.0** to provide architectural feedback, catch performance bottlenecks, and ensure team coding standards are met directly within VS Code.

## 🏗️ Versioning Roadmap

### [v0.0.1] - The Foundation (Current)
- [ ] Scaffold VS Code Extension project (TypeScript).
- [ ] Implement Gemini API Integration.
- [ ] Create a basic command `ReactReview: Audit File` to send code to AI.
- [ ] Setup Senior Manager "System Prompt" for AI responses.

### [v0.0.2] - Context Awareness
- [ ] Integration with `git diff` to review only changed lines.
- [ ] Support for React 19 specific rules (Hooks, Actions).
- [ ] Display AI feedback in the VS Code "Problems" tab.

### [v0.0.3] - Manager Dashboard
- [ ] Webview UI for PR summary (Complexity scores, suggested fixes).
- [ ] Custom "Team Style Guide" injection into AI context.

---

## 🤖 AI Prompt Logic (Antigravity Integration)
The extension uses a specialized **Senior React Manager** persona. The agent is instructed to focus on:
1. **Hooks Optimization:** Identifying unnecessary re-renders.
2. **Component Architecture:** Enforcing DRY principles and proper file structure.
3. **Type Safety:** Ensuring robust TypeScript interfaces.

---

## 🛠️ Setup for Antigravity
To work on this project with the Antigravity agent, initialize the agent with the following context:

> "Agent, we are building a VS Code extension in this repo. We are currently at v0.0.1. 
> Your first task is to scaffold the extension and set up the connection to Gemini. 
> Refer to the `src/extension.ts` for logic. Always follow the Senior React Manager persona."

---

## 📦 Installation (Development)
1. Clone the repo: `git clone git@github.com:tsrajandavid/vs-code-react-pr-reviewer.git`
2. Install dependencies: `npm install`
3. Launch Debugger: Press `F5` to open the Extension Development Host.