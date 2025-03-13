import React, { useState, useEffect } from "react";
import { GitHubContentItem } from "@/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { languageMap } from "@/lib/constants";
import axios from "axios";

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
        "Detailed instructions on how to set up and run the tests in a local environment",
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
      3. Detailed instructions on how to set up the testing environment, install necessary dependencies, and run the tests in a local environment
      4. An analysis of test coverage including estimated percentage, covered functions, uncovered areas, and notes
      
      Make sure the test code:
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
      const response = await axios.post("http://localhost:3000/update", returns, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error syncing with extension:", error);
    }
  };

  // TestGenerator.jsx - Return portion
  return (
    <aside className="h-full w-[500px] bg-black/70 shadow-lg overflow-y-auto border-l border-gray-800 flex flex-col">
      <div className="sticky top-0 bg-black/70 p-4 border-b border-gray-800 z-10">
        <h2 className="text-lg font-bold text-gray-200">Test Generator</h2>
        {selectedFile && (
          <div className="text-sm text-gray-400 mt-1 truncate">
            Testing: {selectedFile.name}
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-300">Generating tests and analysis...</p>
          </div>
        ) : selectedFile ? (
          error ? (
            <div className="bg-red-950 rounded-md p-4 m-4 border border-red-800">
              <h3 className="text-red-400 font-medium mb-2">Error</h3>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={generateTest}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm"
              >
                Try Again
              </button>
            </div>
          ) : testResult ? (
            <div className="flex flex-col h-full">
              <div className="border-b border-gray-800">
                <div className="flex">
                  {["test", "instructions", "coverage"].map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 text-sm ${activeTab === tab
                          ? "text-green-400 border-b-2 border-green-400"
                          : "text-gray-500 hover:text-gray-300"
                        }`}
                      onClick={() => setActiveTab(tab as any)}
                    >
                      {tab === "test"
                        ? "Test Code"
                        : tab === "instructions"
                          ? "Setup Instructions"
                          : "Coverage Analysis"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-4">
                {activeTab === "test" && (
                  <div className="bg-gray-900 rounded-md p-3">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-green-400 font-medium">
                          Generated Test
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          ({testResult.language})
                        </span>
                      </div>
                      <button
                        onClick={generateTest}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs"
                      >
                        Regenerate
                      </button>
                    </div>
                    <pre className="bg-black/70 p-3 rounded overflow-x-auto text-sm text-gray-300 max-h-[calc(100vh-240px)]">
                      {testResult.testCode}
                    </pre>
                    <button className="" onClick={handleSyncWithExtension}>
                      sync
                    </button>
                  </div>
                )}

                {activeTab === "instructions" && (
                  <div className="bg-gray-900 rounded-md p-4">
                    <h3 className="text-green-400 font-medium mb-3">
                      Setup Instructions
                    </h3>
                    <div className="bg-black/70 p-3 rounded text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                      {testResult.instructions}
                    </div>
                  </div>
                )}

                {activeTab === "coverage" && (
                  <div className="bg-gray-900 rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-green-400 font-medium">
                        Coverage Analysis
                      </h3>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full border-4 border-gray-700 flex items-center justify-center relative">
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${testResult.coverage.percentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-white text-xs font-bold z-10">
                            {testResult.coverage.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">
                          Covered Functions
                        </h4>
                        <ul className="bg-black/70 rounded p-2 text-sm">
                          {testResult.coverage.coveredFunctions.length > 0 ? (
                            testResult.coverage.coveredFunctions.map(
                              (func, idx) => (
                                <li
                                  key={idx}
                                  className="text-green-300 py-1 px-2 border-b border-gray-800 last:border-0"
                                >
                                  ✓ {func}
                                </li>
                              )
                            )
                          ) : (
                            <li className="text-gray-400 py-1 px-2">
                              No specific functions listed
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">
                          Uncovered Areas
                        </h4>
                        <ul className="bg-black/70 rounded p-2 text-sm">
                          {testResult.coverage.uncoveredAreas.length > 0 ? (
                            testResult.coverage.uncoveredAreas.map(
                              (area, idx) => (
                                <li
                                  key={idx}
                                  className="text-red-400 py-1 px-2 border-b border-gray-800 last:border-0"
                                >
                                  ✗ {area}
                                </li>
                              )
                            )
                          ) : (
                            <li className="text-gray-400 py-1 px-2">
                              No uncovered areas listed
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">
                          Notes
                        </h4>
                        <div className="bg-black/70 rounded p-3 text-sm text-gray-300 whitespace-pre-wrap">
                          {testResult.coverage.notes}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <p className="text-gray-400 mb-4">
                Ready to generate tests for this file.
              </p>
              <button
                onClick={generateTest}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md"
              >
                Generate Test
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-40 p-4">
            <div className="text-5xl text-gray-600 mb-4">🧪</div>
            <p className="text-gray-400">
              Select a file to generate unit tests
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CodeAnalyzerPanel;
