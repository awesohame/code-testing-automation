"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { GitHubContentItem } from "@/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { languageMap } from "@/lib/constants";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  TestTube2,
  RefreshCw,
  Code,
  FileCode2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

interface CodeAnalyzerPanelProps {
  selectedFile: GitHubContentItem | null;
  fileContent: string;
}

// Define the schema for the structured output
interface TestGenerationResult {
  language: string;
  testCode: string;
  instructions: string;
  newFile: string;
  coverage: {
    percentage: number;
    coveredFunctions: string[];
    uncoveredAreas: string[];
    notes: string;
  };
}

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    language: {
      type: SchemaType.STRING,
      description: "Programming language of the test code",
    },
    testCode: {
      type: SchemaType.STRING,
      description: "The complete unit test code for the file",
    },
    instructions: {
      type: SchemaType.STRING,
      description:
        "Detailed instructions on how to set up and run the tests in a local environment stepwise and use markdown to get good results",
    },
    newFile: {
      type: SchemaType.STRING,
      description:
        "the name of the file to be created in order to paste the test code into",
    },
    coverage: {
      type: SchemaType.OBJECT,
      description: "Analysis of test coverage",
      properties: {
        percentage: {
          type: SchemaType.NUMBER,
          description: "Estimated percentage of code coverage by the tests",
        },
        coveredFunctions: {
          type: SchemaType.ARRAY,
          description: "List of functions/methods covered by the tests",
          items: {
            type: SchemaType.STRING,
          },
        },
        uncoveredAreas: {
          type: SchemaType.ARRAY,
          description: "Areas of the code not covered by the tests",
          items: {
            type: SchemaType.STRING,
          },
        },
        notes: {
          type: SchemaType.STRING,
          description: "Additional notes on test coverage and quality",
        },
      },
      required: ["percentage", "coveredFunctions", "uncoveredAreas", "notes"],
    },
  },
  required: ["language", "testCode", "newFile", "instructions", "coverage"],
};

