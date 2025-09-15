"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import Editor from "@monaco-editor/react"
import { Zap, Wand2, PlayCircle, Terminal } from "lucide-react"
import { StepIndicator } from "@/components/StepIndicator"
import { FileExplorer } from "@/components/FileExplorer"
import { APITable } from "@/components/APITable"
import { TestResults } from "@/components/TestResults"
import type { Repository, APIEndpoint, TestResult, GitHubContentItem, APIParameter } from "@/types"
import RepositoryView from "@/components/RepositoryView"
import axios from "axios"
import { useUserData } from "@/hooks/useUserData"

const STEPS = ["Repository Selection", "API Detection", "Script Generation", "Test Execution"]

function parseK6Results(results: string): TestResult {
  const metrics = {
    http_req_duration: {
      avg: 0,
      min: 0,
      med: 0,
      max: 0,
      p90: 0,
      p95: 0,
    },
    http_reqs: 0,
    iterations: 0,
    vus: 0,
    vus_max: 0,
    success_rate: 0,
    rps: 0,
    http_req_blocked: 0,
    http_req_connecting: 0,
    http_req_tls_handshaking: 0,
    http_req_sending: 0,
    http_req_waiting: 0,
    http_req_receiving: 0,
    endpoints: [] as { method: string; path: string; success: boolean; successRate: number }[],
  }

  const lines = results.split("\n")

  // Extract individual endpoint check results
  const checkLines = lines.filter((line) => line.trim().startsWith("✓") || line.trim().startsWith("✗"))

  for (const line of checkLines) {
    if (line.includes("status is")) {
      const isSuccess = line.trim().startsWith("✓")
      const methodMatch = line.match(/(GET|POST|PUT|DELETE|PATCH)/)
      const method = methodMatch ? methodMatch[1] : "UNKNOWN"

      // Extract success rate if available
      let successRate = isSuccess ? 100 : 0
      const nextLine = lines[lines.indexOf(line) + 1]
      if (nextLine && nextLine.includes("↳")) {
        const rateMatch = nextLine.match(/(\d+)%/)
        if (rateMatch) {
          successRate = Number.parseInt(rateMatch[1])
        }
      }

      // Extract endpoint path (this is approximated since actual path isn't in output)
      const pathHint = line.includes("data")
        ? "/data"
        : line.includes("users")
          ? "/users"
          : line.includes("data")
            ? "/data"
            : "/"

      metrics.endpoints.push({
        method,
        path: pathHint,
        success: isSuccess,
        successRate,
      })
    }
  }

  // Extract checks success rate
  const checksLine = lines.find((line) => line.includes("checks"))
  if (checksLine) {
    const checksMatch = checksLine.match(/(\d+\.\d+)%/)
    if (checksMatch) {
      metrics.success_rate = Number.parseFloat(checksMatch[1])
    }
  }

  // Extract http_req_failed rate
  const failedLine = lines.find((line) => line.includes("http_req_failed"))
  if (failedLine) {
    const failedMatch = failedLine.match(/(\d+\.\d+)%/)
    if (failedMatch && metrics.success_rate === 0) {
      metrics.success_rate = 100 - Number.parseFloat(failedMatch[1])
    }
  }

  for (const line of lines) {
    if (line.includes("http_req_duration")) {
      if (line.includes("expected_response:true")) continue

      const durMatch = line.match(
        /avg=([\d.]+)(\w*)\s+min=([\d.]+)(\w*)\s+med=([\d.]+)(\w*)\s+max=([\d.]+)(\w*)\s+p$$90$$=([\d.]+)(\w*)\s+p$$95$$=([\d.]+)(\w*)/,
      )
      if (durMatch) {
        const convertToMs = (value: string, unit: string): number => {
          if (unit === "µs") return Number.parseFloat(value) / 1000
          if (unit === "s") return Number.parseFloat(value) * 1000
          return Number.parseFloat(value)
        }

        metrics.http_req_duration = {
          avg: convertToMs(durMatch[1], durMatch[2]),
          min: convertToMs(durMatch[3], durMatch[4]),
          med: convertToMs(durMatch[5], durMatch[6]),
          max: convertToMs(durMatch[7], durMatch[8]),
          p90: convertToMs(durMatch[9], durMatch[10]),
          p95: convertToMs(durMatch[11], durMatch[12]),
        }
      }
    } else if (line.includes("http_reqs")) {
      const match = line.match(/:\s*([\d.]+)/)
      if (match) metrics.http_reqs = Number.parseFloat(match[1])
    } else if (line.includes("iterations")) {
      const match = line.match(/:\s*([\d.]+)/)
      if (match) metrics.iterations = Number.parseFloat(match[1])
    } else if (line.includes("vus ")) {
      const match = line.match(/:\s*([\d.]+)/)
      if (match) metrics.vus = Number.parseFloat(match[1])
    } else if (line.includes("vus_max")) {
      const match = line.match(/:\s*([\d.]+)/)
      if (match) metrics.vus_max = Number.parseFloat(match[1])
    } else if (line.includes("http_req_blocked")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_blocked = value / 1000
        else if (unit === "s") metrics.http_req_blocked = value * 1000
        else metrics.http_req_blocked = value
      }
    } else if (line.includes("http_req_connecting")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_connecting = value / 1000
        else if (unit === "s") metrics.http_req_connecting = value * 1000
        else metrics.http_req_connecting = value
      }
    } else if (line.includes("http_req_tls_handshaking")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_tls_handshaking = value / 1000
        else if (unit === "s") metrics.http_req_tls_handshaking = value * 1000
        else metrics.http_req_tls_handshaking = value
      }
    } else if (line.includes("http_req_sending")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_sending = value / 1000
        else if (unit === "s") metrics.http_req_sending = value * 1000
        else metrics.http_req_sending = value
      }
    } else if (line.includes("http_req_waiting")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_waiting = value / 1000
        else if (unit === "s") metrics.http_req_waiting = value * 1000
        else metrics.http_req_waiting = value
      }
    } else if (line.includes("http_req_receiving")) {
      const match = line.match(/avg=([\d.]+)(\w*)/)
      if (match) {
        const value = Number.parseFloat(match[1])
        const unit = match[2]
        if (unit === "µs") metrics.http_req_receiving = value / 1000
        else if (unit === "s") metrics.http_req_receiving = value * 1000
        else metrics.http_req_receiving = value
      }
    }
  }

  // Get RPS from reported value
  const rpsLine = lines.find((line) => line.includes("http_reqs"))
  if (rpsLine) {
    const rpsMatch = rpsLine.match(/(\d+\.\d+)\/s/)
    if (rpsMatch) {
      metrics.rps = Number.parseFloat(rpsMatch[1])
    } else {
      metrics.rps = metrics.http_reqs / 10
    }
  }

  return {
    timestamp: new Date().toISOString(),
    metrics,
  }
}

