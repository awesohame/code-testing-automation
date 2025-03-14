"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCode2,
  Clock,
  Shield,
  Settings,
  Download,
  Filter,
  Code2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
// import { useNavigate } from "react-router-dom";

// Enhanced mock data
const testFiles = [
  {
    name: "auth.test.ts",
    status: "passed",
    time: "2.3s",
    coverage: "95%",
    priority: "high",
    type: "integration",
    lastRun: "2 mins ago",
    author: "Sarah Chen",
    assertions: 24,
    failures: 0,
  },
  {
    name: "login.test.ts",
    status: "failed",
    time: "1.8s",
    coverage: "85%",
    priority: "medium",
    type: "unit",
    lastRun: "5 mins ago",
    author: "John Doe",
    assertions: 12,
    failures: 2,
  },
];

const environmentConfigs: any = {
  development: {
    cpu: "4 cores",
    memory: "8GB RAM",
    storage: "256GB SSD",
    network: "1Gbps",
  },
  staging: {
    cpu: "8 cores",
    memory: "16GB RAM",
    storage: "512GB SSD",
    network: "2Gbps",
  },
  production: {
    cpu: "16 cores",
    memory: "32GB RAM",
    storage: "1TB SSD",
    network: "10Gbps",
  },
};

const testCategories = [
  { name: "Unit Tests", count: 245, passing: 232 },
  { name: "Integration Tests", count: 128, passing: 120 },
  { name: "E2E Tests", count: 56, passing: 52 },
  { name: "Performance Tests", count: 34, passing: 30 },
];

const vulnerabilityData = [
  { severity: "Critical", count: 2 },
  { severity: "High", count: 5 },
  { severity: "Medium", count: 12 },
  { severity: "Low", count: 25 },
];

