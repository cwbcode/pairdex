import * as vscode from 'vscode';

export class PairdexViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'pairdex.chatView';

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onMessage: (message: unknown) => void | Thenable<void>
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
    };

    webviewView.webview.onDidReceiveMessage(this.onMessage);
    webviewView.webview.html = this.getHtml(webviewView.webview);
  }

  public postMessage(message: unknown): Thenable<boolean> {
    if (!this.view) {
      return Promise.resolve(false);
    }

    return this.view.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'chat-ui.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'chat.css')
    );

    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="${styleUri}" rel="stylesheet" />
          <title>Pairdex</title>
        </head>
        <body>
          <div class="app-shell">
            <header class="app-header">
              <div>
                <div class="app-title">Pairdex</div>
                <div class="app-subtitle">Transparent Codex client</div>
              </div>
              <div id="status" class="status-badge">Ready</div>
            </header>

            <main id="messages" class="messages" aria-live="polite"></main>

            <footer class="composer-shell">
              <textarea
                id="input"
                class="composer-input"
                placeholder="Ask Codex something..."
                rows="3"
              ></textarea>

              <div class="composer-actions">
                <button id="send" class="send-button">Send</button>
              </div>
            </footer>
          </div>

          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}

function getNonce(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let value = '';
  for (let i = 0; i < 32; i++) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}