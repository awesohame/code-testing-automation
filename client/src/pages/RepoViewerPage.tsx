import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  FaFolder,
  FaFile,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { GitHubContentItem } from "@/types";
import CodeAnalyzerPanel from "@/components/CodeAnalyzerPanel";

const RepoViewerPage: React.FC = () => {
  const { repoOwner, repoName } = useParams<{
    repoOwner: string;
    repoName: string;
  }>();
  const [structure, setStructure] = useState<GitHubContentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubContentItem | null>(
    null
  );
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  // Token should be stored securely in environment variables
  const token = import.meta.env.VITE_GITHUB_TOKEN

  // Fetch repository contents
  const fetchContents = async (
    path: string = ""
  ): Promise<GitHubContentItem[]> => {
    try {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const contents = await Promise.all(
        response.data.map(async (item: GitHubContentItem) => {
          if (item.type === "dir") {
            item.contents = await fetchContents(item.path);
          }
          return item;
        })
      );

      return contents;
    } catch (err) {
      console.error(`Failed to fetch contents for path: ${path}`, err);
      throw err;
    }
  };

  // Fetch file content
  const fetchFileContent = async (url: string) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      setFileContent(atob(response.data.content));
    } catch (err) {
      console.error("Failed to fetch file content", err);
      setFileContent("Error loading file content");
    }
  };

  useEffect(() => {
    const fetchRepoStructure = async () => {
      try {
        const repoContents = await fetchContents();
        setStructure(repoContents);
        setLoading(false);
      } catch (err) {
        setError(
          "Failed to fetch repository structure. Please check the repository name and try again."
        );
        setLoading(false);
      }
    };

    fetchRepoStructure();
  }, [repoOwner, repoName]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Handle file selection
  const handleFileClick = (file: GitHubContentItem) => {
    if (file.type === "file") {
      setSelectedFile(file);
      fetchFileContent(file.url);
    } else if (file.type === "dir") {
      toggleFolder(file.path);
    }
  };

  // Get language from file extension
  const getLanguage = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
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
    };
    return extensionMap[extension || ""] || extension || "plaintext";
  };

  // Recursive component to render the folder structure
  const renderStructure = (items: GitHubContentItem[], level = 0) => {
    // Sort items: directories first, then files, both alphabetically
    const sortedItems = [...items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return (
      <ul className="list-none" style={{ paddingLeft: level === 0 ? 0 : 16 }}>
        {sortedItems.map((item) => (
          <li key={item.path} className="my-1">
            <div
              className={`flex items-center py-1 px-2 rounded cursor-pointer 
                                ${
                                  selectedFile?.path === item.path
                                    ? "bg-gray-700"
                                    : "hover:bg-gray-700"
                                }
                            `}
              onClick={() => handleFileClick(item)}
            >
              {item.type === "dir" && (
                <span className="mr-1 text-gray-400">
                  {expandedFolders[item.path] ? (
                    <FaChevronDown size={12} />
                  ) : (
                    <FaChevronRight size={12} />
                  )}
                </span>
              )}
              <span
                className={`mr-2 ${
                  item.type === "dir" ? "text-yellow-400" : "text-blue-400"
                }`}
              >
                {item.type === "dir" ? <FaFolder /> : <FaFile />}
              </span>
              <span
                className={`${
                  item.type === "dir"
                    ? "font-medium text-gray-300"
                    : "text-gray-400"
                } truncate`}
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
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen  overflow-hidden">
      {/* Left Panel - Folder Structure */}
      <aside className="w-1/5 bg-black/70 shadow-md overflow-y-auto border-r border-gray-700 flex flex-col">
        <div className="sticky top-0 bg-black/70 p-4 border-b border-gray-700 z-10">
          <h2 className="text-lg font-bold text-white flex items-center truncate">
            <span className="mr-2">📂</span>
            {repoName}
          </h2>
          <div className="text-sm text-gray-400 mt-1 truncate">{repoOwner}</div>
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          {renderStructure(structure)}
        </div>
      </aside>

      {/* Middle Panel - File Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-black/70 text-white p-2 border-b border-gray-700 flex items-center">
          {selectedFile ? (
            <>
              <span className="mr-2 p-1 mb-1 text-blue-400">
                <FaFile />
              </span>
              <span className="font-medium truncate">{selectedFile.path}</span>
            </>
          ) : (
            <span className="text-gray-400">No file selected</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <Editor
              height="100%"
              width="100%"
              language={getLanguage(selectedFile.name)}
              value={fileContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontSize: 14,
                lineNumbers: "on",
                renderLineHighlight: "all",
                automaticLayout: true, //This is important to take whole width
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-full bg-black/70">
              <div className="text-center p-6">
                <div className="text-6xl text-gray-600 mb-4">📄</div>
                <p className="text-gray-400">
                  Select a file to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Panel - Dummy for now */}
      <div>
        <CodeAnalyzerPanel
          selectedFile={selectedFile}
          fileContent={fileContent}
        />
      </div>
    </div>
  );
};

export default RepoViewerPage;
