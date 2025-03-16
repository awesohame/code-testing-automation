import * as vscode from 'vscode';
import { startServer } from './services/server';
import { ChatbotViewProvider } from './services/webviewProvider';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Extension is now active!');

  // Create and start the HTTP server
  const server = startServer();
  
  // Create the sidebar webview
  const provider = new ChatbotViewProvider(context.extensionUri);
  
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

  // Command to update active file info
  const updateFileInfoCommand = vscode.commands.registerCommand(
    'http-file-updater.updateFileInfo',
    () => {
      sendActiveFileInfo(provider);
    }
  );

  // Listen for active editor changes to update file info
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      sendActiveFileInfo(provider);
    }
  }, null, context.subscriptions);

  // Add to subscriptions to ensure proper disposal
  context.subscriptions.push(view, showSidebarCommand, updateFileInfoCommand);
  
  // Store reference to provider for messaging
  global.fileUpdateProvider = provider;

  // Initialize with current editor if one exists
  if (vscode.window.activeTextEditor) {
    sendActiveFileInfo(provider);
  }

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

// Helper function to send active file info to the webview
function sendActiveFileInfo(provider: ChatbotViewProvider) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const document = editor.document;
    provider.updateContent({
      type: 'activeFileInfo',
      filename: document.fileName.split(/[\/\\]/).pop() || '',
      content: document.getText(),
      language: document.languageId
    });
  } else {
    provider.updateContent({
      type: 'activeFileInfo',
      filename: '',
      content: '',
      language: ''
    });
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension is now deactivated!');
}

// Declare global namespace for TypeScript
declare global {
  var fileUpdateProvider: ChatbotViewProvider | undefined;
}