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
const server_1 = require("./services/server");
const webviewProvider_1 = require("./services/webviewProvider");
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
exports.activate = activate;
// Helper function to send active file info to the webview
function sendActiveFileInfo(provider) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        provider.updateContent({
            type: 'activeFileInfo',
            filename: document.fileName.split(/[\/\\]/).pop() || '',
            content: document.getText(),
            language: document.languageId
        });
    }
    else {
        provider.updateContent({
            type: 'activeFileInfo',
            filename: '',
            content: '',
            language: ''
        });
    }
}
// This method is called when your extension is deactivated
function deactivate() {
    console.log('Extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map