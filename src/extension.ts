import * as vscode from 'vscode';
import { getApiKey, setApiKey } from './services/auth';

console.log('Extension file is loading...');

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vs-code-react-pr-reviewer" is now active!');
    vscode.window.showInformationMessage('VS Code React PR Reviewer is now active!', { modal: true });

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
        const code = document.getText();

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Auditing ${document.fileName}...`,
            cancellable: false
        }, async (progress) => {
            try {
                console.log('Starting audit...');
                const { GeminiService } = await import('./services/gemini-service');
                console.log('GeminiService imported');

                const service = new GeminiService(apiKey);
                console.log('GeminiService created');

                const review = await service.reviewCode(code);
                console.log('Review received, length:', review?.length);

                if (!review || review.length === 0) {
                    vscode.window.showWarningMessage('Received empty response from Gemini');
                    return;
                }

                // Create a new untitled document to show the review
                const doc = await vscode.workspace.openTextDocument({ content: review, language: 'markdown' });
                console.log('Document created');

                await vscode.window.showTextDocument(doc);
                console.log('Document shown');
            } catch (error: any) {
                console.error('Full error:', error);
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });
    });

    context.subscriptions.push(updateApiKeyCommand, testApiKeyCommand, auditFileCommand);
}

export function deactivate() { }
