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
exports.ChatbotViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const generative_ai_1 = require("@google/generative-ai");
// WebView Provider for the sidebar
class ChatbotViewProvider {
    _extensionUri;
    _view;
    genAI;
    model;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        // Initialize Gemini API
        const apiKey = "AIzaSyDecvZH39UXP4k7WPBTffGJmVoinOGKrBc";
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Set up message handling
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getActiveFileInfo':
                    vscode.commands.executeCommand('http-file-updater.updateFileInfo');
                    break;
                case 'sendChatMessage':
                    this._handleChatMessage(message);
                    break;
                case 'toggleSpeaking':
                    console.log('Toggle speaking:', message.isSpeaking);
                    break;
            }
        });
    }
    updateContent(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
    async _handleChatMessage(message) {
        // Show typing indicator
        if (this._view) {
            this._view.webview.postMessage({
                type: 'typing',
                isTyping: true
            });
        }
        try {
            let prompt = "Remember to keep your response as short as possible. " + message.text;
            let isEditMode = false;
            let originalContent = "";
            let fileName = "";
            // Include file context if provided
            if (message.context && message.context.filename) {
                isEditMode = message.editMode || false;
                originalContent = message.context.content;
                fileName = message.context.filename;
                if (isEditMode) {
                    prompt = `I'm working with a file named ${message.context.filename} (${message.context.language}). 
Here's the current code:
\`\`\`${message.context.language}
${message.context.content}
\`\`\`

My request is: ${message.text}

IMPORTANT: Respond ONLY with the complete modified code. Do not include any explanations, markdown formatting, or other text before or after the code.`;
                }
                else {
                    prompt = `I'm working with a file named ${message.context.filename} (${message.context.language}). 
Here's the relevant content:
\`\`\`${message.context.language}
${message.context.content}
\`\`\`

My question is: ${message.text}`;
                }
            }
            // Use generateContent instead of chat for simpler implementation
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            // Send response back to webview
            this.updateContent({
                type: 'chatResponse',
                text: text
            });
            // Handle edit mode with diff view
            if (isEditMode) {
                await vscode.commands.executeCommand('http-file-updater.handleAIResponse', text, {
                    isEditMode: true,
                    fileName: fileName,
                    originalContent: originalContent
                });
            }
        }
        catch (error) {
            console.error('Error calling Gemini:', error);
            this.updateContent({
                type: 'chatResponse',
                text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`
            });
        }
        finally {
            // Hide typing indicator
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'typing',
                    isTyping: false
                });
            }
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to the icon file
        const iconPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'icon.png');
        // And convert it to a URI that the webview can use
        const iconUri = webview.asWebviewUri(iconPath);
        return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Video Mentor</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      padding: 10px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      margin: 0;
    }
    
    /* Video container */
    .video-container {
      position: relative;
      width: 100%;
      height: 200px; /* Fixed height */
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      background-color: #1a1a1a;
      min-height: 200px; /* Ensure minimum height */
      flex-shrink: 0; /* Prevent shrinking */
    }
    
    .video-frame {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer; /* Show pointer cursor when hovering over video */
    }
    
    .video-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: linear-gradient(to top, rgba(24, 24, 27, 0.9), transparent);
    }
    
    .controls-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .control-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .control-button {
      height: 32px;
      width: 32px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background-color: rgba(39, 39, 42, 0.8);
      color: var(--vscode-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .control-button:hover {
      background-color: rgba(63, 63, 70, 0.8);
    }
    
    .ai-label {
      font-size: 12px;
      background-color: rgba(39, 39, 42, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--vscode-descriptionForeground);
    }
    
    .toggle-video-button {
  padding: 4px 8px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
  font-size: 12px;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
    
    .toggle-video-button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    /* Chat Interface Styles */
    .chat-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex: 1;
      min-height: 0; /* Important for allowing child elements to scroll */
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background-color: var(--vscode-editor-background);
      border-radius: 4px;
      margin-bottom: 10px;
      min-height: 150px; /* Smaller minimum height */
    }
    
    .message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 16px;
      max-width: 80%;
      word-wrap: break-word;
    }
    
    .user-message {
      background-color: var(--vscode-activityBarBadge-background);
      color: var(--vscode-activityBarBadge-foreground);
      align-self: flex-end;
      margin-left: auto;
    }
    
    .ai-message {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      align-self: flex-start;
    }
    
    .chat-input-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-bottom: 10px;
      flex-shrink: 0; /* Prevent shrinking */
    }
    
    .checkbox-container {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .context-checkbox {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    
    .context-checkbox input {
      margin-right: 6px;
    }
    
    .input-row {
      display: flex;
      width: 100%;
    }
    
    .chat-input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      margin-right: 8px;
    }
    
    .send-button {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .send-button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    .hidden {
      display: none;
    }
    
    /* Typing indicator styles */
    .typing-indicator {
      display: flex;
      align-items: center;
      column-gap: 6px;
      padding: 12px !important;
    }
    
    .typing-indicator .dot {
      width: 8px;
      height: 8px;
      background-color: var(--vscode-button-secondaryForeground);
      border-radius: 50%;
      opacity: 0.7;
      animation: bounce 1.4s infinite ease-in-out;
    }
    
    .typing-indicator .dot:nth-child(1) { animation-delay: 0s; }
    .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

    /* Add to your existing CSS in the head section */
    .ai-message {
      font-family: var(--vscode-font-family);
      line-height: 1.5;
    }

    .ai-message pre {
      background-color: var(--vscode-editor-background);
      border-radius: 6px;
      padding: 10px;
      overflow-x: auto;
      margin: 10px 0;
    }

    .ai-message code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.9em;
    }

    .ai-message p {
      margin: 8px 0;
    }

    .ai-message a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }

    .ai-message a:hover {
      text-decoration: underline;
    }

    .ai-message ul, .ai-message ol {
      margin-left: 20px;
      padding-left: 0;
    }

    .ai-message table {
      border-collapse: collapse;
      margin: 10px 0;
    }

    .ai-message th, .ai-message td {
      border: 1px solid var(--vscode-panel-border);
      padding: 6px 10px;
    }

    .ai-message th {
      background-color: var(--vscode-editor-lineHighlightBackground);
    }
    
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
  </style>
</head>
<body>
  <!-- Toggle video button -->
  <button id="toggle-video-button" class="toggle-video-button">Hide Video</button>
  
  <!-- Video container -->
  <div id="video-container" class="video-container">
    <!-- Static video placeholder -->
    <video class="video-frame" muted autoplay loop playsinline id="video-element">
      <source src="https://res.cloudinary.com/dtcvnuxoc/video/upload/v1742144062/d62srg4lmhf3lndhlzed.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    
    <!-- Video controls overlay -->
    <div class="video-controls">
      <div class="controls-container">
        <div class="control-group">
          <button class="control-button" id="mic-toggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>
        <div class="control-group">
          <span class="ai-label">AI Assistant</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Chat Interface -->
  <div class="chat-container">
    <div class="chat-messages" id="chat-messages">
      <!-- Messages will be inserted here -->
    </div>
    <div class="chat-input-container">
      <div class="checkbox-container">
        <div class="context-checkbox">
          <input type="checkbox" id="send-context" />
          <label for="send-context">Send context of <span id="current-file">No file open</span></label>
        </div>
        <div class="context-checkbox">
          <input type="checkbox" id="edit-mode" />
          <label for="edit-mode">Edit mode</label>
        </div>
      </div>
      <div class="input-row">
        <input type="text" id="chat-input" class="chat-input" placeholder="Ask your AI mentor a question..." />
        <button id="send-button" class="send-button">Send</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    // Video control elements
    const videoContainer = document.getElementById('video-container');
    const videoElement = document.getElementById('video-element');
    const toggleVideoButton = document.getElementById('toggle-video-button');
    const micToggle = document.getElementById('mic-toggle');
    
    // Chat elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const sendContextCheckbox = document.getElementById('send-context');
    const editModeCheckbox = document.getElementById('edit-mode');
    const currentFileSpan = document.getElementById('current-file');
    
    // File context data
    let currentFileContext = {
      filename: "",
      content: "",
      language: ""
    };
    
    // Toggle video visibility
    let isVideoVisible = true;
    toggleVideoButton.addEventListener('click', () => {
      isVideoVisible = !isVideoVisible;
      videoContainer.classList.toggle('hidden');
      toggleVideoButton.textContent = isVideoVisible ? 'Hide Video' : 'Show Video';
    });
    
    // Video play/pause toggle functionality
    let isVideoPlaying = false;
    videoElement.pause(); // Initially paused
    
    videoElement.addEventListener('click', () => {
      if (isVideoPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      isVideoPlaying = !isVideoPlaying;
    });
    
    // Mic toggle functionality
    let isSpeaking = false;
    micToggle.addEventListener('click', () => {
      isSpeaking = !isSpeaking;
      vscode.postMessage({
        command: 'toggleSpeaking',
        isSpeaking: isSpeaking
      });
    });
    
    // Add a welcome message from the AI
    window.addEventListener('load', () => {
      addMessage("Hello! I'm your AI video mentor. How can I help you today?", 'ai');
      
      // Request the current file information
      vscode.postMessage({
        command: 'getActiveFileInfo'
      });
    });
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.type === 'chatResponse') {
        // Add AI response to chat
        addMessage(message.text, 'ai');
      } else if (message.type === 'activeFileInfo') {
        // Update current file information
        currentFileContext.filename = message.filename;
        currentFileContext.content = message.content;
        currentFileContext.language = message.language;
        
        // Update the UI to show the current file
        currentFileSpan.textContent = message.filename || "No file open";
        
        // Enable/disable context checkbox based on whether a file is open
        sendContextCheckbox.disabled = !message.filename;
        editModeCheckbox.disabled = !message.filename;
      } else if (message.type === 'typing') {
        if (message.isTyping) {
          showTypingIndicator();
        } else {
          hideTypingIndicator();
        }
      }
    });
    
    function addMessage(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${sender}-message\`;
      
      // For AI messages, render markdown
      if (sender === 'ai') {
        // Import marked library for markdown rendering
        const scriptElement = document.createElement('script');
        scriptElement.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
        document.head.appendChild(scriptElement);
        
        scriptElement.onload = () => {
          // Set inner HTML with sanitized markdown
          messageDiv.innerHTML = marked.parse(text);
          
          // Add syntax highlighting for code blocks
          const highlightScript = document.createElement('script');
          highlightScript.src = "https://cdn.jsdelivr.net/npm/highlight.js/highlight.min.js";
          document.head.appendChild(highlightScript);
          
          highlightScript.onload = () => {
            // Add highlight.js CSS
            const highlightCSS = document.createElement('link');
            highlightCSS.rel = 'stylesheet';
            highlightCSS.href = 'https://cdn.jsdelivr.net/npm/highlight.js/styles/vs2015.min.css';
            document.head.appendChild(highlightCSS);
            
            // Apply highlighting to code blocks
            document.querySelectorAll('pre code').forEach((block) => {
              hljs.highlightBlock(block);
            });
          };
        };
      } else {
        // For user messages, just use text
        messageDiv.textContent = text;
      }
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message ai-message typing-indicator';
      typingDiv.id = 'typing-indicator';
      typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideTypingIndicator() {
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }
    
    function sendMessage() {
      const message = chatInput.value.trim();
      if (message) {
        // Add user message to chat
        addMessage(message, 'user');
        
        // Prepare message data
        const messageData = {
          command: 'sendChatMessage',
          text: message
        };
        
        // Add file context if checkbox is checked
        if (sendContextCheckbox.checked && currentFileContext.filename) {
          messageData.context = currentFileContext;
          messageData.editMode = editModeCheckbox.checked;
        }
        
        // Send message to extension
        vscode.postMessage(messageData);
        
        // Clear input
        chatInput.value = '';
      }
    }
    
    // Event listeners for chat
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  </script>
</body>
</html>
    `;
    }
}
exports.ChatbotViewProvider = ChatbotViewProvider;
//# sourceMappingURL=webviewProvider.js.map