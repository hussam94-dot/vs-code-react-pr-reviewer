#  HUSSAM-CodeHawk AI
> **Eagle eyes for your code 🦅**

**CodeHawk AI** is your intelligent coding companion, designed to streamline Pull Request reviews and elevate code quality. It catches bugs, security vulnerabilities, and performance bottlenecks before they merge.

---

## ✨ Key Features

### 🔍 AI-Powered Code Audits
Instantly analyze your current file or git diff using advanced AI models (Gemini 1.5 Pro, OpenRouter).

### 🛡️ Security & Performance
- Detect potential security flaws (e.g., hardcoded secrets, injection risks).
- Identify performance killers (unnecessary re-renders, expensive operations).

### 📊 Rich Review Dashboard
View a dedicated "CodeHawk Manager" sidebar with:
- **Health Score**: A quantifier of your code quality (0-100).
- **Issue Breakdown**: Categorized by Severity (Critical, Warning, Info).
- **Review Summary**: Actionable insights on how to improve.

### 🧹 Clean Code Enforcement
Ensure your code adheres to best practices, consistent naming conventions, and modern architectural patterns.

---

## 🚀 Getting Started

### 1. Installation
Install **CodeHawk AI** from the VS Code Marketplace.

### 2. Configuration
You need an API Key to power the AI engine.
1.  Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2.  Run **CodeHawk: Update API Key**.
3.  Enter your Google Gemini API Key.

### 3. Usage
- **Audit Current File**: Open a file and run **CodeHawk: Audit File**.
- **Review Changes**: The extension can automatically detect changes in your git branch and offer a review.
- **Interactive Reports**: Check the **CodeHawk Manager** sidebar for detailed reports.

---

## 🛠️ Commands
- `CodeHawk: Audit File` - Analyze the currently open file.
- `CodeHawk: Update API Key` - Set or change your AI provider API key.
- `CodeHawk: Test API Key` - Verify your connection to the AI service.

---

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

