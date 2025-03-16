import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import { Activity, Users, Zap, Clock, CheckCircle, BarChart2 } from 'lucide-react';
import type { TestResult, NetworkMetrics } from '../types';

interface TestResultsProps {
  results: TestResult;
}

export function TestResults({ results }: TestResultsProps) {
  const { metrics } = results;

  // Prepare data for the response time percentiles chart
  const percentileData = [
    { name: 'Min', value: metrics.http_req_duration.min },
    { name: 'Avg', value: metrics.http_req_duration.avg },
    { name: 'Median', value: metrics.http_req_duration.med },
    { name: '90th', value: metrics.http_req_duration.p90 },
    { name: '95th', value: metrics.http_req_duration.p95 },
    { name: 'Max', value: metrics.http_req_duration.max }
  ];

  // Prepare data for the network metrics radar chart
  const networkMetrics: NetworkMetrics[] = [
    { name: 'DNS Lookup', value: metrics.http_req_blocked, unit: 'ms' },
    { name: 'Connection', value: metrics.http_req_connecting, unit: 'ms' },
    { name: 'TLS', value: metrics.http_req_tls_handshaking, unit: 'ms' },
    { name: 'Sending', value: metrics.http_req_sending, unit: 'ms' },
    { name: 'Waiting', value: metrics.http_req_waiting, unit: 'ms' },
    { name: 'Receiving', value: metrics.http_req_receiving, unit: 'ms' }
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg flex items-start space-x-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
            <p className="text-2xl font-bold text-white mt-1">{metrics.success_rate}%</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start space-x-4">
          <Clock className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Avg Response Time</h3>
            <p className="text-2xl font-bold text-white mt-1">{metrics.http_req_duration.avg.toFixed(2)}ms</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start space-x-4">
          <Users className="w-6 h-6 text-purple-500" />
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Max VUs</h3>
            <p className="text-2xl font-bold text-white mt-1">{metrics.vus}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start space-x-4">
          <Activity className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Total Requests</h3>
            <p className="text-2xl font-bold text-white mt-1">{metrics.http_reqs}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg flex items-start space-x-4">
          <Zap className="w-6 h-6 text-orange-500" />
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Request Rate</h3>
            <p className="text-2xl font-bold text-white mt-1">{metrics.rps.toFixed(2)}/s</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Percentiles */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Response Time Percentiles</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={percentileData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem'
                  }}
                />
                <Bar dataKey="value" fill="#60A5FA" name="Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Performance Metrics */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Network Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={networkMetrics}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="name" stroke="#9CA3AF" />
                <PolarRadiusAxis stroke="#9CA3AF" />
                <Radar
                  name="Response Time"
                  dataKey="value"
                  stroke="#60A5FA"
                  fill="#60A5FA"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}ms`]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-750">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Metric</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {networkMetrics.map((metric) => (
              <tr key={metric.name} className="bg-gray-800">
                <td className="px-6 py-4 text-sm text-gray-300">{metric.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{metric.value.toFixed(2)} {metric.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}