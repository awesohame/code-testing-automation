"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { useParams } from "react-router-dom"
import Editor, { loader } from "@monaco-editor/react"
import type { GitHubContentItem } from "@/types"
import CodeAnalyzerPanel from "@/components/CodeAnalyzerPanel"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, FileIcon, FolderIcon, GithubIcon, Loader2, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"

const RepoViewerPage: React.FC = () => {
  const { repoOwner, repoName } = useParams<{
    repoOwner: string
    repoName: string
  }>()
  const [structure, setStructure] = useState<GitHubContentItem[]>([])
  const [selectedFile, setSelectedFile] = useState<GitHubContentItem | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const repoInfo={
    owner:repoOwner,
    name:repoName,
  }
  // Token should be stored securely in environment variables
  const token = import.meta.env.VITE_GITHUB_TOKEN

  // Fetch repository contents
  const fetchContents = async (path = ""): Promise<GitHubContentItem[]> => {
    try {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      const contents = await Promise.all(
        response.data.map(async (item: GitHubContentItem) => {
          if (item.type === "dir") {
            item.contents = await fetchContents(item.path)
          }
          return item
        }),
      )

      return contents
    } catch (err) {
      console.error(`Failed to fetch contents for path: ${path}`, err)
      throw err
    }
  }

  // Fetch file content
  const fetchFileContent = async (url: string) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
        },
      })
      setFileContent(atob(response.data.content))
    } catch (err) {
      console.error("Failed to fetch file content", err)
      setFileContent("Error loading file content")
    }
  }

  useEffect(() => {
    const fetchRepoStructure = async () => {
      try {
        const repoContents = await fetchContents()
        setStructure(repoContents)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch repository structure. Please check the repository name and try again.")
        setLoading(false)
      }
    }

    fetchRepoStructure()
  }, [repoOwner, repoName])

  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.defineTheme("customDarkTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "60a5fa", fontStyle: "italic" },
          { token: "keyword", foreground: "93c5fd" },
          { token: "string", foreground: "facc15" },
          { token: "variable", foreground: "f8fafc" },
          { token: "number", foreground: "e879f9" },
          { token: "function", foreground: "38bdf8" },
          // Add missing token rules that might default to red
          { token: "type", foreground: "4ade80" },
          { token: "identifier", foreground: "f8fafc" },
          { token: "operator", foreground: "e2e8f0" },
          { token: "delimiter", foreground: "e2e8f0" },
          { token: "tag", foreground: "93c5fd" },
          { token: "attribute.name", foreground: "60a5fa" },
          { token: "attribute.value", foreground: "facc15" }
        ],
        colors: {
          "editor.background": "#0f1721",
          "editor.foreground": "#f8fafc",
          "editorCursor.foreground": "#f8fafc",
          "editor.selectionHighlightBackground": "rgba(96, 165, 250, 0.2)",
          "editorIndentGuide.background": "rgba(96, 165, 250, 0.2)",
          "editorGutter.background": "#0f1721",
        },
      });
      monaco.editor.setTheme("customDarkTheme");
    });
  }, []);
  
  

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  // Handle file selection
  const handleFileClick = (file: GitHubContentItem) => {
    if (file.type === "file") {
      setSelectedFile(file)
      fetchFileContent(file.url)
    } else if (file.type === "dir") {
      toggleFolder(file.path)
    }
  }

  // Get language from file extension
  const getLanguage = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()
    const extensionMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
    }
    return extensionMap[extension || ""] || extension || "plaintext"
  }

  // Recursive component to render the folder structure
  const renderStructure = (items: GitHubContentItem[], level = 0) => {
    // Sort items: directories first, then files, both alphabetically
    const sortedItems = [...items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return (
      <ul className={cn("space-y-0.5", level === 0 ? "pl-0" : "pl-4")}>
        {sortedItems.map((item) => (
          <li key={item.path}>
            <div
              className={cn(
                "flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-all duration-200",
                "hover:bg-blue-500/10",
                selectedFile?.path === item.path && "bg-blue-500/10 text-blue-400",
              )}
              onClick={() => handleFileClick(item)}
            >
              {item.type === "dir" && (
                <span className="mr-1 text-blue-100/80">
                  {expandedFolders[item.path] ? (
                    <ChevronDown size={16} className="transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={16} className="transition-transform duration-200" />
                  )}
                </span>
              )}
              <span className={cn("mr-2", item.type === "dir" ? "text-blue-400" : "text-blue-100/80")}>
                {item.type === "dir" ? <FolderIcon size={16} /> : <FileIcon size={16} />}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  item.type === "dir" ? "font-medium text-blue-100" : "text-blue-100/80",
                )}
              >
                {item.name}
              </span>
            </div>
            {item.type === "dir" &&
              expandedFolders[item.path] &&
              item.contents &&
              renderStructure(item.contents, level + 1)}
          </li>
        ))}
      </ul>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a]">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a]">
        <div className="max-w-md p-6 bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-xl border border-blue-500/20">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-blue-100/80">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f172a]">
      {/* Left Panel - Folder Structure */}
      <aside className="w-1/5 min-w-[240px] bg-gray-900/60 backdrop-blur-sm shadow-xl border-r border-blue-500/20 flex flex-col">
        <div className="sticky top-0 bg-gray-900/90 p-4 border-b border-blue-500/20 z-10">
          <div className="flex items-center gap-2">
            <GithubIcon className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-f8fafc truncate">{repoName}</h2>
          </div>
          <div className="text-sm text-blue-100/80 mt-1 truncate">{repoOwner}</div>
        </div>
        <ScrollArea className="flex-grow p-4">{renderStructure(structure)}</ScrollArea>
      </aside>

      {/* Middle Panel - File Content */}
      <main className="flex-1 flex flex-col overflow-hidden border-r border-blue-500/20">
        <div className="bg-gray-900/90 text-f8fafc p-3 border-b border-blue-500/20 flex items-center h-[85px]">
          {selectedFile ? (
            <div className="flex items-center gap-2 w-full">
              <FileIcon size={20} className="text-blue-400" />
              <span className="font-medium truncate text-md">{selectedFile.path}</span>
            </div>
          ) : (
            <span className="text-blue-100/80 text-sm">No file selected</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <Editor
              height="100%"
              width="100%"
              language={getLanguage(selectedFile.name)}
              value={fileContent}
              theme="customDarkTheme"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontSize: 14,
                lineNumbers: "on",
                renderLineHighlight: "all",
                automaticLayout: true,
              }}
              loading={
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              }
            />
          ) : (
            <div className="flex justify-center items-center h-full bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/5">
              <div className="text-center p-6 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-blue-500/20 shadow-lg transform transition-all duration-300 hover:scale-105">
                <FileIcon className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-80" />
                <p className="text-blue-100/80">Select a file to view its content</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Panel - Code Analyzer */}
      <TooltipProvider>
        <div className="bg-gray-900/60 backdrop-blur-sm border-blue-500/20">
          <CodeAnalyzerPanel selectedFile={selectedFile} fileContent={fileContent} repoInfo={repoInfo} />
        </div>
      </TooltipProvider>
    </div>
  )
}

export default RepoViewerPage

