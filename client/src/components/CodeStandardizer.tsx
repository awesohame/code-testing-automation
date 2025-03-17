"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import {
  Code,
  RefreshCw,
  CheckCircle,
  Copy,
  FileText,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Type definitions for API response
interface StandardizerResponse {
  transformed_code: string // API returns a string that needs to be parsed
}

interface StandardisedComponent {
  language: string
  transformed_code: string
  original_code: string
  verified: boolean
  description: string
}

const CodeStandardizer: React.FC = () => {
  // State management
  const [code, setCode] = useState<string>("")
  const [transformedCode, setTransformedCode] = useState<StandardisedComponent | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("input")

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Code input is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post<StandardizerResponse>(
        "http://127.0.0.1:8001/standardize/",
        { code: code },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      // Parse the string response into a JavaScript object
      try {
        const parsedResponse = JSON.parse(response.data.transformed_code)
        setTransformedCode(parsedResponse)
        setActiveTab("result")
        console.log("Parsed response:", parsedResponse)
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        setError("Failed to parse the server response")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("API Error:", err.response?.data)
        if (err.response?.status === 422) {
          setError("Invalid request format: Please check your code input")
        } else {
          setError(err.response?.data?.detail || "Failed to process your code")
        }
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the form
  const handleReset = () => {
    setCode("")
    setTransformedCode(null)
    setError(null)
    setActiveTab("input")
  }

  // Determine the language for syntax highlighting based on code content
  const detectLanguage = (codeString: string): string => {
    if (codeString.includes("def ") || codeString.includes("import ") || codeString.includes("print(")) {
      return "python"
    } else if (codeString.includes("function") || codeString.includes("const ") || codeString.includes("let ")) {
      return "javascript"
    } else if (codeString.includes("class") && codeString.includes("{")) {
      return "java"
    }
    return "text"
  }

  // Copy to clipboard functionality
  const copyToClipboard = () => {
    if (transformedCode) {
      navigator.clipboard.writeText(transformedCode.transformed_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-f8fafc p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Sparkles size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-f8fafc">Code Standardizer</h1>
            <p className="text-blue-100/80 mt-1">Transform your code to follow company standards and best practices</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900/60 backdrop-blur-sm border border-blue-500/20 p-1">
            <TabsTrigger
              value="input"
              className={cn(
                "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400",
                "data-[state=active]:shadow-none",
              )}
            >
              Input Code
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className={cn(
                "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400",
                "data-[state=active]:shadow-none",
              )}
              disabled={!transformedCode}
            >
              Standardized Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="m-0">
            <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  <CardTitle>Your Code</CardTitle>
                </div>
                <CardDescription className="text-blue-100/60">
                  Paste your code below to standardize it according to company guidelines
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="relative">
                    <Textarea
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="min-h-[300px] font-mono bg-[#0f172a] border-blue-500/20 text-blue-100/80 focus-visible:ring-blue-400 focus-visible:ring-offset-[#0f172a] placeholder:text-blue-100/40"
                      placeholder="Paste your code here..."
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mt-4 bg-red-500/10 border-red-500/30 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-blue-500/20 pt-4">
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="border-blue-500/20 text-blue-100/80 hover:bg-blue-500/10 hover:text-blue-100"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Standardize Code
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="result" className="m-0 space-y-6">
            {transformedCode && (
              <>
                {/* Description section */}
                {transformedCode.description && (
                  <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <CardTitle>Standardization Summary</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-blue-100/80 prose prose-invert prose-blue max-w-none">
                        {transformedCode.description}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-blue-400" />
                          <CardTitle>Original Code</CardTitle>
                        </div>
                        <Badge variant="outline" className="border-blue-500/20 text-blue-100/80">
                          {detectLanguage(code)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <div className="relative">
                      <ScrollArea className="h-[400px] rounded-b-lg">
                        <SyntaxHighlighter
                          language={detectLanguage(code)}
                          style={atomDark}
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            backgroundColor: "#0f172a",
                            borderRadius: 0,
                          }}
                          showLineNumbers
                        >
                          {code}
                        </SyntaxHighlighter>
                      </ScrollArea>
                    </div>
                  </Card>

                  <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-400" />
                          <CardTitle>Standardized Code</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {transformedCode.verified && (
                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={copyToClipboard}
                                  className="h-8 w-8 text-blue-100/60 hover:text-blue-400 hover:bg-blue-500/10"
                                >
                                  {copied ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{copied ? "Copied!" : "Copy to clipboard"}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardHeader>
                    <div className="relative">
                      <ScrollArea className="h-[400px] rounded-b-lg">
                        <SyntaxHighlighter
                          language={detectLanguage(transformedCode.transformed_code)}
                          style={atomDark}
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            backgroundColor: "#0f172a",
                            borderRadius: 0,
                          }}
                          showLineNumbers
                        >
                          {transformedCode.transformed_code || ""}
                        </SyntaxHighlighter>
                      </ScrollArea>
                    </div>
                  </Card>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleReset}
                    className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Process New Code
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CodeStandardizer

