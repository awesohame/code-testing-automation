"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Octokit } from "@octokit/rest"
import Editor from "@monaco-editor/react"
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
  Github,
  Loader2,
  FileCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress" 
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Type definitions
interface StandardizerResponse {
  transformed_code: string
}

interface StandardisedComponent {
  language: string
  transformed_code: string
  original_code: string
  verified: boolean
  description: string
}

interface GithubFile {
  path: string
  content: string
  standardized?: StandardisedComponent | null
  isProcessing?: boolean
}


// Utility function to detect language
const detectLanguage = (codeString: string, filePath: string = ""): string => {
  // First try to detect from file extension
  if (filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase()
    if (extension) {
      switch (extension) {
        case 'py': return 'python'
        case 'js': return 'javascript'
        case 'jsx': return 'javascript'
        case 'ts': return 'typescript'
        case 'tsx': return 'typescript'
        case 'java': return 'java'
        case 'html': return 'html'
        case 'css': return 'css'
        case 'go': return 'go'
        case 'rust': return 'rust'
      }
    }
  }
  
  // Fallback to content-based detection
  if (codeString.includes("def ") || codeString.includes("import ") || codeString.includes("print(")) {
    return "python"
  } else if (codeString.includes("function") || codeString.includes("const ") || codeString.includes("let ")) {
    return "javascript"
  } else if (codeString.includes("class") && codeString.includes("{")) {
    return "java"
  }
  return "text"
}

// Component 1: GitHub Repository Input
const GithubRepoInput: React.FC<{
  repoOwner: string
  setRepoOwner: (owner: string) => void
  repoName: string
  setRepoName: (name: string) => void
  fetchRepoFiles: () => Promise<void>
  isLoading: boolean
}> = ({ repoOwner, setRepoOwner, repoName, setRepoName, fetchRepoFiles, isLoading }) => {
  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-blue-400" />
          <CardTitle>GitHub Repository</CardTitle>
        </div>
        <CardDescription className="text-blue-100/60">
          Connect to a GitHub repository to analyze and standardize its code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="repoOwner">Repository Owner</Label>
            <Input
              id="repoOwner"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              placeholder="e.g., facebook"
              className="bg-[#0f172a] border-blue-500/20 text-blue-100/80 focus-visible:ring-blue-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repoName">Repository Name</Label>
            <Input
              id="repoName"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g., react"
              className="bg-[#0f172a] border-blue-500/20 text-blue-100/80 focus-visible:ring-blue-400"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-blue-500/20 pt-4">
        <Button
          onClick={fetchRepoFiles}
          disabled={isLoading || !repoOwner || !repoName}
          className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Files...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Fetch Latest Commit
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Component 2: CodeInputForm with Monaco Editor
const CodeInputForm: React.FC<{
  code: string
  setCode: (code: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleReset: () => void
  isLoading: boolean
  error: string | null
  language: string
}> = ({ code, setCode, handleSubmit, handleReset, isLoading, error, language }) => {
  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-400" />
          <CardTitle>Your Code</CardTitle>
        </div>
        <CardDescription className="text-blue-100/60">
          Edit your code below or paste code to standardize according to company guidelines
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="relative border border-blue-500/20 rounded-md overflow-hidden">
            <Editor
              height="300px"
              language={language || "javascript"}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
              }}
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
  )
}

// Component 3: CodeResultDisplay
const CodeResultDisplay: React.FC<{
  transformedCode: StandardisedComponent
  originalCode: string
  handleReset: () => void
  filePath?: string
}> = ({ transformedCode, originalCode, handleReset, filePath }) => {
  const [copied, setCopied] = useState<boolean>(false)
  const language = detectLanguage(originalCode, filePath)

  // Copy to clipboard functionality
  const copyToClipboard = () => {
    navigator.clipboard.writeText(transformedCode.transformed_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Description section */}
      {transformedCode.description && (
        <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <CardTitle>Standardization Summary</CardTitle>
            </div>
            {filePath && (
              <CardDescription className="text-blue-100/60">
                File: {filePath}
              </CardDescription>
            )}
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
                {language}
              </Badge>
            </div>
          </CardHeader>
          <div className="relative">
            <ScrollArea className="h-[400px] rounded-b-lg">
              <SyntaxHighlighter
                language={language}
                style={atomDark}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  backgroundColor: "#0f172a",
                  borderRadius: 0,
                }}
                showLineNumbers
              >
                {originalCode}
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
                        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
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
                language={language}
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
  )
}