export default function TestingPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [activeTab, setActiveTab] = useState("overview");
  // const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  // const [stageId, setStageId] = useState(null);
  // const navigate = useNavigate();

  const testStages = [
    { id: "setup", name: "Environment Setup", duration: 2000 },
    { id: "unit", name: "Unit Tests", duration: 2000 },
    { id: "integration", name: "Integration Tests", duration: 2000 },
    { id: "e2e", name: "End-to-End Tests", duration: 2000 },
    { id: "performance", name: "Performance Tests", duration: 2000 },
    { id: "security", name: "Security Scans", duration: 2000 },
  ];

  const generateResults = () => ({
    summary: {
      total: 245,
      passed: Math.floor(Math.random() * 200 + 40),
      failed: Math.floor(Math.random() * 10),
      skipped: Math.floor(Math.random() * 5),
      duration: "12m 34s",
    },
    stages: {
      setup: { status: "passed", duration: "1.2s" },
      unit: {
        status: "passed",
        total: 120,
        passed: 118,
        failed: 2,
        duration: "3.5s",
      },
      integration: {
        status: "passed",
        total: 45,
        passed: 44,
        failed: 1,
        duration: "4.2s",
      },
      e2e: {
        status: "failed",
        total: 30,
        passed: 28,
        failed: 2,
        duration: "5.1s",
      },
      performance: {
        status: "warning",
        metrics: {
          avgResponseTime: "234ms",
          p95ResponseTime: "450ms",
          maxConcurrentUsers: 1000,
        },
        duration: "3.3s",
      },
      security: {
        status: "passed",
        findings: {
          critical: 0,
          high: 0,
          medium: 2,
          low: 5,
        },
        duration: "4.0s",
      },
    },
  });

  useEffect(() => {
    if (isRunning) {
      let currentIndex = 0;

      const runStage = () => {
        if (currentIndex < testStages.length) {
          const stage = testStages[currentIndex];
          setCurrentStage({
            ...stage,
            progress: 0,
          } as any);

          const progressInterval = setInterval(() => {
            setCurrentStage((prev: any) => ({
              ...prev,
              progress: prev.progress + 2,
            }));
          }, stage.duration / 50);

          setTimeout(() => {
            clearInterval(progressInterval);
            currentIndex++;
            runStage();
          }, stage.duration);
        } else {
          setIsRunning(false);
          setCurrentStage(null);
          setResults(generateResults() as any);
        }
      };

      runStage();
    }
  }, [isRunning]);

  // const getStatusColor = (status: any) => {
  //   switch (status) {
  //     case "passed":
  //       return "bg-green-500";
  //     case "failed":
  //       return "bg-red-500";
  //     case "warning":
  //       return "bg-yellow-500";
  //     default:
  //       return "bg-gray-500";
  //   }
  // };

  const handleViewError = () => {
    // router.push(`/test-error`);

  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className=" justify-between items-center">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Testing Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive test management and analysis
          </p>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <Select value={selectedEnv} onValueChange={setSelectedEnv}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <SearchInput placeholder="Search tests..." className="w-[300px]" />
          <div className="flex justify-between items-center gap-4">
            <Button
              size="default"
              onClick={() => {
                setIsRunning(!isRunning);
                setResults(null);
              }}
              variant={isRunning ? "destructive" : "default"}
              className="w-40"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-5 w-5" /> Stop Tests
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" /> Run Tests
                </>
              )}
            </Button>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Configure
            </Button>
          </div>
        </div>

        {/* Progress bar when tests are running */}
        {/* Active Test Progress */}

        {isRunning && currentStage && (
          <Card className="border-2 border-primary mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>Running: {currentStage?.name}</span>
                <Badge variant="secondary">{currentStage?.progress}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={currentStage?.progress || 0} className="h-3" />
              <div className="mt-4 grid grid-cols-6 gap-4">
                {testStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`p-2 rounded ${
                      currentStage?.id === stage.id
                        ? "bg-primary text-primary-foreground"
                        : index <
                          testStages.findIndex((s) => s.id === currentStage?.id)
                        ? "bg-secondary"
                        : "bg-muted"
                    }`}
                  >
                    {stage.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {results && (
          <Card className="mt-6 mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Test Results
                <Badge variant="secondary" className="text-lg">
                  Duration: {results.summary.duration}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="details">Detailed Results</TabsTrigger>
                  <TabsTrigger value="artifacts">Test Artifacts</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.summary.total}
                        </div>
                        <div className="text-muted-foreground">Total Tests</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-500">
                          {results.summary.passed}
                        </div>
                        <div className="text-muted-foreground">Passed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-500">
                          {results.summary.failed}
                        </div>
                        <div className="text-muted-foreground">Failed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-500">
                          {results.summary.skipped}
                        </div>
                        <div className="text-muted-foreground">Skipped</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="details">
                  <div className="space-y-4">
                    {Object.entries(results.stages).map(
                      ([stageId, stageData]: any) => (
                        <Card key={stageId}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-2">
                                {stageData.status === "passed" && (
                                  <CheckCircle2 className="text-green-500" />
                                )}
                                {stageData.status === "failed" && (
                                  <XCircle className="text-red-500" />
                                )}
                                {stageData.status === "warning" && (
                                  <AlertCircle className="text-yellow-500" />
                                )}
                                <span className="font-semibold">
                                  {
                                    (testStages as any).find((s: any) => s.id === stageId)
                                      .name
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  Duration: {stageData.duration}
                                </Badge>
                                {stageData.status === "failed" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleViewError}
                                    className="ml-2"
                                  >
                                    <Code2 className="mr-2 h-4 w-4" />
                                    View Error
                                  </Button>
                                )}
                              </div>
                            </div>

                            {stageData.total && (
                              <div className="grid grid-cols-3 gap-4">
                                <div>Total: {stageData.total}</div>
                                <div className="text-green-500">
                                  Passed: {stageData.passed}
                                </div>
                                <div className="text-red-500">
                                  Failed: {stageData.failed}
                                </div>
                              </div>
                            )}

                            {stageData.metrics && (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  Avg Response:{" "}
                                  {stageData.metrics.avgResponseTime}
                                </div>
                                <div>
                                  P95: {stageData.metrics.p95ResponseTime}
                                </div>
                                <div>
                                  Max Users:{" "}
                                  {stageData.metrics.maxConcurrentUsers}
                                </div>
                              </div>
                            )}

                            {stageData.findings && (
                              <div className="grid grid-cols-4 gap-4">
                                <div className="text-red-500">
                                  Critical: {stageData.findings.critical}
                                </div>
                                <div className="text-orange-500">
                                  High: {stageData.findings.high}
                                </div>
                                <div className="text-yellow-500">
                                  Medium: {stageData.findings.medium}
                                </div>
                                <div className="text-blue-500">
                                  Low: {stageData.findings.low}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="artifacts">
                  <Alert>
                    <AlertDescription>
                      Test artifacts are available in the test-results
                      directory:
                      <ul className="mt-2 space-y-1">
                        <li>• Coverage Report: /coverage/index.html</li>
                        <li>• Performance Metrics: /performance/report.pdf</li>
                        <li>
                          • Test Logs: /logs/test-run-{new Date().getTime()}.log
                        </li>
                        <li>• Screenshots: /artifacts/screenshots/</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs Navigation */}
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex justify-items-start items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tests">Test Cases</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tests
                  </CardTitle>
                  <FileCode2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">463</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Passing Rate
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">
                    Improved by 3%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Failures
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">37</div>
                  <p className="text-xs text-muted-foreground">Down by 5</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.5s</div>
                  <p className="text-xs text-muted-foreground">
                    +0.2s from last run
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Test Categories</CardTitle>
                  <CardDescription>
                    Distribution of tests by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testCategories.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {category.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {category.passing}/{category.count}
                          </span>
                        </div>
                        <Progress
                          value={(category.passing / category.count) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Security Analysis</CardTitle>
                  <CardDescription>Vulnerability assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vulnerabilityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="severity" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Cases Tab */}
          <TabsContent value="tests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Test Files</CardTitle>
                  <CardDescription>
                    All test cases and their status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testFiles.map((file, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.type} | {file.priority}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.status === "passed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <p className="text-sm">{file.time}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <p className="text-muted-foreground">
                          Coverage: {file.coverage}
                        </p>
                        <p className="text-muted-foreground">
                          Last Run: {file.lastRun}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Test performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={testFiles.map((file) => ({
                        name: file.name,
                        timeInSeconds: parseFloat(file.time.replace("s", "")), // Convert "2.3s" to 2.3
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        domain={[0, "auto"]}
                        tickFormatter={(value) => `${value}s`}
                      />
                      <Tooltip
                        formatter={(value, _) => [
                          `${value}s`,
                          "Execution Time",
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="timeInSeconds"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage">
            <Card>
              <CardHeader>
                <CardTitle>Code Coverage</CardTitle>
                <CardDescription>Current code coverage metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={testFiles.map((file) => ({
                          name: file.name,
                          value: parseInt(file.coverage),
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        label
                      >
                        {testFiles.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(var(--primary), ${
                              Math.random() * 100
                            }%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Vulnerabilities</CardTitle>
                <CardDescription>
                  List of identified vulnerabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vulnerabilityData.map((vuln, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <p className="font-medium">{vuln.severity}</p>
                      </div>
                      <p className="text-sm">{vuln.count} issues</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Environment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>
              Current testing environment settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">CPU</p>
                <p className="text-muted-foreground">
                  {environmentConfigs[selectedEnv].cpu}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Memory</p>
                <p className="text-muted-foreground">
                  {environmentConfigs[selectedEnv].memory}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-muted-foreground">
                  {environmentConfigs[selectedEnv].storage}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Network</p>
                <p className="text-muted-foreground">
                  {environmentConfigs[selectedEnv].network}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// import React from 'react'

// const page = () => {
//   return (
//     <div>page</div>
//   )
// }

// export default page
