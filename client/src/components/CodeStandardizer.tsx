import React, { useState } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Code,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  Terminal,
  FileText,
} from "lucide-react";

// Type definitions for API response
interface StandardizerResponse {
  transformed_code: string; // API returns a string that needs to be parsed
}

interface StandardisedComponent {
  language: string;
  transformed_code: string;
  original_code: string;
  verified: boolean;
  description: string;
}

const CodeStandardizer: React.FC = () => {
  // State management
  const [code, setCode] = useState<string>("");
  const [transformedCode, setTransformedCode] =
    useState<StandardisedComponent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Code input is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<StandardizerResponse>(
        "http://127.0.0.1:8000/standardize/",
        { code: code },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the string response into a JavaScript object
      try {
        const parsedResponse = JSON.parse(response.data.transformed_code);
        setTransformedCode(parsedResponse);
        console.log("Parsed response:", parsedResponse);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setError("Failed to parse the server response");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("API Error:", err.response?.data);
        if (err.response?.status === 422) {
          setError("Invalid request format: Please check your code input");
        } else {
          setError(err.response?.data?.detail || "Failed to process your code");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setCode("");
    setTransformedCode(null);
    setError(null);
  };

  // Determine the language for syntax highlighting based on code content
  const detectLanguage = (codeString: string): string => {
    if (
      codeString.includes("def ") ||
      codeString.includes("import ") ||
      codeString.includes("print(")
    ) {
      return "python";
    } else if (
      codeString.includes("function") ||
      codeString.includes("const ") ||
      codeString.includes("let ")
    ) {
      return "javascript";
    } else if (codeString.includes("class") && codeString.includes("{")) {
      return "java";
    }
    return "text";
  };

  // Copy to clipboard functionality
  const copyToClipboard = () => {
    if (transformedCode) {
      navigator.clipboard.writeText(transformedCode.transformed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center space-x-3">
          <Terminal size={32} className="text-green-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Code Standardizer</h1>
            <p className="text-gray-400 mt-1">
              Transform your code to follow company standards
            </p>
          </div>
        </div>

        {!transformedCode ? (
          <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Your Code
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-500">
                    <Code size={20} />
                  </div>
                  <textarea
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-64 pl-10 pr-4 py-3 rounded-md font-mono bg-black border border-gray-800 text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none placeholder-gray-700"
                    placeholder="Paste your code here..."
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 flex items-start">
                  <XCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-green-900 disabled:text-green-200 transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Standardize Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-black transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Description section */}
            {transformedCode.description && (
              <div className="bg-gray-900 rounded-lg p-4 shadow-xl border border-gray-800">
                <div className="flex items-center mb-2">
                  <FileText size={20} className="mr-2 text-green-500" />
                  <h2 className="text-lg font-semibold text-white">
                    Description
                  </h2>
                </div>
                <div className="text-gray-300">
                  {transformedCode.description}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <Code size={20} className="mr-2 text-green-500" />
                    Original Code
                  </h2>
                </div>
                <div className="overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
                  <SyntaxHighlighter
                    language={detectLanguage(code)}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      backgroundColor: "#0a0a0a",
                    }}
                    showLineNumbers
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <Code size={20} className="mr-2 text-green-500" />
                    Standardized Code
                  </h2>
                  <div className="flex items-center">
                    {transformedCode.verified && (
                      <span className="mr-2 text-green-400 flex items-center">
                        <CheckCircle size={16} className="mr-1" />
                        Verified
                      </span>
                    )}
                    <button
                      onClick={copyToClipboard}
                      className="p-2 rounded-md transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle size={18} className="text-green-400" />
                      ) : (
                        <Copy size={18} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
                  <SyntaxHighlighter
                    language={detectLanguage(transformedCode.transformed_code)}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      backgroundColor: "#0a0a0a",
                    }}
                    showLineNumbers
                  >
                    {transformedCode.transformed_code || ""}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black transition-colors"
              >
                Process New Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeStandardizer;
