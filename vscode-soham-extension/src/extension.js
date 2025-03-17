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
const simple_git_1 = require("simple-git");
const generative_ai_1 = require("@google/generative-ai");
const fs = __importStar(require("fs"));
// Better PDF.js handling
let pdfjsLib;
try {
    // Ensure we're using the correct import format
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
    // Set the worker source
    const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}
catch (error) {
    console.error('Failed to load PDF.js library:', error);
}
// This method is called when your extension is activated
function activate(context) {
    console.log('Documentation Generator is now active');
    // Register the command to generate documentation
    let disposable = vscode.commands.registerCommand('doc-gen.generateDocs', async () => {
        try {
            // Get workspace folder path
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }
            const workspacePath = workspaceFolders[0].uri.fsPath;
            // Initialize git correctly
            const git = (0, simple_git_1.simpleGit)(workspacePath);
            // Check if git repository exists
            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                vscode.window.showErrorMessage('Not a git repository');
                return;
            }
            // Get staged files
            const status = await git.status();
            const stagedFiles = status.staged;
            if (stagedFiles.length === 0) {
                vscode.window.showInformationMessage('No staged files found');
                return;
            }
            vscode.window.showInformationMessage(`Found ${stagedFiles.length} staged files`);
            // Extract diff content for staged files
            let allDiffs = '';
            for (const file of stagedFiles) {
                try {
                    const diff = await git.diff(['--staged', '--', file]);
                    allDiffs += `\n--- File: ${file} ---\n${diff}\n`;
                }
                catch (error) {
                    console.error(`Error getting diff for ${file}:`, error);
                }
            }
            // Try to get the guidelines PDF content, but make it optional
            let guidelinesContent = '';
            try {
                const guidelinesResult = await getGuidelinesPdfContent();
                if (guidelinesResult) {
                    guidelinesContent = guidelinesResult;
                }
            }
            catch (error) {
                console.error('Error processing guidelines:', error);
                vscode.window.showWarningMessage('Failed to process guidelines PDF. Continuing without guidelines.');
            }
            // Generate documentation using Gemini API
            const docs = await generateDocumentation(allDiffs, guidelinesContent);
            // Show documentation in a new editor
            const doc = await vscode.workspace.openTextDocument({
                content: docs,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        }
        catch (error) {
            console.error('Error generating documentation:', error);
            vscode.window.showErrorMessage(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    // Register command to configure settings
    let configCommand = vscode.commands.registerCommand('doc-gen.configureSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'docGen');
    });
    // Register command to clear API key from settings
    let clearKeyCommand = vscode.commands.registerCommand('doc-gen.clearApiKey', async () => {
        const config = vscode.workspace.getConfiguration('docGen');
        await config.update('geminiApiKey', '', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('API key has been cleared');
    });
    // Add this to your activate function
    let setPdfCommand = vscode.commands.registerCommand('doc-gen.setGuidelinesPdf', async () => {
        const newPdfPath = await promptForPdfFile();
        if (newPdfPath) {
            vscode.window.showInformationMessage(`Guidelines PDF set to: ${newPdfPath}`);
        }
    });
    context.subscriptions.push(disposable, configCommand, clearKeyCommand, setPdfCommand);
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
    const showDiffCommand = vscode.commands.registerCommand('http-file-updater.showDiff', async (originalContent, modifiedContent, fileName, allVersions, currentVersionIndex = 0) => {
        const originalUri = vscode.Uri.parse(`untitled:Original-${fileName}`);
        const modifiedUri = vscode.Uri.parse(`untitled:Modified-${fileName}`);
        // Create a new diff view
        const diff = await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, `${fileName} (Original ↔ AI Modified${allVersions && allVersions.length > 0 ? ` - Version ${currentVersionIndex + 1}/${allVersions.length}` : ''})`, { preview: true });
        try {
            // Create the documents for the diff view
            const originalDoc = await vscode.workspace.openTextDocument(originalUri);
            const modifiedDoc = await vscode.workspace.openTextDocument(modifiedUri);
            // First, clear any existing content
            const originalEdit = new vscode.WorkspaceEdit();
            const modifiedEdit = new vscode.WorkspaceEdit();
            // Get the full range of each document (to clear if there's existing content)
            if (originalDoc.getText().length > 0) {
                const originalFullRange = new vscode.Range(new vscode.Position(0, 0), originalDoc.lineAt(originalDoc.lineCount - 1).range.end);
                originalEdit.replace(originalUri, originalFullRange, '');
            }
            if (modifiedDoc.getText().length > 0) {
                const modifiedFullRange = new vscode.Range(new vscode.Position(0, 0), modifiedDoc.lineAt(modifiedDoc.lineCount - 1).range.end);
                modifiedEdit.replace(modifiedUri, modifiedFullRange, '');
            }
            // Apply the edits to clear existing content
            await vscode.workspace.applyEdit(originalEdit);
            await vscode.workspace.applyEdit(modifiedEdit);
            // Now insert the new content
            const originalInsertEdit = new vscode.WorkspaceEdit();
            const modifiedInsertEdit = new vscode.WorkspaceEdit();
            originalInsertEdit.insert(originalUri, new vscode.Position(0, 0), originalContent);
            modifiedInsertEdit.insert(modifiedUri, new vscode.Position(0, 0), modifiedContent);
            await vscode.workspace.applyEdit(originalInsertEdit);
            await vscode.workspace.applyEdit(modifiedInsertEdit);
        }
        catch (error) {
            console.error('Error setting up diff view:', error);
            vscode.window.showErrorMessage(`Error setting up diff view: ${error}`);
        }
        // Store the original file's uri and the modified content for later use
        context.workspaceState.update('originalFileName', fileName);
        context.workspaceState.update('modifiedContent', modifiedContent);
        // Show action buttons for the diff view
        showDiffActionButtons(originalContent, modifiedContent, fileName, allVersions, currentVersionIndex);
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
            // Parse versions from the response
            let versions = parseVersionsFromText(response);
            // If no versions could be parsed, fall back to the old behavior
            if (versions.length === 0) {
                const processedResponse = processCodeResponse(response);
                // Show diff view for edit mode
                await vscode.commands.executeCommand('http-file-updater.showDiff', options.originalContent, processedResponse, options.fileName);
            }
            else {
                // Show diff view with the first version and all versions
                await vscode.commands.executeCommand('http-file-updater.showDiff', options.originalContent, versions[0], options.fileName, versions, 0);
            }
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
function parseVersionsFromText(text) {
    const versions = [];
    // Regular expression to match version blocks
    const versionRegex = /VERSION \d+:\s*```[\w-]*\s*([\s\S]*?)```/g;
    let match;
    while ((match = versionRegex.exec(text)) !== null) {
        if (match[1] && match[1].trim()) {
            versions.push(match[1].trim());
        }
    }
    return versions;
}
function applyChangesToFile(modifiedContent, fileName) {
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
// Helper function to show action buttons for diff view
function showDiffActionButtons(originalContent, modifiedContent, fileName, allVersions, currentVersionIndex = 0) {
    // Parse versions if they're provided in a single string
    let versions = allVersions || [];
    if (!allVersions && modifiedContent.includes("VERSION 1:")) {
        versions = parseVersionsFromText(modifiedContent);
        // If we successfully parsed versions, use the first one as the initial modified content
        if (versions.length > 0) {
            modifiedContent = versions[0];
        }
    }
    // Create buttons in the editor title bar
    const buttons = [];
    // Add version navigation buttons if we have multiple versions
    if (versions.length > 1) {
        buttons.push('← Previous');
        buttons.push(`${currentVersionIndex + 1}/${versions.length}`);
        buttons.push('Next →');
    }
    // Add accept/discard buttons
    buttons.push('Accept Changes');
    buttons.push('Discard');
    vscode.window.showInformationMessage(`Do you want to apply these changes to ${fileName}?`, ...buttons).then(selection => {
        if (selection === 'Accept Changes') {
            applyChangesToFile(modifiedContent, fileName);
        }
        else if (selection === 'Discard') {
            // Close diff view
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        else if (selection === 'Next →' || selection === '← Previous') {
            // Calculate the new index
            const nextIndex = selection === 'Next →'
                ? (currentVersionIndex + 1) % versions.length
                : (currentVersionIndex - 1 + versions.length) % versions.length;
            // Close the current diff view and open a new one with the next version
            vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                vscode.commands.executeCommand('http-file-updater.showDiff', originalContent, versions[nextIndex], fileName, versions, nextIndex);
            });
        }
    });
}
function registerVersionNavigationCommands(context) {
    // Command to show the next version
    const showNextVersionCommand = vscode.commands.registerCommand('http-file-updater.showNextVersion', async (originalContent, versions, fileName, currentVersionIndex) => {
        const nextIndex = (currentVersionIndex + 1) % versions.length;
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('http-file-updater.showDiff', originalContent, versions[nextIndex], fileName, versions, nextIndex);
    });
    // Command to show the previous version
    const showPreviousVersionCommand = vscode.commands.registerCommand('http-file-updater.showPreviousVersion', async (originalContent, versions, fileName, currentVersionIndex) => {
        const prevIndex = (currentVersionIndex - 1 + versions.length) % versions.length;
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('http-file-updater.showDiff', originalContent, versions[prevIndex], fileName, versions, prevIndex);
    });
    // Add to subscriptions
    context.subscriptions.push(showNextVersionCommand, showPreviousVersionCommand);
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
async function getGuidelinesPdfContent() {
    // First, check if PDF.js is available
    if (!pdfjsLib) {
        vscode.window.showWarningMessage('PDF.js library is not available. Reinstalling the extension may fix this issue.');
        throw new Error('PDF.js library is not available');
    }
    // Check if a guidelines PDF is configured
    const config = vscode.workspace.getConfiguration('docGen');
    const guidelinesPdfPath = config.get('guidelinesPdfPath');
    let pdfPath = '';
    if (guidelinesPdfPath && fs.existsSync(guidelinesPdfPath)) {
        // We have a configured PDF path that exists
        const useExisting = await vscode.window.showQuickPick(['Use existing PDF', 'Upload new PDF'], {
            placeHolder: 'Choose an option for guidelines PDF'
        });
        if (useExisting === 'Use existing PDF') {
            pdfPath = guidelinesPdfPath;
        }
        else if (useExisting === 'Upload new PDF') {
            const newPdfPath = await promptForPdfFile();
            if (newPdfPath) {
                pdfPath = newPdfPath;
                // Save the new path to configuration
                await config.update('guidelinesPdfPath', pdfPath, vscode.ConfigurationTarget.Global);
            }
            else {
                return undefined; // User cancelled
            }
        }
        else {
            return undefined; // User cancelled
        }
    }
    else {
        // No existing PDF path, prompt for one
        const newPdfPath = await promptForPdfFile();
        if (newPdfPath) {
            pdfPath = newPdfPath;
            // Save the new path to configuration
            await config.update('guidelinesPdfPath', pdfPath, vscode.ConfigurationTarget.Global);
        }
        else {
            return undefined; // User cancelled
        }
    }
    if (!pdfPath) {
        return undefined; // No PDF path available
    }
    // Attempt to extract text from the PDF
    try {
        const extractedText = await extractTextFromPdf(pdfPath);
        if (!extractedText || extractedText.trim() === '') {
            vscode.window.showWarningMessage('No text was extracted from the PDF. It might be empty or image-based.');
            return undefined;
        }
        return extractedText;
    }
    catch (error) {
        console.error('Error extracting text from PDF:', error);
        vscode.window.showErrorMessage(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
async function extractTextFromPdf(pdfPath) {
    // Check if PDF.js is available
    if (!pdfjsLib) {
        throw new Error('PDF.js library is not available');
    }
    try {
        // Convert file path to URL format that PDF.js can understand
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        // Create a document loading task with proper error handling
        const loadingTask = pdfjsLib.getDocument({ data });
        // Add better error handling
        loadingTask.onPassword = function (updatePassword) {
            vscode.window.showInputBox({
                prompt: 'This PDF is password protected. Enter the password:',
                password: true
            }).then(password => {
                if (password) {
                    updatePassword(password);
                }
                else {
                    throw new Error('Password required for PDF');
                }
            });
        };
        const pdf = await loadingTask.promise;
        let textContent = '';
        // Process each page with better error handling
        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // Better text extraction that preserves some formatting
                const pageText = content.items.map((item) => {
                    if (item.str) {
                        return item.str;
                    }
                    return '';
                }).join(' ');
                textContent += pageText + '\n\n';
            }
            catch (pageError) {
                console.error(`Error processing page ${i}:`, pageError);
                vscode.window.showWarningMessage(`Could not process page ${i} of the PDF. Skipping.`);
            }
        }
        return textContent;
    }
    catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function promptForPdfFile() {
    const newPdfPath = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'PDF Files': ['pdf'] }
    });
    if (newPdfPath && newPdfPath.length > 0) {
        const config = vscode.workspace.getConfiguration('docGen');
        await config.update('guidelinesPdfPath', newPdfPath[0].fsPath, vscode.ConfigurationTarget.Global);
        return newPdfPath[0].fsPath;
    }
    return undefined;
}
async function generateDocumentation(diffContent, guidelinesContent = '') {
    try {
        const config = vscode.workspace.getConfiguration('docGen');
        const modelName = "gemini-2.0-flash";
        const temperature = config.get('temperature') || 0.2;
        const maxTokens = config.get('maxTokens') || 2048;
        const GEMINI_API_KEY = await getApiKey();
        if (!GEMINI_API_KEY) {
            return "# Documentation Generation Failed\nNo API key provided.";
        }
        if (!diffContent || diffContent.trim() === '') {
            return "# Documentation Generation Failed\nNo diff content available for staged files.";
        }
        console.log('Getting ready to generate documentation');
        const MAX_DIFF_LENGTH = config.get('maxDiffLength') || 10000;
        let truncatedDiff = diffContent;
        if (diffContent.length > MAX_DIFF_LENGTH) {
            truncatedDiff = diffContent.substring(0, MAX_DIFF_LENGTH) + "\n\n[Content truncated due to size limitations]";
        }
        // Define the prompt based on whether we have guidelines
        let prompt = '';
        if (guidelinesContent && guidelinesContent.trim() !== '') {
            // Truncate guidelines if they're too long
            const MAX_GUIDELINES_LENGTH = 5000;
            const truncatedGuidelines = guidelinesContent.length > MAX_GUIDELINES_LENGTH
                ? guidelinesContent.substring(0, MAX_GUIDELINES_LENGTH) + "\n\n[Guidelines truncated due to size limitations]"
                : guidelinesContent;
            prompt = `You are a technical documentation assistant. Based on the following Git diff and guidelines, generate clear and concise documentation that explains:
1. What files were changed
2. What was added, modified, or removed
3. The purpose or impact of these changes (inferred from the code)

Guidelines:
${truncatedGuidelines}

Here is the diff:
${truncatedDiff}`;
        }
        else {
            prompt = `You are a technical documentation assistant. Based on the following Git diff, generate clear and concise documentation that explains:
1. What files were changed
2. What was added, modified, or removed
3. The purpose or impact of these changes (inferred from the code)

Here is the diff:
${truncatedDiff}`;
        }
        console.log('Initializing Gemini API');
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
        console.log('Creating model configuration');
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: maxTokens,
            },
            safetySettings: [
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
        });
        console.log('Sending request to Gemini API');
        const result = await model.generateContent(prompt);
        console.log('Processing API response');
        const response = await result.response;
        const generatedText = response.text();
        console.log('Documentation generated successfully');
        return `# Generated Documentation for Staged Files\n\n${generatedText}`;
    }
    catch (error) {
        console.error('Error calling Gemini API:', error);
        return `# Documentation Generation Failed\n\nError: ${error instanceof Error ? error.message : String(error)}`;
    }
}
async function getApiKey() {
    const config = vscode.workspace.getConfiguration('docGen');
    let apiKey = config.get('geminiApiKey');
    const autoPrompt = config.get('autoPromptForApiKey') || true;
    if (!apiKey && autoPrompt) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Gemini API key',
            password: true
        });
        if (apiKey) {
            await config.update('geminiApiKey', apiKey, vscode.ConfigurationTarget.Global);
        }
    }
    return apiKey;
}
// This method is called when your extension is deactivated
function deactivate() {
    console.log('Extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map