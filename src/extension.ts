import * as vscode from 'vscode';
import { getApiKey, setApiKey } from './services/auth';
import { parseAIResponse } from './utils/parser';
import * as cp from 'child_process';
import * as util from 'util';

const exec = util.promisify(cp.exec);

// Create diagnostic collection for React reviews
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vs-code-react-pr-reviewer" is now active!');
    vscode.window.showInformationMessage('VS Code React PR Reviewer is now active!', { modal: true });

    // Initialize diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('react-manager');

    /**
     * Calculate health score based on diagnostics
     * Start at 100, subtract 15 per error, 5 per warning, minimum 0
     */
    function calculateHealthScore(diagnostics: vscode.Diagnostic[]): number {
        let score = 100;

        for (const diagnostic of diagnostics) {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                score -= 15;
            } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                score -= 5;
            }
        }

        return Math.max(0, score);
    }

    /**
     * Show health score notification with color coding
     */
    function showHealthScoreNotification(score: number, issueCount: number) {
        let emoji: string;
        let message: string;

        if (score > 80) {
            emoji = '🟢';
            message = `${emoji} Health Score: ${score}%. Great job!`;
            vscode.window.showInformationMessage(message);
        } else if (score >= 50) {
            emoji = '🟡';
            message = `${emoji} Health Score: ${score}%. Needs minor refactoring.`;
            vscode.window.showWarningMessage(message);
        } else {
            emoji = '🔴';
            message = `${emoji} Health Score: ${score}%. Critical issues found.`;
            vscode.window.showErrorMessage(message);
        }

        console.log(`Health Score: ${score}%, Issues: ${issueCount}`);
    }

    async function getGitDiff(filePath: string): Promise<string> {
        try {
            // Get diff of the specific file (0 context lines to save tokens)
            // git diff -U0 HEAD -- <file>
            const { stdout } = await exec(`git diff -U0 HEAD -- "${filePath}"`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            return stdout.trim();
        } catch (error) {
            console.warn('Git diff failed or no repo:', error);
            return '';
        }
    }

    // Command: Update API Key
    const updateApiKeyCommand = vscode.commands.registerCommand('reviewer.updateApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Gemini API Key',
            password: true,
            placeHolder: 'AIza...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'API Key cannot be empty';
                }
                return null;
            }
        });

        if (apiKey) {
            await setApiKey(context, apiKey);
            vscode.window.showInformationMessage('Gemini API Key saved successfully!');
        }
    });

    // Command: Test API Key
    const testApiKeyCommand = vscode.commands.registerCommand('reviewer.testApiKey', async () => {
        const apiKey = await getApiKey(context);
        if (!apiKey) {
            const action = await vscode.window.showErrorMessage(
                'Gemini API Key is not set. Please configure it first.',
                'Update API Key'
            );
            if (action === 'Update API Key') {
                vscode.commands.executeCommand('reviewer.updateApiKey');
            }
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Testing API Key...',
            cancellable: false
        }, async () => {
            try {
                const { GeminiService } = await import('./services/gemini-service');
                const service = new GeminiService(apiKey);
                await service.testApiKey();
                vscode.window.showInformationMessage('✅ API Key is valid and working!');
            } catch (error: any) {
                vscode.window.showErrorMessage(`❌ API Key test failed: ${error.message}`);
            }
        });
    });

    // Command: Audit File
    const auditFileCommand = vscode.commands.registerCommand('react-review.auditFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a React file to review!');
            return;
        }

        const apiKey = await getApiKey(context);
        if (!apiKey) {
            const action = await vscode.window.showErrorMessage(
                'Gemini API Key is not set. Please configure it first.',
                'Update API Key'
            );
            if (action === 'Update API Key') {
                vscode.commands.executeCommand('reviewer.updateApiKey');
            }
            return;
        }

        const document = editor.document;
        let codeToReview = "";
        let contextMsg = "";

        // Strategy: Diff -> Selection -> Error
        const diff = await getGitDiff(document.fileName);
        if (diff && diff.length > 0) {
            codeToReview = diff;
            contextMsg = `Auditing Git Diff...`;
        } else {
            const selection = editor.selection;
            if (!selection.isEmpty) {
                codeToReview = document.getText(selection);
                contextMsg = `Auditing Selection...`;
            } else {
                vscode.window.showWarningMessage('No Uncommitted Changes. Please select a block of code to review.');
                return;
            }
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: contextMsg,
            cancellable: false
        }, async (progress) => {
            try {
                console.log('Starting audit...');
                const { GeminiService } = await import('./services/gemini-service');

                const service = new GeminiService(apiKey);
                console.log('GeminiService created');

                const aiResponse = await service.reviewCode(codeToReview);
                console.log('Review received, length:', aiResponse?.length);

                if (!aiResponse || aiResponse.length === 0) {
                    vscode.window.showWarningMessage('Received empty response from Gemini');
                    return;
                }

                // Try to parse as JSON diagnostics
                const aiReview = parseAIResponse(aiResponse);
                console.log(`Parsed ${aiReview.diagnostics.length} diagnostic items`);
                if (aiReview.summary) {
                    console.log('AI Summary:', aiReview.summary);
                }

                if (aiReview.diagnostics.length > 0) {
                    // Convert to VS Code Diagnostics
                    const diagnostics: vscode.Diagnostic[] = aiReview.diagnostics.map(item => {
                        // Line numbers are 0-indexed in VS Code
                        const lineIndex = Math.max(0, item.line - 1);
                        const line = document.lineAt(Math.min(lineIndex, document.lineCount - 1));

                        // Create range covering the entire line
                        const range = new vscode.Range(
                            line.range.start,
                            line.range.end
                        );

                        // Map severity
                        const severity = item.severity === 'error'
                            ? vscode.DiagnosticSeverity.Error
                            : vscode.DiagnosticSeverity.Warning;

                        return new vscode.Diagnostic(range, item.message, severity);
                    });

                    // Apply diagnostics to the document
                    diagnosticCollection.set(document.uri, diagnostics);

                    // Calculate and show health score
                    const score = calculateHealthScore(diagnostics);
                    showHealthScoreNotification(score, diagnostics.length);
                } else {
                    // Fallback: show as markdown if JSON parsing failed
                    console.log('No diagnostics parsed, showing as markdown fallback');
                    const doc = await vscode.workspace.openTextDocument({
                        content: aiResponse,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc);
                }
            } catch (error: any) {
                console.error('Full error:', error);

                if (error.message === 'QUOTA_FULL') {
                    vscode.window.showErrorMessage('⏳ Quota Full. Next available in ~1 minute.');
                } else {
                    vscode.window.showErrorMessage(`Error: ${error.message}`);
                }
            }
        });
    });

    context.subscriptions.push(updateApiKeyCommand, testApiKeyCommand, auditFileCommand);
    context.subscriptions.push(diagnosticCollection);

    // Clear diagnostics when document is closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