const CodeAnalyzerPanel: React.FC<CodeAnalyzerPanelProps> = ({
  selectedFile,
  fileContent,
}) => {
  const [testResult, setTestResult] = useState<TestGenerationResult | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "test" | "instructions" | "coverage"
  >("test");

  // Initialize the Google Generative AI client
  // API key should be stored in environment variables in production
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_GEMINI_API_KEY || ""
  );

  // Generate test when file content changes
  useEffect(() => {
    if (
      selectedFile &&
      fileContent &&
      fileContent !== "Error loading file content"
    ) {
      generateTest();
    } else {
      setTestResult(null);
      setError("");
    }
  }, [selectedFile, fileContent]);

  const getFileLanguage = (filename: string): string => {
    const extension = filename?.split(".").pop()?.toLowerCase() || "";
    return languageMap[extension] || "Unknown";
  };

  const generateTest = async () => {
    if (!selectedFile || !fileContent) return;

    setIsGenerating(true);
    setError("");

    try {
      // Get the model with schema config
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema as any,
        },
      });

      const language = getFileLanguage(selectedFile.name);
      const fileName = selectedFile.name;

      // Prepare the prompt
      const prompt = `Generate a comprehensive unit test for the following ${language} code file named "${fileName}". 
      
      The file content is:
      \`\`\`
      ${fileContent}
      \`\`\`
      
      Return a structured response with:
      1. The programming language of the test
      2. Complete test code that covers all significant functions and edge cases
      3. Short and brief stepwise instructions on how to install necessary dependencies.
      4. An analysis of test coverage including estimated percentage, covered functions, uncovered areas, and notes
      
      Make sure the test code:
      - Has proper routing as it is going to be stored in the folder ./server/__tests__/ so mostly the imports will be "../file/path/from/root/"
      - Uses appropriate testing framework for the language
      - Includes proper mocking of external dependencies
      - Has clear descriptions of what each test verifies
      - Can be run in a typical development environment`;

      // Generate the content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonResponse = JSON.parse(response.text());
      console.log(jsonResponse);

      setTestResult(jsonResponse);
    } catch (err: any) {
      console.error("Failed to generate test:", err);
      setError(`Failed to generate test: ${err.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncWithExtension = async () => {
    if (!testResult) return;
    console.log(testResult);

    const newFileName = selectedFile?.path
      .split("/")
      .slice(0, -1)
      .concat([testResult.newFile])
      .join("/");

    const returns = {
      name: newFileName,
      code: testResult?.testCode,
      previousFileName: selectedFile?.path,
    };

    console.log(returns);

    try {
      const response = await axios.post(
        "http://localhost:3000/update",
        returns,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error syncing with extension:", error);
    }
  };

  return (
    <aside className="h-full w-[500px] bg-gray-900/60 backdrop-blur-sm shadow-xl overflow-hidden border-l border-blue-500/20 flex flex-col">
      <div className="sticky top-0 bg-gray-900/90 p-4 border-b border-blue-500/20 z-10">
        <div className="flex items-center gap-2">
          <TestTube2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-f8fafc">Test Generator</h2>
        </div>
        {selectedFile && (
          <div className="text-sm text-blue-100/80 mt-1 truncate">
            Testing: {selectedFile.name}
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
            <p className="text-blue-100/80">Generating tests and analysis...</p>
          </div>
        ) : selectedFile ? (
          error ? (
            <div className="bg-blue-900/10 rounded-md p-4 m-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <h3 className="text-red-400 font-medium">Error</h3>
              </div>
              <p className="text-blue-100/80 mb-4">{error}</p>
              <Button
                onClick={generateTest}
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : testResult ? (
            <div className="flex flex-col h-full">
              <Tabs
                defaultValue="test"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="w-full"
              >
                <div className="border-b border-blue-500/20">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger
                      value="test"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 data-[state=active]:shadow-none",
                        "text-blue-100/80 hover:text-f8fafc"
                      )}
                    >
                      Test Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="instructions"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 data-[state=active]:shadow-none",
                        "text-blue-100/80 hover:text-f8fafc"
                      )}
                    >
                      Setup Instructions
                    </TabsTrigger>
                    <TabsTrigger
                      value="coverage"
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 data-[state=active]:shadow-none",
                        "text-blue-100/80 hover:text-f8fafc"
                      )}
                    >
                      Coverage Analysis
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-grow h-[calc(100vh-100px)] ">
                  <TabsContent value="test" className="m-0 p-4 w-fit">
                    <div className="bg-gray-900/90 rounded-md p-2 border border-blue-500/20 w-[450px] ">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-blue-400" />
                          <span className="text-f8fafc font-medium">
                            Generated Test
                          </span>
                          <Badge
                            variant="outline"
                            className="text-blue-100/80 border-blue-500/30"
                          >
                            {testResult.language}
                          </Badge>
                        </div>
                        <Button
                          onClick={generateTest}
                          variant="outline"
                          size="sm"
                          className="h-8 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-md overflow-x-auto text-sm text-blue-100/80 max-h-[calc(100vh-260px)] border border-blue-500/10">
                        <pre className="font-mono">{testResult.testCode}</pre>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          onClick={handleSyncWithExtension}
                          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Sync with Editor
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="instructions" className="m-0 p-4">
                    <div className="bg-gray-900/90 rounded-md p-4 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <FileCode2 className="h-4 w-4 text-blue-400" />
                        <h3 className="text-f8fafc font-medium">
                          Setup Instructions
                        </h3>
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-md text-sm text-blue-100/80 overflow-y-auto whitespace-pre-wrap border border-blue-500/10">
                        <ReactMarkdown>{testResult.instructions}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="coverage" className="m-0 p-4">
                    <div className="bg-gray-900/90 rounded-md p-4 border border-blue-500/20">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                          <h3 className="text-f8fafc font-medium">
                            Coverage Analysis
                          </h3>
                        </div>
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className="stroke-blue-500/10"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className="stroke-blue-400"
                              strokeWidth="3"
                              strokeDasharray={`${testResult.coverage.percentage}, 100`}
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"
                            />
                            <text
                              x="18"
                              y="18"
                              dominantBaseline="middle"
                              textAnchor="middle"
                              className="text-xs font-bold"
                              fill="white"
                            >
                              {testResult.coverage.percentage}%
                            </text>
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-f8fafc text-sm font-medium mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                            Covered Functions
                          </h4>
                          <div className="bg-[#0f172a] rounded-md border border-blue-500/10">
                            {testResult.coverage.coveredFunctions.length > 0 ? (
                              <ul className="divide-y divide-blue-500/10">
                                {testResult.coverage.coveredFunctions.map(
                                  (func, idx) => (
                                    <li
                                      key={idx}
                                      className="py-2 px-3 text-sm text-green-400 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="break-all">{func}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <div className="py-2 px-3 text-sm text-blue-100/60">
                                No specific functions listed
                              </div>
                            )}
                          </div>
                        </div>

                        {/* <div>
                          <h4 className="text-f8fafc text-sm font-medium mb-2 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                            Uncovered Areas
                          </h4>
                          <div className="bg-[#0f172a] rounded-md border border-blue-500/10">
                            {testResult.coverage.uncoveredAreas.length > 0 ? (
                              <ul className="divide-y divide-blue-500/10">
                                {testResult.coverage.uncoveredAreas.map((area, idx) => (
                                  <li key={idx} className="py-2 px-3 text-sm text-red-400 flex items-center gap-2">
                                    <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="break-all">{area}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="py-2 px-3 text-sm text-blue-100/60">No uncovered areas listed</div>
                            )}
                          </div>
                        </div> */}

                        <div>
                          <h4 className="text-f8fafc text-sm font-medium mb-2">
                            Notes
                          </h4>
                          <div className="bg-[#0f172a] p-3 rounded-md text-sm text-blue-100/80 whitespace-pre-wrap border border-blue-500/10">
                            {testResult.coverage.notes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <p className="text-blue-100/80 mb-4">
                Ready to generate tests for this file.
              </p>
              <Button
                onClick={generateTest}
                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
              >
                <TestTube2 className="h-4 w-4 mr-2" />
                Generate Test
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <div className="bg-blue-500/10 p-4 rounded-full mb-4">
              <TestTube2 className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-blue-100/80">
              Select a file to generate unit tests
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CodeAnalyzerPanel;
