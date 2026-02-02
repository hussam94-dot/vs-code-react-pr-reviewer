import * as vscode from 'vscode';
import { AIReviewResponse } from '../utils/parser';

export class ReviewResultPanel {
    public static currentPanel: ReviewResultPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, data: AIReviewResponse) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update(data);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static show(extensionUri: vscode.Uri, data: AIReviewResponse) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (ReviewResultPanel.currentPanel) {
            ReviewResultPanel.currentPanel._panel.reveal(column);
            ReviewResultPanel.currentPanel._update(data);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'reactReviewResult',
            'AI Code Review',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        ReviewResultPanel.currentPanel = new ReviewResultPanel(panel, extensionUri, data);
    }

    public dispose() {
        ReviewResultPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(data: AIReviewResponse) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, data);
    }

    private _getHtmlForWebview(webview: vscode.Webview, data: AIReviewResponse) {
        // Use VS Code's built-in CSS variables for theming
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css')); // We might need to create this or inline styles

        const score = data.overall_quality?.score ?? 0;
        const scoreColor = score >= 80 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336';

        const maintainability = data.overall_quality?.maintainability || 'Unknown';
        const complexity = data.overall_quality?.complexity || 'Unknown';

        const summary = data.summary || "No summary provided.";

        // Lists
        const strengthsHtml = (data.strengths || []).map(s => `<li>✅ ${s}</li>`).join('');
        const improvementsHtml = (data.improvements || []).map(s => `<li>🔹 ${s}</li>`).join('');

        // Diagnostics Table
        const diagnosticsRows = data.diagnostics.map(d => {
            const severityIcon = d.severity === 'error' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵';
            return `
                <tr>
                    <td style="text-align:center;">${severityIcon}</td>
                    <td>Line ${d.line}</td>
                    <td>${d.message}</td>
                </tr>
            `;
        }).join('');

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Code Review</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    h1, h2, h3 { color: var(--vscode-editor-foreground); }
                    .header-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 20px;
                        border-radius: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border: 1px solid var(--vscode-widget-border);
                    }
                    .score-circle {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        background: ${scoreColor};
                        color: white;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    }
                    .score-val { font-size: 2.5em; line-height: 1; }
                    .score-label { font-size: 0.8em; text-transform: uppercase; }
                    
                    .metric-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .metric-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 15px;
                        border-radius: 6px;
                        border: 1px solid var(--vscode-widget-border);
                    }
                    .metric-label { font-size: 0.9em; opacity: 0.8; }
                    .metric-value { font-size: 1.2em; font-weight: bold; margin-top: 5px; text-transform: capitalize; }
                    
                    .section { margin-bottom: 25px; }
                    ul { list-style-type: none; padding: 0; }
                    li { margin-bottom: 8px; padding: 8px; background: var(--vscode-textBlockQuote-background); border-radius: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid var(--vscode-widget-border); }
                    th { background: var(--vscode-editor-inactiveSelectionBackground); }
                    tr:hover { background: var(--vscode-list-hoverBackground); }
                </style>
            </head>
            <body>
                <div class="header-card">
                    <div style="flex: 1; padding-right: 20px;">
                        <h1>Code Review Report</h1>
                        <p>${summary}</p>
                    </div>
                    <div class="score-circle">
                        <span class="score-val">${score}</span>
                        <span class="score-label">Score</span>
                    </div>
                </div>

                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Maintainability</div>
                        <div class="metric-value">${maintainability}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Complexity</div>
                        <div class="metric-value">${complexity}</div>
                    </div>
                </div>

                <div class="section">
                    <h2>💪 Key Strengths</h2>
                    <ul>${strengthsHtml}</ul>
                </div>

                <div class="section">
                    <h2>🔧 Suggested Improvements</h2>
                    <ul>${improvementsHtml}</ul>
                </div>

                <div class="section">
                    <h2>🔍 Detailed Diagnostics</h2>
                    ${diagnosticsRows ? `
                    <table>
                        <thead>
                            <tr>
                                <th width="50">Sev</th>
                                <th width="80">Line</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${diagnosticsRows}
                        </tbody>
                    </table>` : '<p>✅ No critical issues found.</p>'}
                </div>
            </body>
            </html>`;
    }
}
