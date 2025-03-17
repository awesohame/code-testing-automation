"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const server_1 = require("./services/server");
const webviewProvider_1 = require("./services/webviewProvider");
const axios = require('axios');
// This method is called when your extension is activated
function activate(context) {
    console.log('Extension is now active!');
    // Create and start the HTTP server
    const server = (0, server_1.startServer)();
    // Create the sidebar webview
    const provider = new webviewProvider_1.ChatbotViewProvider(context.extensionUri);
    // Register the sidebar view provider
    const view = vscode.window.registerWebviewViewProvider('fileUpdateSidebar', provider);
    // Command to show the sidebar
    const showSidebarCommand = vscode.commands.registerCommand('http-file-updater.showSidebar', () => {
        vscode.commands.executeCommand('fileUpdateSidebar.focus');
    });
    // Command to update active file info
    const updateFileInfoCommand = vscode.commands.registerCommand('http-file-updater.updateFileInfo', () => {
        sendActiveFileInfo(provider);
    });
    // Command to show diff view
    const showDiffCommand = vscode.commands.registerCommand('http-file-updater.showDiff', async (originalContent, modifiedContent, fileName) => {
        const originalUri = vscode.Uri.parse(`untitled:Original-${fileName}`);
        const modifiedUri = vscode.Uri.parse(`untitled:Modified-${fileName}`);
        const diff = await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, `${fileName} (Original ↔ AI Modified)`, { preview: true });
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
    });
    // Command to apply modified content to the current file
    const applyChangesCommand = vscode.commands.registerCommand('http-file-updater.applyChanges', async (modifiedContent, targetUri) => {
        if (targetUri) {
            // Apply changes to the specified file
            const document = await vscode.workspace.openTextDocument(targetUri);
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
            edit.replace(targetUri, fullRange, modifiedContent);
            await vscode.workspace.applyEdit(edit);
            // Show success message
            vscode.window.showInformationMessage('Changes applied successfully!');
            // Close the diff view
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        else {
            // Try to apply to the active editor as a fallback
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;
                const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
                await editor.edit((editBuilder) => {
                    editBuilder.replace(fullRange, modifiedContent);
                });
                // Show success message
                vscode.window.showInformationMessage('Changes applied successfully!');
            }
        }
    });
    // Command to generate test file
    const generateTestFileCommand = vscode.commands.registerCommand('http-file-updater.generateTest', async (originalFilePath, fileName, content) => {
        const baseFileName = path.basename(fileName);
        const testFileName = baseFileName.replace(/\.(js|ts|jsx|tsx)$/, '.test.js');
        // Prepare data for the server
        const data = {
            name: testFileName,
            code: content,
            originalFilePath: originalFilePath
        };
        // Send HTTP request to update file
        axios.post('http://localhost:3000/update', data)
            .then(() => {
            vscode.window.showInformationMessage(`Test file created at server/__tests__/${testFileName}`);
        })
            .catch((err) => {
            console.error('Error creating test file:', err);
            vscode.window.showErrorMessage(`Failed to create test file: ${err.message}`);
        });
    });
    // Register the message handler for AI responses
    context.subscriptions.push(vscode.commands.registerCommand('http-file-updater.handleAIResponse', async (response, options) => {
        if (options.isEditMode) {
            // Process the response to remove markdown formatting if needed
            const processedResponse = processCodeResponse(response);
            // Show diff view for edit mode
            await vscode.commands.executeCommand('http-file-updater.showDiff', options.originalContent, processedResponse, options.fileName);
        }
    }));
    // Add to subscriptions to ensure proper disposal
    context.subscriptions.push(view, showSidebarCommand, updateFileInfoCommand, showDiffCommand, applyChangesCommand, generateTestFileCommand);
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
exports.activate = activate;
// Helper function to show action buttons for diff view
function showDiffActionButtons(originalContent, modifiedContent, fileName) {
    // Create buttons in the editor title bar
    vscode.window.showInformationMessage(`Do you want to apply these changes to ${fileName}?`, 'Accept Changes', 'Discard').then(selection => {
        if (selection === 'Accept Changes') {
            if (fileName.endsWith('.test.js') || fileName.endsWith('.spec.js')) {
                // For test files, save to server/__tests__ folder
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    const rootPath = workspaceFolders[0].uri.fsPath;
                    const testFilePath = vscode.Uri.file(`${rootPath}/server/__tests__/${fileName}`);
                    vscode.commands.executeCommand('http-file-updater.applyChanges', modifiedContent, testFilePath);
                }
            }
            else {
                // For non-test files, find the actual file in the workspace
                vscode.workspace.findFiles(`**/${fileName}`).then(async (uris) => {
                    if (uris.length > 0) {
                        // Apply changes directly to the original file
                        await vscode.commands.executeCommand('http-file-updater.applyChanges', modifiedContent, uris[0]);
                    }
                    else {
                        vscode.window.showErrorMessage(`Could not find ${fileName} to apply changes.`);
                    }
                });
            }
        }
        else if (selection === 'Discard') {
            // Close diff view
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });
}
// Helper function to process code response - remove markdown formatting
function processCodeResponse(response) {
    // First, check if the response is wrapped in code blocks with backticks
    const codeBlockRegex = /^```([\w-]*)\n([\s\S]*?)```$/;
    const match = response.match(codeBlockRegex);
    if (match) {
        // Return just the code without the markdown formatting
        return match[2];
    }
    // If there are multiple code blocks, try to extract the most relevant one
    const multipleCodeBlocksRegex = /```([\w-]*)\n([\s\S]*?)```/g;
    const matches = [...response.matchAll(multipleCodeBlocksRegex)];
    if (matches.length > 0) {
        // Find the largest code block (likely the main content)
        let largestBlock = '';
        let maxLength = 0;
        for (const m of matches) {
            if (m[2].length > maxLength) {
                maxLength = m[2].length;
                largestBlock = m[2];
            }
        }
        return largestBlock;
    }
    // If no code blocks found, return the original response
    return response;
}
// Helper function to send active file info to the webview
function sendActiveFileInfo(provider) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const filename = document.fileName.split(/[\/\\]/).pop() || '';
        provider.updateContent({
            type: 'activeFileInfo',
            filename: filename,
            content: document.getText(),
            language: document.languageId,
            fullPath: document.fileName
        });
    }
    else {
        provider.updateContent({
            type: 'activeFileInfo',
            filename: '',
            content: '',
            language: '',
            fullPath: ''
        });
    }
}
// This method is called when your extension is deactivated
function deactivate() {
    console.log('Extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map