// Terminal Modal Component
const TerminalModal = ({ isOpen, onClose, terminalOutput }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300 font-mono ml-2">Terminal Output</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto bg-black font-mono text-sm">
          <pre className="text-green-400 whitespace-pre-wrap">{terminalOutput}</pre>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { user } = useUserData()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([])
  const [testScript, setTestScript] = useState("")
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [githubRepos, setGithubRepos] = useState<any[]>([])
  const [username, setUsername] = useState("awesohame")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [tempUsername, setTempUsername] = useState("awesohame")
  const [error, setError] = useState("")
  const [repoStructure, setRepoStructure] = useState<GitHubContentItem[]>([])
  const [structureLoading, setStructureLoading] = useState(false)
  const [structureError, setStructureError] = useState("")
  const [apiDetectionError, setApiDetectionError] = useState("")
  const [scriptGenerationError, setScriptGenerationError] = useState("")
  // New state variables for terminal modal
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState("")
  // New state for test running loader
  const [isRunningTests, setIsRunningTests] = useState(false)

  const fetchRepoContents = async (owner: string, repo: string, path = ""): Promise<GitHubContentItem[]> => {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch repository contents")

      const data = await response.json()
      const contents = await Promise.all(
        data.map(async (item: any) => {
          const node: GitHubContentItem = {
            name: item.name,
            path: item.path,
            type: item.type,
          }

          if (item.type === "dir") {
            node.contents = await fetchRepoContents(owner, repo, item.path)
          }

          return node
        }),
      )

      return contents
    } catch (error) {
      console.error("Error fetching contents:", error)
      throw error
    }
  }

  const handleDetectAPIs = async () => {
    if (!selectedRepo) return

    setIsLoading(true)
    setApiDetectionError("")

    try {
      const repoUrl = `https://github.com/${username}/${selectedRepo.name}.git`
      const response = await fetch("http://localhost:5000/api/extract-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to detect APIs")
      }

      // Convert the API metadata to our endpoint format
      const convertedEndpoints: APIEndpoint[] = data.apiMetadata.endpoints.map((endpoint: any, index: number) => {
        const params: APIParameter[] = [
          ...(endpoint.bodyParams?.map((param: any) => ({
            key: param.key,
            required: param.required || false,
            type: param.type || "string",
          })) || []),
          ...(endpoint.queryParams?.map((param: any) => ({
            key: param.key,
            required: false,
            type: "string",
          })) || []),
        ]

        return {
          id: index.toString(),
          method: endpoint.method as APIEndpoint["method"],
          path: endpoint.path,
          params,
          description: endpoint.description || "No description available",
        }
      })

      setEndpoints(convertedEndpoints)
    } catch (error) {
      console.error("Error detecting APIs:", error)
      setApiDetectionError("Failed to detect APIs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAIScript = async () => {
    setIsGeneratingAI(true)
    setScriptGenerationError("")

    try {
      // Convert our endpoints back to the format expected by the API
      const apiMetadata = {
        endpoints: endpoints.map((endpoint) => ({
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.description,
          bodyParams: endpoint.params
            .filter((param) => param.required)
            .map((param) => ({
              key: param.key,
              required: param.required,
              type: param.type,
            })),
          headers: [],
        })),
      }

      const response = await fetch("http://localhost:5000/api/generate-test-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiMetadata }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to generate test script")
      }

      setTestScript(data.testScript)
    } catch (error) {
      console.error("Error generating test script:", error)
      setScriptGenerationError("Failed to generate test script. Please try again.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleRunTests = async () => {
    if (!selectedRepo || !testScript) return

    setIsLoading(true)
    setIsRunningTests(true)
    try {
      const response = await fetch("http://localhost:5000/api/run-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: `https://github.com/${username}/${selectedRepo.name}.git`,
          testScript,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to run tests")
      }
      console.log("Test results:", data.results)

      // Save the raw terminal output for the modal
      setTerminalOutput(data.results)

      const parsedResults = parseK6Results(data.results)
      console.log("parsed Test results:", parsedResults)
      setTestResults(parsedResults)
      const storeResults = async () => {
        await axios.post("http://localhost:5000/api/loadtests", {
          clerkId: user?.clerkId,
          metrics: parsedResults,
          rawOutput: testScript,
          endpoints: endpoints,
          reponame: selectedRepo.name,
          githubUsername: username,
        })
      }
      storeResults()
      setCurrentStep(3)
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setIsLoading(false)
      setIsRunningTests(false)
    }
  }

  useEffect(() => {
    if (selectedRepo && currentStep === 1) {
      const fetchStructure = async () => {
        setStructureLoading(true)
        setStructureError("")
        try {
          const owner = username
          const contents = await fetchRepoContents(owner, selectedRepo.name)
          setRepoStructure(contents)
        } catch (error) {
          setStructureError("Failed to fetch repository structure")
          setRepoStructure([])
        } finally {
          setStructureLoading(false)
        }
      }

      fetchStructure()
    }
  }, [selectedRepo, currentStep, username])

  const fetchRepos = async (user: string) => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`https://api.github.com/users/${user}/repos`)
      if (!response.ok) {
        throw new Error(response.status === 404 ? "User not found" : "Failed to fetch repositories")
      }
      const data = await response.json()
      setGithubRepos(data)
      localStorage.setItem("publicRepos", JSON.stringify(data))
      localStorage.setItem("githubUsername", user)
    } catch (error) {
      console.error("Error fetching repositories:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch repositories")
      setGithubRepos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const storedUsername = localStorage.getItem("githubUsername")
    if (storedUsername) {
      setUsername(storedUsername)
      setTempUsername(storedUsername)
    }

    const storedRepos = localStorage.getItem("publicRepos")
    if (storedRepos) {
      setGithubRepos(JSON.parse(storedRepos))
    } else {
      fetchRepos(username)
    }
  }, [])

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tempUsername.trim() !== username) {
      setUsername(tempUsername.trim())
      await fetchRepos(tempUsername.trim())
    }
    setIsEditingUsername(false)
  }

  const convertedRepos: Repository[] = githubRepos.map((repo) => ({
    id: repo.id.toString(),
    name: repo.name,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    lastUpdated: new Date(repo.updated_at).toLocaleDateString(),
  }))

  const filteredRepositories = convertedRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRepositoryClick = (repo: Repository) => {
    setSelectedRepo(repo)
    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {currentStep !== 0 && <StepIndicator currentStep={currentStep} steps={STEPS} />}

      {currentStep === 0 && (
        <RepositoryView
          username={username}
          isEditingUsername={isEditingUsername}
          setIsEditingUsername={setIsEditingUsername}
          tempUsername={tempUsername}
          setTempUsername={setTempUsername}
          handleUsernameSubmit={handleUsernameSubmit}
          fetchRepos={fetchRepos}
          isLoading={isLoading}
          error={error}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredRepositories={filteredRepositories}
          handleRepositoryClick={handleRepositoryClick}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}
        />
      )}

      {currentStep === 1 && (
        <PanelGroup direction="horizontal">
          <Panel defaultSize={30}>
            <FileExplorer files={repoStructure} isLoading={structureLoading} error={structureError} />
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-blue-500 transition-colors" />

          <Panel>
            <div className="h-full bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">API Endpoints</h2>
                  <p className="text-gray-400 mt-1">Detected API endpoints from repository analysis</p>
                </div>
                <button
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDetectAPIs}
                  disabled={isLoading}
                >
                  <Zap className="w-4 h-4" />
                  <span>{isLoading ? "Detecting..." : "Detect APIs"}</span>
                </button>
              </div>

              {apiDetectionError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                  {apiDetectionError}
                </div>
              )}

              {isLoading && endpoints.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-700/50 rounded-md mb-2"></div>
                      <div className="h-20 bg-gray-700/30 rounded-md"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <APITable
                  endpoints={endpoints}
                  onUpdate={(endpoint) => {
                    // Check if this endpoint already exists in the array
                    const existingIndex = endpoints.findIndex((e) => e.id === endpoint.id)

                    if (existingIndex >= 0) {
                      // Update existing endpoint
                      const updatedEndpoints = [...endpoints]
                      updatedEndpoints[existingIndex] = endpoint
                      setEndpoints(updatedEndpoints)
                    } else {
                      // Add new endpoint
                      setEndpoints([...endpoints, endpoint])
                    }
                  }}
                  onDelete={(id) => setEndpoints(endpoints.filter((e) => e.id !== id))}
                />
              )}

              {endpoints.length > 0 && (
                <div className="flex justify-end mt-6">
                  <button
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to Script Generation
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Load Test Script</h2>
                <p className="text-gray-400 mt-1">Generate and customize your load testing script</p>
              </div>
              <div className="flex space-x-3">
                <button
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                  onClick={handleGenerateAIScript}
                  disabled={isGeneratingAI}
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{isGeneratingAI ? "Generating..." : "Generate AI Script"}</span>
                </button>
                <button
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                  onClick={handleRunTests}
                  disabled={isLoading || isRunningTests}
                >
                  {isRunningTests ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>Run Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {scriptGenerationError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                {scriptGenerationError}
              </div>
            )}

            <Editor
              height="400px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={testScript}
              onChange={(value) => setTestScript(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 20 },
              }}
            />

            {/* Add loader after Run Tests button */}
            {isRunningTests && (
              <div className="flex items-center justify-center bg-gray-800/90 rounded-lg absolute top-0 h-full w-full">
                <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                <p className="text-gray-300">Running load tests on your API endpoints...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Test Results</h2>
            {testResults && (
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center space-x-2 transition-colors"
                onClick={() => setIsTerminalModalOpen(true)}
              >
                <Terminal className="w-4 h-4" />
                <span>View Terminal Logs</span>
              </button>
            )}
          </div>

          {testResults ? (
            <TestResults results={testResults} />
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Processing test results...</p>
            </div>
          )}

          {/* Terminal Modal */}
          <TerminalModal
            isOpen={isTerminalModalOpen}
            onClose={() => setIsTerminalModalOpen(false)}
            terminalOutput={terminalOutput}
          />
        </div>
      )}
    </div>
  )
}

export default App