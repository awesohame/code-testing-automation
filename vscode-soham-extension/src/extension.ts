import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "http-file-updater" is now active!');

  // Create and start the HTTP server
  const server = createHttpServer();
  
  // Create the sidebar webview
  const provider = new FileUpdateViewProvider(context.extensionUri);
  
  // Register the sidebar view provider
  const view = vscode.window.registerWebviewViewProvider(
    'fileUpdateSidebar',
    provider
  );

  // Command to show the sidebar
  const showSidebarCommand = vscode.commands.registerCommand(
    'http-file-updater.showSidebar', 
    () => {
      vscode.commands.executeCommand('fileUpdateSidebar.focus');
    }
  );

  // Add to subscriptions to ensure proper disposal
  context.subscriptions.push(view, showSidebarCommand);
  
  // Store reference to provider for messaging
  global.fileUpdateProvider = provider;

  // Make sure server gets closed on deactivation
  context.subscriptions.push({
    dispose: () => {
      if (server) {
        server.close();
        console.log('HTTP server closed');
      }
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension "http-file-updater" is now deactivated!');
}

// Create HTTP server to handle POST requests
function createHttpServer(): http.Server {
  const server = http.createServer((req, res) => {
    // Add CORS headers to all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    if (req.method === 'POST' && req.url === '/update') {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { name: newFileName, code, previousFileName } = data;
          
          if (!newFileName || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
            return;
          }
          
          // Get the workspace root path
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'No workspace folder is open' }));
            return;
          }
          
          const rootPath = workspaceFolders[0].uri.fsPath;
          const fullNewFilePath = path.join(rootPath, newFileName);
          
          // Create directory structure if it doesn't exist
          const dirName = path.dirname(fullNewFilePath);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
          
          // Write the file
          fs.writeFileSync(fullNewFilePath, code);
          
          // Send message to webview to update UI
          const message = {
            type: 'fileUpdated',
            data: {
              newFileName,
              previousFileName
            }
          };
          
          if (global.fileUpdateProvider) {
            global.fileUpdateProvider.updateContent(message);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error: any) {
          console.error('Error processing request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else if (req.method !== 'OPTIONS') {
      // Only return 404 for non-OPTIONS requests
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
    }
  });
  
  // Listen on port 3000
  server.listen(3000, () => {
    console.log('HTTP server started on port 3000');
  });
  
  return server;
}

// Declare global namespace for TypeScript
declare global {
  var fileUpdateProvider: FileUpdateViewProvider | undefined;
}

// WebView Provider for the sidebar
class FileUpdateViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }
  
  public updateContent(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to the icon file
    const iconPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'icon.png');
    
    // And convert it to a URI that the webview can use
    const iconUri = webview.asWebviewUri(iconPath);
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Update Sidebar</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            padding: 10px;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .icon {
            width: 64px;
            height: 64px;
            margin-bottom: 10px;
          }
          .history {
            width: 100%;
            margin-top: 20px;
          }
          .history-item {
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
            border-left: 4px solid var(--vscode-activityBarBadge-background);
          }
          h2 {
            font-size: 14px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="icon" src="${iconUri}" alt="HTTP File Updater" />
          <h1>HTTP File Updater</h1>
          <p>Server running on port 3000</p>
          <p>Endpoint: <code>/update</code></p>
          
          <div class="history">
            <h2>Recent Updates</h2>
            <div id="history-container"></div>
          </div>
        </div>
  
        <script>
          const vscode = acquireVsCodeApi();
          const historyContainer = document.getElementById('history-container');
          const updates = [];
          
          // Listen for messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'fileUpdated') {
              // Add the update to the history
              updates.unshift(message.data);
              updateHistoryView();
            }
          });
          
          function updateHistoryView() {
            historyContainer.innerHTML = '';
            
            if (updates.length === 0) {
              historyContainer.innerHTML = '<p>No updates yet</p>';
              return;
            }
            
            updates.slice(0, 10).forEach(update => {
              const item = document.createElement('div');
              item.className = 'history-item';
              
              const from = update.previousFileName ? 
                \`<p>From: <code>\${update.previousFileName}</code></p>\` : '';
              
              item.innerHTML = \`
                <p>To: <code>\${update.newFileName}</code></p>
                \${from}
                <p>Updated: ${new Date().toLocaleTimeString()}</p>
              \`;
              
              historyContainer.appendChild(item);
            });
          }
          
          // Initial render
          updateHistoryView();
        </script>
      </body>
      </html>`;
  }
}