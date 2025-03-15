import * as vscode from 'vscode';
import { simpleGit, SimpleGit } from 'simple-git';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Better PDF.js handling
let pdfjsLib: any;
try {
  // Ensure we're using the correct import format
  pdfjsLib = require('pdfjs-dist/build/pdf.js');
  // Set the worker source
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} catch (error) {
  console.error('Failed to load PDF.js library:', error);
}

export function activate(context: vscode.ExtensionContext) {
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
      const git: SimpleGit = simpleGit(workspacePath);

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
        } catch (error) {
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
      } catch (error) {
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

    } catch (error) {
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
}

async function getGuidelinesPdfContent(): Promise<string | undefined> {
  // First, check if PDF.js is available
  if (!pdfjsLib) {
    vscode.window.showWarningMessage('PDF.js library is not available. Reinstalling the extension may fix this issue.');
    throw new Error('PDF.js library is not available');
  }

  // Check if a guidelines PDF is configured
  const config = vscode.workspace.getConfiguration('docGen');
  const guidelinesPdfPath = config.get<string>('guidelinesPdfPath');
  let pdfPath = '';

  if (guidelinesPdfPath && fs.existsSync(guidelinesPdfPath)) {
    // We have a configured PDF path that exists
    const useExisting = await vscode.window.showQuickPick(['Use existing PDF', 'Upload new PDF'], {
      placeHolder: 'Choose an option for guidelines PDF'
    });

    if (useExisting === 'Use existing PDF') {
      pdfPath = guidelinesPdfPath;
    } else if (useExisting === 'Upload new PDF') {
      const newPdfPath = await promptForPdfFile();
      if (newPdfPath) {
        pdfPath = newPdfPath;
        // Save the new path to configuration
        await config.update('guidelinesPdfPath', pdfPath, vscode.ConfigurationTarget.Global);
      } else {
        return undefined; // User cancelled
      }
    } else {
      return undefined; // User cancelled
    }
  } else {
    // No existing PDF path, prompt for one
    const newPdfPath = await promptForPdfFile();
    if (newPdfPath) {
      pdfPath = newPdfPath;
      // Save the new path to configuration
      await config.update('guidelinesPdfPath', pdfPath, vscode.ConfigurationTarget.Global);
    } else {
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
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    vscode.window.showErrorMessage(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function extractTextFromPdf(pdfPath: string): Promise<string> {
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
    loadingTask.onPassword = function (updatePassword: (password: string) => void) {
      vscode.window.showInputBox({
        prompt: 'This PDF is password protected. Enter the password:',
        password: true
      }).then(password => {
        if (password) {
          updatePassword(password);
        } else {
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
        const pageText = content.items.map((item: any) => {
          if (item.str) {
            return item.str;
          }
          return '';
        }).join(' ');

        textContent += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        vscode.window.showWarningMessage(`Could not process page ${i} of the PDF. Skipping.`);
      }
    }

    return textContent;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function promptForPdfFile(): Promise<string | undefined> {
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

async function generateDocumentation(diffContent: string, guidelinesContent: string = ''): Promise<string> {
  try {
    const config = vscode.workspace.getConfiguration('docGen');
    const modelName = "gemini-2.0-flash";
    const temperature = config.get<number>('temperature') || 0.2;
    const maxTokens = config.get<number>('maxTokens') || 2048;

    const GEMINI_API_KEY = await getApiKey();
    if (!GEMINI_API_KEY) {
      return "# Documentation Generation Failed\nNo API key provided.";
    }

    if (!diffContent || diffContent.trim() === '') {
      return "# Documentation Generation Failed\nNo diff content available for staged files.";
    }

    console.log('Getting ready to generate documentation');

    const MAX_DIFF_LENGTH = config.get<number>('maxDiffLength') || 10000;
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
    } else {
      prompt = `You are a technical documentation assistant. Based on the following Git diff, generate clear and concise documentation that explains:
1. What files were changed
2. What was added, modified, or removed
3. The purpose or impact of these changes (inferred from the code)

Here is the diff:
${truncatedDiff}`;
    }

    console.log('Initializing Gemini API');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    console.log('Creating model configuration');
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
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
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return `# Documentation Generation Failed\n\nError: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function getApiKey(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration('docGen');
  let apiKey = config.get<string>('geminiApiKey');

  const autoPrompt = config.get<boolean>('autoPromptForApiKey') || true;

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

export function deactivate() { }