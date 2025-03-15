// Test.tsx
import axios from 'axios';
import React, { useState } from 'react';

interface TestResult {
    test_type: string;
    summary: string;
    key_parameters: {
        test_type: string;
        virtual_users: string;
        duration: string;
        target: string;
        tool: string;
    };
    expected_metrics: string[];
    execution_instructions: string[];
    file_path: string;
}

interface ApiResponse {
    status: string;
    results: TestResult[];
    message?: string;
}

const Test: React.FC = () => {
    const [apiUrl, setApiUrl] = useState<string>('');
    const [testType, setTestType] = useState<string>('load');
    const [tool, setTool] = useState<string>('Docker');
    const [virtualUsers, setVirtualUsers] = useState<number>(100);
    const [duration, setDuration] = useState<number>(1);
    const [additionalChecks, setAdditionalChecks] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<TestResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post<ApiResponse>(
                'http://127.0.0.1:5000/generate',
                new URLSearchParams({
                    api_url: apiUrl,
                    test_type: testType,
                    tool: tool,
                    virtual_users: virtualUsers.toString(),
                    duration_minutes: duration.toString(),
                    additional_checks: additionalChecks,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    withCredentials: true, // Ensures cookies are sent with the request
                }
            );

            const data: ApiResponse = response.data;

            if (response.status === 200) {
                setResults(data.results);
            } else {
                setError(data.message || 'An error occurred');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Performance Test Generator</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            API URL:
                        </label>
                        <input
                            type="text"
                            id="apiUrl"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://api.example.com/v1/users"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="testType" className="block text-sm font-medium text-gray-700 mb-1">
                                Test Type:
                            </label>
                            <select
                                id="testType"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={testType}
                                onChange={(e) => setTestType(e.target.value)}
                            >
                                <option value="load">Load Test</option>
                                <option value="stress">Stress Test</option>
                                <option value="spike">Spike Test</option>
                                <option value="soak">Soak Test</option>
                                <option value="scalability">Scalability Test</option>
                                <option value="db_stress">Database Stress Test</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="tool" className="block text-sm font-medium text-gray-700 mb-1">
                                Testing Tool:
                            </label>
                            <select
                                id="tool"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={tool}
                                onChange={(e) => setTool(e.target.value)}
                            >
                                <option value="Docker">Docker</option>
                                <option value="k6">k6</option>
                                <option value="JMeter">JMeter</option>
                                <option value="Locust">Locust</option>
                                <option value="SQL">SQL</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="virtualUsers" className="block text-sm font-medium text-gray-700 mb-1">
                                Virtual Users:
                            </label>
                            <input
                                type="number"
                                id="virtualUsers"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={virtualUsers}
                                onChange={(e) => setVirtualUsers(Number(e.target.value))}
                                min="1"
                            />
                        </div>

                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes):
                            </label>
                            <input
                                type="number"
                                id="duration"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="additionalChecks" className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Checks (comma-separated):
                        </label>
                        <input
                            type="text"
                            id="additionalChecks"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={additionalChecks}
                            onChange={(e) => setAdditionalChecks(e.target.value)}
                            placeholder="error rates, request distribution"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2 px-4 rounded-md text-black font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            }`}
                    >
                        {isLoading ? 'Generating...' : 'Generate Test Scripts'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Generated Test Scripts</h2>

                    <div className="space-y-6">
                        {results.map((result, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                                    <h3 className="text-lg font-medium text-blue-800">{result.test_type.toUpperCase()} Test</h3>
                                </div>

                                <div className="p-4">
                                    <p className="mb-4"><span className="font-medium">Summary:</span> {result.summary}</p>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Parameters:</h4>
                                        <ul className="bg-gray-50 rounded p-3 text-sm">
                                            {Object.entries(result.key_parameters).map(([key, value]) => (
                                                <li key={key} className="mb-1">
                                                    <span className="font-medium">{key}:</span> {value}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Expected Metrics:</h4>
                                        <ul className="bg-gray-50 rounded p-3 text-sm">
                                            {result.expected_metrics.map((metric, i) => (
                                                <li key={i} className="mb-1">{metric}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Execution Instructions:</h4>
                                        <ol className="bg-gray-50 rounded p-3 text-sm list-decimal list-inside">
                                            {result.execution_instructions.map((instruction, i) => (
                                                <li key={i} className="mb-1">{instruction}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">File Path:</span> {result.file_path}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Test;