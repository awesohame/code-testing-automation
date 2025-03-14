"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search"
import { 
  Activity, Bug, FileCheck, GitBranch, Users, 
  Clock, ArrowUpRight, ArrowDownRight 
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const performanceData = [
  { name: 'Mon', value: 85 },
  { name: 'Tue', value: 88 },
  { name: 'Wed', value: 92 },
  { name: 'Thu', value: 89 },
  { name: 'Fri', value: 95 },
  { name: 'Sat', value: 93 },
  { name: 'Sun', value: 96 },
]

const recentActivity = [
  {
    user: "Sarah Chen",
    action: "Merged PR: Add user authentication",
    time: "2 minutes ago",
    type: "success"
  },
  {
    user: "John Doe",
    action: "Created new test suite for API endpoints",
    time: "15 minutes ago",
    type: "info"
  },
  {
    user: "Maria Garcia",
    action: "Updated documentation for v2.0",
    time: "1 hour ago",
    type: "info"
  },
  {
    user: "Alex Kim",
    action: "Reported critical bug in payment flow",
    time: "2 hours ago",
    type: "error"
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Developer Dashboard</h1>
        <SearchInput placeholder="Search projects..." className="w-[300px]" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <div className="flex items-center text-xs text-emerald-500">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +2% from last week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <GitBranch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doc Coverage</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <div className="flex items-center text-xs text-orange-500">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <Bug className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <div className="flex items-center text-xs text-red-500">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              7 critical
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-emerald-500' :
                    activity.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {activity.user}
                      <Clock className="h-3 w-3 ml-2 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}