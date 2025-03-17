import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Create HTTP server to handle POST requests
export function startServer(): http.Server {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  
  // Listen on port 3000
  server.listen(3000, () => {
    console.log('HTTP server started on port 3000');
  });
  
  return server;
}

// Handle incoming HTTP requests
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  // Add CORS headers to all responses
  addCorsHeaders(res);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    handleOptionsRequest(res);
    return;
  }
  
  if (req.method === 'POST' && req.url === '/update') {
    handleUpdateRequest(req, res);
  } else if (req.method !== 'OPTIONS') {
    // Only return 404 for non-OPTIONS requests
    handleNotFound(res);
  }
}

// Add CORS headers to response
function addCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle OPTIONS request
function handleOptionsRequest(res: http.ServerResponse): void {
  res.writeHead(204);
  res.end();
}

// Handle 404 Not Found
function handleNotFound(res: http.ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
}

// Handle file update requests
function handleUpdateRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  let body = '';
  
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      processFileUpdate(data, res);
    } catch (error: any) {
      console.error('Error processing request:', error);
      sendErrorResponse(res, 500, error.message);
    }
  });
}

// Process file update data
function processFileUpdate(data: any, res: http.ServerResponse): void {
  const { name: newFileName, code, previousFileName } = data;
  
  if (!newFileName || !code) {
    sendErrorResponse(res, 400, 'Missing required fields');
    return;
  }
  
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    sendErrorResponse(res, 500, 'No workspace folder is open');
    return;
  }
  
  writeFile(workspacePath, newFileName, code);
  notifyWebview(newFileName, previousFileName);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}

// Get the workspace root path
function getWorkspacePath(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }
  
  return workspaceFolders[0].uri.fsPath;
}

// Write content to file
function writeFile(rootPath: string, fileName: string, content: string): void {
  const fullFilePath = path.join(rootPath, fileName);
  
  // Create directory structure if it doesn't exist
  const dirName = path.dirname(fullFilePath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(fullFilePath, content);
}

// Send error response
function sendErrorResponse(res: http.ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: message }));
}

// Notify webview about file update
function notifyWebview(newFileName: string, previousFileName?: string): void {
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
}