import * as vscode from 'vscode';
import { getApiKey, setApiKey } from './services/auth';
import { parseAIResponse } from './utils/parser';
import * as cp from 'child_process';
import * as util from 'util';
import { SidebarProvider } from './sidebarProvider';
import { ReviewResultPanel } from './panels/ReviewResultPanel';

const exec = util.promisify(cp.exec);

// Create diagnostic collection for React reviews
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codehawk-ai" is now active!');

    // Helper to get branches (hoisted)
    async function getBranches(): Promise<string[]> {
        try {
            const { stdout } = await exec('git branch --format="%(refname:short)"', {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            return stdout.split('\n').map(b => b.trim()).filter(b => b.length > 0);
        } catch (e) {
            console.error('Failed to get branches', e);
            return [];
        }
    }

    // Register Sidebar Provider
    const sidebarProvider = new SidebarProvider(context.extensionUri, getBranches, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "react-reviewer-sidebar",
            sidebarProvider
        )
    );

    // Initialize diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('codehawk');

    /**
     * Calculate health score based on diagnostics
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

        if (score >= 80) {
            emoji = '🟢';
            message = 'Great job! Code is healthy.';
        } else if (score >= 50) {
            emoji = '🟡';
            message = 'Warning: cleanup recommended.';
        } else {
            emoji = '🔴';
            message = 'Critical: Immediate refactor needed!';
        }

        vscode.window.showInformationMessage(
            `${emoji} Health Score: ${score}/100 (${issueCount} issues)\n${message}`
        );
        console.log(`Health Score: ${score}%, Issues: ${issueCount}`);
    }

    async function getGitDiff(filePath: string): Promise<string> {
        try {
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
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`❌ API Key test failed: ${errorMessage}`);
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
                const { GeminiService } = await import('./services/gemini-service');
                const service = new GeminiService(apiKey);

                const aiResponse = await service.reviewCode(codeToReview); // Use filtered code

                if (!aiResponse || aiResponse.length === 0) {
                    vscode.window.showWarningMessage('Received empty response from Gemini');
                    return;
                }

                const aiReview = parseAIResponse(aiResponse);

                if (aiReview.diagnostics.length > 0) {
                    // Convert to VS Code Diagnostics
                    const diagnostics: vscode.Diagnostic[] = aiReview.diagnostics.map(item => {
                        const lineIndex = Math.max(0, item.line - 1);
                        const line = document.lineAt(Math.min(lineIndex, document.lineCount - 1));

                        const range = new vscode.Range(line.range.start, line.range.end);

                        const severity = item.severity === 'error'
                            ? vscode.DiagnosticSeverity.Error
                            : item.severity === 'warning'
                                ? vscode.DiagnosticSeverity.Warning
                                : vscode.DiagnosticSeverity.Information;

                        return new vscode.Diagnostic(range, item.message, severity);
                    });

                    diagnosticCollection.set(document.uri, diagnostics);

                    const score = calculateHealthScore(diagnostics);
                    showHealthScoreNotification(score, diagnostics.length);
                } else {
                    vscode.window.showInformationMessage('✅ No issues found!');
                }
            } catch (error) {
                console.error('Full error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage === 'QUOTA_FULL') {
                    vscode.window.showErrorMessage('⏳ Quota Full. Next available in ~1 minute.');
                } else {
                    vscode.window.showErrorMessage(`Error: ${errorMessage}`);
                }
            }
        });
    });

    // Command: Audit Branch Diff
    const auditBranchDiffCommand = vscode.commands.registerCommand('react-review.auditBranchDiff', async (baseBranch: string, featureBranch: string, orModel?: string, orKey?: string) => {
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspacePath) { return; }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Auditing Diff (${baseBranch}..${featureBranch})...`,
            cancellable: false
        }, async () => {
            try {
                // Get Diff
                const { stdout: diff } = await exec(`git diff ${baseBranch}..${featureBranch}`, { cwd: workspacePath });

                if (!diff || diff.trim().length === 0) {
                    vscode.window.showInformationMessage('No changes found between these branches.');
                    return;
                }

                let aiResponse: string;

                if (orKey && orModel) {
                    const { OpenRouterService } = await import('./services/openrouter-service');
                    const service = new OpenRouterService(orKey, orModel);
                    aiResponse = await service.reviewCode(diff);
                } else {
                    const { GeminiService } = await import('./services/gemini-service');
                    const apiKey = await getApiKey(context);
                    if (!apiKey) {
                        vscode.window.showErrorMessage('API Key not set.');
                        return;
                    }

                    const service = new GeminiService(apiKey);
                    aiResponse = await service.reviewCode(diff);
                }

                // Parse the response
                const reviewData = parseAIResponse(aiResponse);

                // Show in Rich Webview
                ReviewResultPanel.show(context.extensionUri, reviewData);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Error: ${errorMessage}`);
            }
        });
    });

    context.subscriptions.push(updateApiKeyCommand, testApiKeyCommand, auditFileCommand, auditBranchDiffCommand);
    context.subscriptions.push(diagnosticCollection);

    // Clear diagnostics when document is closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );

    // Populate branches initially
    setTimeout(async () => {
        const branches = await getBranches();
        if (sidebarProvider._view) {
            sidebarProvider._view.webview.postMessage({ type: 'updateBranches', branches });
        }
    }, 2000);
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
