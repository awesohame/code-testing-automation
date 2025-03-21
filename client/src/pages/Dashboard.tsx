"use client"

import { useState, useEffect } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Activity, GitBranch, Check, Clock, BarChart2 } from "lucide-react"
import { useAuth } from "@clerk/clerk-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const TestingDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      repositories: 0,
      successRate: null,
      totalTests: null,
      framework: "Unknown",
    },
    weeklyData: [],
    historyData: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken()
        const response = await fetch("http://localhost:5000/api/testing-dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const data = await response.json()
        setDashboardData(data)
      } catch (err) {
        setError(err.message)
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [getToken])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // For demo purposes, using enhanced sample data
  const displayWeeklyData = [
    { week: "Week 1", unit: 3, performance: 1 },
    { week: "Week 2", unit: 8, performance: 4 },
    { week: "Week 3", unit: 5, performance: 2 },
    { week: "Week 4", unit: 10, performance: 6 },
    { week: "Week 5", unit: 7, performance: 3 },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-blue-100/80">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a]">
        <div className="p-6 bg-gray-900/60 backdrop-blur-md border border-red-500/30 rounded-lg text-[#f8fafc]">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-blue-900/10 via-transparent to-blue-900/5 text-[#f8fafc] p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-100">
          Testing Dashboard
        </h1>
        <p className="text-blue-100/80">Monitor your testing metrics and performance</p>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Active Repositories"
          subtitle="Total repos under test coverage"
          value={dashboardData.metrics.repositories || 0}
          icon={<GitBranch className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Test Success Rate"
          subtitle="Passing tests percentage"
          value="80%"
          icon={<Check className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Total Tests Run"
          subtitle="Across all repositories"
          value="12"
          icon={<Activity className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="Testing Framework"
          subtitle="Primary test runner"
          value="Jest"
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Graph Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Unit Tests Line Chart */}
        <Card className="bg-gray-900/60 backdrop-blur-md border border-blue-500/20 shadow-lg">
          <CardHeader className="border-b border-blue-500/20 pb-4">
            <div className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-blue-400" />
              <CardTitle className="text-[#f8fafc]">Unit Tests</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                unit: {
                  label: "Unit Tests",
                  color: "hsl(262, 83%, 68%)", // purple
                },
              }}
              className="min-h-[300px]"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayWeeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#f8fafc", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(59, 130, 246, 0.2)" }}
                  />
                  <YAxis tick={{ fill: "#f8fafc", fontSize: 12 }} axisLine={{ stroke: "rgba(59, 130, 246, 0.2)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                      color: "#f8fafc",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "12px",
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{
                      color: "#f8fafc",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                      paddingBottom: "6px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#f8fafc", paddingTop: "15px" }}
                    formatter={(value) => <span className="text-blue-100/80">{value}</span>}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="unit"
                    name="Unit Tests"
                    stroke="var(--color-unit)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-unit)", r: 4 }}
                    activeDot={{ r: 6, fill: "var(--color-unit)" }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent className="bg-gray-900/95 border border-blue-500/30 shadow-lg" />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Tests Line Chart */}
        <Card className="bg-gray-900/60 backdrop-blur-md border border-blue-500/20 shadow-lg">
          <CardHeader className="border-b border-blue-500/20 pb-4">
            <div className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-400" />
              <CardTitle className="text-[#f8fafc]">Performance Tests</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                performance: {
                  label: "Performance Tests",
                  color: "hsl(152, 69%, 65%)", // green
                },
              }}
              className="min-h-[300px]"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayWeeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#f8fafc", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(59, 130, 246, 0.2)" }}
                  />
                  <YAxis tick={{ fill: "#f8fafc", fontSize: 12 }} axisLine={{ stroke: "rgba(59, 130, 246, 0.2)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                      color: "#f8fafc",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      padding: "12px",
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                    labelStyle={{
                      color: "#f8fafc",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                      paddingBottom: "6px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#f8fafc", paddingTop: "15px" }}
                    formatter={(value) => <span className="text-blue-100/80">{value}</span>}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    name="Performance Tests"
                    stroke="var(--color-performance)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-performance)", r: 4 }}
                    activeDot={{ r: 6, fill: "var(--color-performance)" }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent className="bg-gray-900/95 border border-blue-500/30 shadow-lg" />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <Card className="bg-gray-900/60 backdrop-blur-md border border-blue-500/20 shadow-lg">
        <CardHeader className="border-b border-blue-500/20 pb-4">
          <div className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-blue-400" />
            <CardTitle className="text-[#f8fafc]">Recent Testing Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {dashboardData.historyData && dashboardData.historyData.length > 0 ? (
              dashboardData.historyData.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start border-b border-blue-500/20 pb-4 hover:bg-blue-500/5 transition-colors rounded-md p-2"
                >
                  <div
                    className={`mt-1 p-2 rounded-full mr-4 ${
                      item.type === "performance" ? "bg-blue-500/10" : "bg-green-500/10"
                    }`}
                  >
                    <Activity
                      className={`h-4 w-4 ${item.type === "performance" ? "text-blue-400" : "text-green-400"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-[#f8fafc]">{item.activity}</h4>
                      <span className="text-sm text-blue-100/80">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-sm text-blue-100/80 mt-1">{item.details}</p>
                    <p className="text-xs text-blue-400 mt-1">Repository: {item.repo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-blue-100/80">
                <Activity className="h-12 w-12 mb-4 text-blue-500/30" />
                <p className="text-center">No recent activity found</p>
                <p className="text-sm text-blue-400 mt-2">Run some tests to see activity here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
const MetricCard = ({ title, subtitle, value, icon, color }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
      },
      green: {
        bg: "bg-green-500/10",
        text: "text-green-400",
        border: "border-green-500/30",
      },
      purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/30",
      },
      orange: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
      },
    }

    return colorMap[color] || colorMap.blue
  }

  const colorClasses = getColorClasses(color)

  return (
    <Card className="bg-gray-900/60 backdrop-blur-md border border-blue-500/20 overflow-hidden relative group shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-transparent"></div>
      <CardContent className="pt-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-base font-medium text-blue-100">{title}</p>
            <p className="text-sm text-blue-300/70">{subtitle}</p>
            <h3 className="text-3xl font-bold text-[#f8fafc]">{value}</h3>
          </div>
          <div
            className={`${colorClasses.bg} p-3 rounded-full border ${colorClasses.border} group-hover:scale-110 transition-transform`}
          >
            <div className={colorClasses.text}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TestingDashboard

