# VS Code React PR Reviewer (AI-Powered)
**Version:** v0.0.10
**Author:** React Team Manager  
**Repository:** git@github:tsrajandavid/vs-code-react-pr-reviewer.git

---

## 🚀 Overview
This extension is designed for React Team Managers to streamline Pull Request reviews. It leverages **OpenRouter** and **Gemini 1.5/2.0** to provide architectural feedback, catch performance bottlenecks, and ensure team coding standards are met directly within VS Code.

## 🏗️ Versioning Roadmap

### [v0.0.10] - Rich Review UI (Current)
- [x] Scaffold VS Code Extension project (TypeScript).
- [x] Implement Gemini & OpenRouter API Integration.
- [x] Create a basic command `ReactReview: Audit File`.
- [x] Integration with `git diff`.
- [x] **Rich Webview UI** for Code Review Results (Scores, Metrics, Charts).

---

## 🛠️ Build & Development

### Prerequisites
- Node.js (v18+)
- VS Code

### 1. Setup
```bash
git clone git@github.com:tsrajandavid/vs-code-react-pr-reviewer.git
cd vs-code-react-pr-reviewer
npm install
```

### 2. Development (Run Locally)
- Press `F5` in VS Code to launch the **Extension Development Host**.
- OR run the watch command for hot-reloading:
```bash
npm run watch
```

### 3. Build & Compile
To compile the TypeScript source code:
```bash
npm run compile
```

### 4. Package Extension (.vsix)
To create a distributable `.vsix` file:
```bash
npx vsce package
```
*Output: `vs-code-react-pr-reviewer-0.0.10.vsix`*

### 5. Install Extension
You can install the `.vsix` manually in VS Code:
1. Go to **Extensions** sidebar.
2. Click the `...` menu (Views and More Actions).
3. Select **Install from VSIX...**.
4. Choose the generated `.vsix` file.