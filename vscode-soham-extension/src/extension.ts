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

  // Command to show diff view
  const showDiffCommand = vscode.commands.registerCommand(
    'http-file-updater.showDiff',
    async (originalContent: string, modifiedContent: string, fileName: string) => {
      const originalUri = vscode.Uri.parse(`untitled:Original-${fileName}`);
      const modifiedUri = vscode.Uri.parse(`untitled:Modified-${fileName}`);
      
      const diff = await vscode.commands.executeCommand(
        'vscode.diff',
        originalUri,
        modifiedUri,
        `${fileName} (Original ↔ AI Modified)`,
        { preview: true }
      );
      
      // Create the documents for the diff view
      const originalDoc = await vscode.workspace.openTextDocument(originalUri);
      const modifiedDoc = await vscode.workspace.openTextDocument(modifiedUri);
      
      // Edit the documents to add content
      const originalEdit = new vscode.WorkspaceEdit();
      const modifiedEdit = new vscode.WorkspaceEdit();
      
      originalEdit.insert(originalUri, new vscode.Position(0, 0), originalContent);
      modifiedEdit.insert(modifiedUri, new vscode.Position(0, 0), modifiedContent);
      
      await vscode.workspace.applyEdit(originalEdit);
      await vscode.workspace.applyEdit(modifiedEdit);

      // Store the original file's uri and the modified content for later use
      context.workspaceState.update('originalFileName', fileName);
      context.workspaceState.update('modifiedContent', modifiedContent);

      // Show action buttons for the diff view
      showDiffActionButtons(originalContent, modifiedContent, fileName);
      
      return diff;
    }
  );

  // Command to apply modified content to the current file
  const applyChangesCommand = vscode.commands.registerCommand(
    'http-file-updater.applyChanges',
    async (modifiedContent: string, targetUri?: vscode.Uri) => {
      if (targetUri) {
        // Apply changes to the specified file
        const document = await vscode.workspace.openTextDocument(targetUri);
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          new vscode.Position(0, 0),
          document.lineAt(document.lineCount - 1).range.end
        );
        
        edit.replace(targetUri, fullRange, modifiedContent);
        await vscode.workspace.applyEdit(edit);
        
        // Show success message
        vscode.window.showInformationMessage('Changes applied successfully!');
        
        // Close the diff view
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } else {
        // Try to apply to the active editor as a fallback
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const document = editor.document;
          const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            document.lineAt(document.lineCount - 1).range.end
          );
          
          await editor.edit((editBuilder) => {
            editBuilder.replace(fullRange, modifiedContent);
          });
          
          // Show success message
          vscode.window.showInformationMessage('Changes applied successfully!');
        }
      }
    }
  );

  // Listen for active editor changes to update file info
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      sendActiveFileInfo(provider);
    }
  }, null, context.subscriptions);

  // Register the message handler for AI responses
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'http-file-updater.handleAIResponse',
      async (response: string, options: { isEditMode: boolean, fileName: string, originalContent: string }) => {
        if (options.isEditMode) {
          // Process the response to remove markdown formatting if needed
          const processedResponse = processCodeResponse(response);
          
          // Show diff view for edit mode
          await vscode.commands.executeCommand(
            'http-file-updater.showDiff',
            options.originalContent,
            processedResponse,
            options.fileName
          );
        }
      }
    )
  );

  // Add to subscriptions to ensure proper disposal
  context.subscriptions.push(view, showSidebarCommand, updateFileInfoCommand, showDiffCommand, applyChangesCommand);
  
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

// Helper function to show action buttons for diff view
function showDiffActionButtons(originalContent: string, modifiedContent: string, fileName: string) {
  // Create buttons in the editor title bar
  vscode.window.showInformationMessage(
    `Do you want to apply these changes to ${fileName}?`,
    'Accept Changes', 'Discard'
  ).then(selection => {
    if (selection === 'Accept Changes') {
      // Find the actual file in the workspace
      vscode.workspace.findFiles(`**/${fileName}`).then(async (uris) => {
        if (uris.length > 0) {
          // Apply changes directly to the original file
          await vscode.commands.executeCommand('http-file-updater.applyChanges', modifiedContent, uris[0]);
        } else {
          vscode.window.showErrorMessage(`Could not find ${fileName} to apply changes.`);
        }
      });
    } else if (selection === 'Discard') {
      // Close diff view
      vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
  });
}

// Helper function to process code response - remove markdown formatting
function processCodeResponse(response: string): string {
  // Check if the response is wrapped in code blocks with backticks
  const codeBlockRegex = /^```[\w-]*\n([\s\S]*?)```$/;
  const match = response.match(codeBlockRegex);
  
  if (match) {
    // Return just the code without the markdown formatting
    return match[1];
  }
  
  return response; // Return original if no markdown formatting found
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