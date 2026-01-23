import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _getBranches: () => Promise<string[]>
    ) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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
                    vscode.commands.executeCommand(
                        "react-review.auditBranchDiff",
                        data.baseBranch,
                        data.featureBranch
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

    private _getHtmlForWebview(webview: vscode.Webview) {
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

        <button id="run-review">Run AI Review</button>

        <script>
          const vscode = acquireVsCodeApi();
          
          // Request branches immediately
          vscode.postMessage({ type: 'ready' });

          document.getElementById('run-review').addEventListener('click', () => {
              const baseBranch = document.getElementById('base-branch').value;
              const featureBranch = document.getElementById('feature-branch').value || 'HEAD';
              
              vscode.postMessage({
                  type: 'onRunReview',
                  baseBranch: baseBranch,
                  featureBranch: featureBranch
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
