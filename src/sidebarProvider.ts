import * as vscode from "vscode";
import { getOpenRouterKey, setOpenRouterKey } from "./services/auth";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _getBranches: () => Promise<string[]>,
        private readonly _context: vscode.ExtensionContext
    ) { }

    public async resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        const openRouterKey = await getOpenRouterKey(this._context);
        const openRouterModel = this._context.globalState.get<string>('openRouterModel') || '';

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, openRouterKey, openRouterModel);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "ready": {
                    const branches = await this._getBranches();
                    if (this._view) {
                        this._view.webview.postMessage({ type: 'updateBranches', branches });
                    }
                    break;
                }
                case "onRunReview": {
                    if (!data.baseBranch || !data.featureBranch) {
                        return;
                    }
                    // Persist OpenRouter configuration if provided
                    if (data.orKey) {
                        await setOpenRouterKey(this._context, data.orKey);
                    }
                    if (data.orModel) {
                        await this._context.globalState.update('openRouterModel', data.orModel);
                    }

                    vscode.commands.executeCommand(
                        "react-review.auditBranchDiff",
                        data.baseBranch,
                        data.featureBranch,
                        data.orModel,
                        data.orKey
                    );
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview, initialKey: string | undefined, initialModel: string) {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { padding: 10px; font-family: var(--vscode-font-family); }
          .dropdown-container { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          select { width: 100%; padding: 5px; background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); }
          button { width: 100%; padding: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; }
          button:hover { background: var(--vscode-button-hoverBackground); }
          .input-group { margin-bottom: 15px; border-top: 1px solid var(--vscode-dropdown-border); padding-top: 10px; }
          input { width: 100%; padding: 5px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); margin-bottom: 5px; box-sizing: border-box; }
        </style>
			</head>
			<body>
        <h3>Branch Review Manager</h3>
        
        <div class="dropdown-container">
          <label>Base Branch</label>
          <select id="base-branch">
            <option value="main">main</option>
            <option value="master">master</option>
          </select>
        </div>

        <div class="dropdown-container">
          <label>Feature Branch</label>
          <select id="feature-branch">
            <option value="current" selected>Loading...</option>
          </select>
        </div>

        <div class="input-group">
          <label>OpenRouter Configuration (Optional)</label>
          <input type="text" id="or-model" placeholder="Model (e.g., google/gemini-flash-1.5)" value="${initialModel}" />
          <input type="password" id="or-key" placeholder="OpenRouter API Key" value="${initialKey || ''}" />
        </div>

        <button id="run-review">Run AI Review</button>

        <script>
          const vscode = acquireVsCodeApi();
          
          // Request branches immediately
          vscode.postMessage({ type: 'ready' });

          document.getElementById('run-review').addEventListener('click', () => {
              const baseBranch = document.getElementById('base-branch').value;
              const featureBranch = document.getElementById('feature-branch').value || 'HEAD';
              const orModel = document.getElementById('or-model').value;
              const orKey = document.getElementById('or-key').value;
              
              vscode.postMessage({
                  type: 'onRunReview',
                  baseBranch: baseBranch,
                  featureBranch: featureBranch,
                  orModel: orModel,
                  orKey: orKey
              });
          });

          // Listen for messages from extension
          window.addEventListener('message', event => {
              const message = event.data;
              switch (message.type) {
                  case 'updateBranches':
                      updateDropdowns(message.branches);
                      break;
              }
          });

          function updateDropdowns(branches) {
             const baseSelect = document.getElementById('base-branch');
             const featureSelect = document.getElementById('feature-branch');
             
             // Keep existing selections or defaults
             const currentBase = baseSelect.value;
             // Default feature to current (usually the last active one or HEAD)
             
             // Clear opts
             baseSelect.innerHTML = '';
             featureSelect.innerHTML = '<option value="HEAD">Current (HEAD)</option>';

             branches.forEach(branch => {
               const bOpt = document.createElement('option');
               bOpt.value = branch;
               bOpt.text = branch;
               baseSelect.appendChild(bOpt);

               const fOpt = document.createElement('option');
               fOpt.value = branch;
               fOpt.text = branch;
               featureSelect.appendChild(fOpt);
             });
             
             // Try to select smart defaults
             if (branches.includes('main')) baseSelect.value = 'main';
             else if (branches.includes('master')) baseSelect.value = 'master';
             
             // For feature, ideally we select the current one, but we don't know it easily without passing it down.
             // Leaving it as "Current (HEAD)" or the user picks is fine.
          }
        </script>
			</body>
			</html>`;
    }
}
