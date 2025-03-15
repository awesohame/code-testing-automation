# Git Documentation Generator

A VSCode extension that automatically generates clear and concise documentation for your staged Git changes using Google's Gemini AI.

## Features

- 📄 **Automatic Documentation**: Generate markdown documentation for all staged files in your Git repository
- 🤖 **AI-Powered**: Leverages Google's Gemini AI to create intelligent summaries of code changes
- 📋 **Custom Guidelines**: Incorporate your team's documentation standards from a PDF file
- 🔄 **Git Integration**: Works directly with your Git workflow
- 🔐 **Secure**: Your API key is stored securely in VSCode settings

![Demo of the extension](https://via.placeholder.com/800x450.png?text=Doc-Gen+Extension+Demo)

## Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Git Documentation Generator"
4. Click Install

## Requirements

- Git must be installed and the workspace must be a Git repository
- A Google Gemini API key is required ([Get one here](https://ai.google.dev/))
- VSCode version 1.75.0 or higher

## Getting Started

1. **Set your API key**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "Configure Documentation Generator Settings"
   - Enter your Gemini API key
   
2. **Stage your changes**:
   - Make changes to your code
   - Stage the files you want to document using Git

3. **Generate documentation**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "Generate Documentation for Staged Files"
   - A new markdown file will open with your generated documentation

## Using Documentation Guidelines

You can provide a PDF file containing your team's documentation guidelines:

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Set Guidelines PDF" 
3. Select your guidelines PDF file

The extension will incorporate these guidelines when generating documentation.

## Commands

- `Generate Documentation for Staged Files`: Generate documentation based on staged changes
- `Configure Documentation Generator Settings`: Open settings for the extension
- `Clear Gemini API Key`: Remove the stored API key
- `Set Guidelines PDF`: Select a PDF file containing documentation guidelines

## Extension Settings

This extension contributes the following settings:

* `docGen.geminiApiKey`: Your Gemini API key
* `docGen.guidelinesPdfPath`: Path to the PDF file containing documentation guidelines
* `docGen.autoPromptForApiKey`: Automatically prompt for API key if not set
* `docGen.temperature`: Temperature setting for Gemini model (0.0 to 1.0)
* `docGen.maxTokens`: Maximum tokens for Gemini model response
* `docGen.maxDiffLength`: Maximum length of diff content to send to Gemini API
* `docGen.enablePdfGuidelines`: Enable using PDF guidelines for documentation generation

## Troubleshooting

### PDF Guidelines Not Working

If you encounter issues with the PDF guidelines feature:

1. Make sure the PDF is not password protected
2. Check that the PDF contains readable text (not just images)
3. Try using a simpler PDF format
4. Check the extension logs for specific errors

### API Key Issues

If you're having trouble with your API key:

1. Ensure your Gemini API key is valid and has not expired
2. Try clearing and re-entering your API key
3. Check your internet connection

## Privacy and Security

This extension:
- Does not send any data except to the Gemini API for documentation generation
- Stores your API key securely in VSCode's settings storage
- Only processes files that you have explicitly staged in Git
- Does not collect any usage data or telemetry

## Release Notes

### 1.0.0

Initial release with support for:
- Documentation generation for staged Git files
- Integration with Google Gemini AI
- PDF guidelines integration
- Customizable AI parameters

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License - see the LICENSE file for details.