// Component 4: GitHub Files Display (continued)
const GithubFilesDisplay: React.FC<{
  files: GithubFile[]
  recommendations: string[]
  standardizeGithubFile: (path: string) => Promise<void>
  setActiveFile: (file: GithubFile | null) => void
  processingFiles: boolean
  standardizeAllRecommended: () => Promise<void>
}> = ({ files, recommendations, standardizeGithubFile, setActiveFile, processingFiles, standardizeAllRecommended }) => {
  if (!files.length) return null

  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <CardTitle>Repository Files</CardTitle>
          </div>
          <Button
            onClick={standardizeAllRecommended}
            disabled={processingFiles || !recommendations.length}
            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
          >
            {processingFiles ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Standardize All Recommended
              </>
            )}
          </Button>
        </div>
        <CardDescription className="text-blue-100/60">
          Top 3 recommended files for standardization based on AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files
            .filter(file => recommendations.includes(file.path))
            .map((file) => (
              <div key={file.path} className="flex items-center justify-between p-3 rounded-md bg-gray-800/40 border border-blue-500/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-blue-100">{file.path}</span>
                  <Badge variant="outline" className="border-blue-500/20 text-blue-100/60">
                    {detectLanguage("", file.path)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {file.standardized && (
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Standardized
                    </Badge>
                  )}
                  {file.isProcessing && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      Processing
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveFile(file)}
                    className="text-blue-100/60 hover:text-blue-400 hover:bg-blue-500/10"
                  >
                    View
                  </Button>
                  {!file.standardized && !file.isProcessing && (
                    <Button
                      size="sm"
                      onClick={() => standardizeGithubFile(file.path)}
                      className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                    >
                      Standardize
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Component 5: File Viewer for GitHub files
const FileViewer: React.FC<{
  file: GithubFile
  onClose: () => void
}> = ({ file, onClose }) => {
  const language = detectLanguage("", file.path)
  
  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20 shadow-xl">
      <CardHeader className="pb-3 border-b border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg">{file.path}</CardTitle>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-blue-100/60 hover:text-blue-400 hover:bg-blue-500/10"
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <div className="relative">
        <ScrollArea className="h-[500px]">
          <SyntaxHighlighter
            language={language}
            style={atomDark}
            customStyle={{
              margin: 0,
              padding: "1rem",
              backgroundColor: "#0f172a",
              borderRadius: 0,
            }}
            showLineNumbers
          >
            {file.content}
          </SyntaxHighlighter>
        </ScrollArea>
      </div>
    </Card>
  )
}

interface StandardisedComponent {
  // Add your type definition here
  [key: string]: any;
}

interface GeminiRecommendation {
  recommended_files: string[];
}


const CodeStandardizer: React.FC = () => {
  // State management
  const [code, setCode] = useState<string>("")
  const [transformedCode, setTransformedCode] = useState<StandardisedComponent | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("input")
  
  // GitHub integration state
  const [repoOwner, setRepoOwner] = useState<string>("")
  const [repoName, setRepoName] = useState<string>("")
  const [githubFiles, setGithubFiles] = useState<GithubFile[]>([])
  const [fetchingFiles, setFetchingFiles] = useState<boolean>(false)
  const [recommendedFiles, setRecommendedFiles] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState<GithubFile | null>(null)
  const [processingFiles, setProcessingFiles] = useState<boolean>(false)
  const [fileProgress, setFileProgress] = useState<number>(0)
  
  // Detect language for Monaco editor
  const detectedLanguage = detectLanguage(code)
  
  // GitHub token from environment variables
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN
  
  // Effect to set repo details from URL params (if available)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const owner = params.get('owner')
    const repo = params.get('repo')
    
    if (owner) setRepoOwner(owner)
    if (repo) setRepoName(repo)
    
    // Auto-fetch if both parameters are present
    if (owner && repo) {
      fetchRepoFiles()
    }
  }, [])
  
  // Handle form submission for manual code input
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
        }
      )

      try {
        const parsedResponse = JSON.parse(response.data.transformed_code)
        setTransformedCode(parsedResponse)
        setActiveTab("result")
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
    setActiveFile(null)
  }
  
  // Fetch repository files from GitHub using token
  const fetchRepoFiles = async () => {
    if (!repoOwner || !repoName) return
    
    setFetchingFiles(true)
    setGithubFiles([])
    setRecommendedFiles([])
    setError(null)
    
    try {
      // Initialize Octokit with the token
      const octokit = new Octokit({
        auth: githubToken
      })
      
      // Get the latest commit
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner: repoOwner,
        repo: repoName,
        per_page: 1,
      })
      
      if (!commits.length) {
        setError("No commits found in this repository")
        setFetchingFiles(false)
        return
      }
      
      const latestCommitSha = commits[0].sha
      
      // Get the commit details with files
      const { data: commitDetails } = await octokit.rest.repos.getCommit({
        owner: repoOwner,
        repo: repoName,
        ref: latestCommitSha,
      })
      
      // Filter to only include code files (not images, etc.)
      const codeFiles = commitDetails.files?.filter(file => {
        const ext = file.filename.split('.').pop()?.toLowerCase()
        return ext && ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'html', 'css', 'sass', 'scss'].includes(ext)
      })
      
      if (!codeFiles?.length) {
        setError("No code files found in the latest commit")
        setFetchingFiles(false)
        return
      }
      
      // Get content for each file
      const filesWithContent: GithubFile[] = await Promise.all(
        codeFiles.map(async (file) => {
          try {
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner: repoOwner,
              repo: repoName,
              path: file.filename,
              ref: latestCommitSha, // Ensure we get content from the latest commit
            })
            
            // Handle file content
            let content = ""
            if ('content' in fileData && fileData.content) {
              content = Buffer.from(fileData.content, 'base64').toString('utf-8')
            }
            
            return {
              path: file.filename,
              content: content
            }
          } catch (err) {
            console.error(`Error fetching file ${file.filename}:`, err)
            return {
              path: file.filename,
              content: "// Error loading file content"
            }
          }
        })
      )
      
      setGithubFiles(filesWithContent)
      
      // Get AI recommendations using Gemini
      await getAIRecommendations(filesWithContent)
      
    } catch (err) {
      console.error("Error fetching repository files:", err)
      setError("Failed to fetch repository files. Please check the repository name and try again.")
    } finally {
      setFetchingFiles(false)
    }
  }
  
  // Get AI recommendations using Google Generative AI SDK
  const getAIRecommendations = async (files: GithubFile[]) => {
    try {
      // Import the Google Generative AI SDK
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      
      // Initialize the Gemini API with your API key
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      
      // Create a structure with filenames and first 100 characters of content
      const fileStructure = files.map(file => ({
        path: file.path,
        snippet: file.content.substring(0, 100) + "...",
        language: detectLanguage("", file.path)
      }))
      
      // Create prompt to identify files that would benefit from standardization
      const prompt = `
        Analyze these code files and identify the top 3 that would most benefit from code standardization.
        Consider factors like complex structure, inconsistent formatting, or non-standard patterns.
        Return only a JSON array of file paths, like this: ["path/to/file1.js", "path/to/file2.ts", "path/to/file3.jsx"]
        
        Files:
        ${JSON.stringify(fileStructure, null, 2)}
      `
      
      // Call Gemini model
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        // Extract the JSON array from the response
        const jsonMatch = text.match(/\[(.*)\]/s)
        if (jsonMatch) {
          const jsonStr = jsonMatch[0]
          const recommendedPaths = JSON.parse(jsonStr)
          // Validate that we have actual file paths
          const validPaths = recommendedPaths.filter((path: string) => 
            typeof path === 'string' && files.some(file => file.path === path)
          )
          
          if (validPaths.length > 0) {
            setRecommendedFiles(validPaths)
            return
          }
        }
        
        // Fallback to random selection if parsing fails
        throw new Error("Could not parse valid file paths from model output")
        
      } catch (parseErr) {
        console.error("Error parsing Gemini response:", parseErr)
        throw parseErr
      }
      
    } catch (err) {
      console.error("Error getting AI recommendations:", err)
      
      // Fallback to random selection if API fails
      const randomFiles = files
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, files.length))
        .map(file => file.path)
      
      setRecommendedFiles(randomFiles)
    }
  }
  
  // Standardize a single GitHub file
  const standardizeGithubFile = async (path: string) => {
    const fileIndex = githubFiles.findIndex(file => file.path === path)
    if (fileIndex === -1) return
    
    // Mark file as processing
    const updatedFiles = [...githubFiles]
    updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], isProcessing: true }
    setGithubFiles(updatedFiles)
    
    try {
      const response = await axios.post<StandardizerResponse>(
        "http://127.0.0.1:8001/standardize/",
        { code: githubFiles[fileIndex].content },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      
      const parsedResponse = JSON.parse(response.data.transformed_code)
      
      // Update file with standardized code
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        standardized: parsedResponse,
        isProcessing: false
      }
      setGithubFiles(updatedFiles)
      
      // Set active file to show result
      setActiveFile(updatedFiles[fileIndex])
      
    } catch (err) {
      console.error(`Error standardizing file ${path}:`, err)
      
      // Mark file as not processing
      updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], isProcessing: false }
      setGithubFiles(updatedFiles)
      
      setError(`Failed to standardize ${path}`)
    }
  }
  
  // Standardize all recommended files
  const standardizeAllRecommended = async () => {
    if (!recommendedFiles.length) return
    
    setProcessingFiles(true)
    setFileProgress(0)
    
    try {
      let processedCount = 0
      
      // Process each recommended file sequentially
      for (const path of recommendedFiles) {
        const fileIndex = githubFiles.findIndex(file => file.path === path)
        if (fileIndex === -1) continue
        
        // Mark file as processing
        const updatedFiles = [...githubFiles]
        updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], isProcessing: true }
        setGithubFiles(updatedFiles)
        
        try {
          const response = await axios.post<StandardizerResponse>(
            "http://127.0.0.1:8001/standardize/",
            { code: githubFiles[fileIndex].content },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          
          const parsedResponse = JSON.parse(response.data.transformed_code)
          
          // Update file with standardized code
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            standardized: parsedResponse,
            isProcessing: false
          }
          setGithubFiles(updatedFiles)
          
          // Update progress
          processedCount++
          setFileProgress(Math.round((processedCount / recommendedFiles.length) * 100))
          
        } catch (err) {
          console.error(`Error standardizing file ${path}:`, err)
          
          // Mark file as not processing
          updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], isProcessing: false }
          setGithubFiles(updatedFiles)
        }
      }
      
    } catch (err) {
      console.error("Error in batch processing:", err)
      setError("Failed to process all files")
    } finally {
      setProcessingFiles(false)
      setFileProgress(100)
    }
  }
  
  // View standardized GitHub file
  const viewStandardizedFile = (file: GithubFile) => {
    if (file.standardized) {
      setTransformedCode(file.standardized)
      setCode(file.content)
      setActiveTab("result")
      setActiveFile(null)
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

        {/* GitHub Integration Input */}
        <GithubRepoInput
          repoOwner={repoOwner}
          setRepoOwner={setRepoOwner}
          repoName={repoName}
          setRepoName={setRepoName}
          fetchRepoFiles={fetchRepoFiles}
          isLoading={fetchingFiles}
        />
        
        {/* GitHub Files and Recommendations */}
        {githubFiles.length > 0 && (
          <>
            {processingFiles && (
              <div className="mb-6">
                <Progress value={fileProgress} className="h-2 bg-blue-500/10" 
                  indicatorClassName="bg-blue-400" />
                <p className="text-blue-100/60 text-sm mt-2">
                  Standardizing files: {fileProgress}% complete
                </p>
              </div>
            )}
            
            <GithubFilesDisplay
              files={githubFiles}
              recommendations={recommendedFiles}
              standardizeGithubFile={standardizeGithubFile}
              setActiveFile={setActiveFile}
              processingFiles={processingFiles}
              standardizeAllRecommended={standardizeAllRecommended}
            />
          </>
        )}
        
        {/* File Viewer Modal */}
        {activeFile && (
          <div className="mb-6">
            {activeFile.standardized ? (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => viewStandardizedFile(activeFile)}
                  className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Standardized Result
                </Button>
              </div>
            ) : null}
            <FileViewer file={activeFile} onClose={() => setActiveFile(null)} />
          </div>
        )}

        {/* Tabs for Manual Code Input/Results */}
        {!activeFile && (
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
              <CodeInputForm
                code={code}
                setCode={setCode}
                handleSubmit={handleSubmit}
                handleReset={handleReset}
                isLoading={isLoading}
                error={error}
                language={detectedLanguage}
              />
            </TabsContent>

            <TabsContent value="result" className="m-0 space-y-6">
              {transformedCode && (
                <CodeResultDisplay
                  transformedCode={transformedCode}
                  originalCode={code}
                  handleReset={handleReset}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

// Type definitions to add at the top of your file


export default CodeStandardizer