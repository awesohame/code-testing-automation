import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerDashboard = () => {
    const [data, setData] = useState({
        testGenerations: [],
        loadTests: [],
        users: [],
        counts: { testGenerations: 0, loadTests: 0, users: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        username: '',
        repoName: '',
        activeTab: 'unit'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/manager');
            setData(response.data || {
                testGenerations: [],
                loadTests: [],
                users: [],
                counts: { testGenerations: 0, loadTests: 0, users: 0 }
            });
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
            console.error(err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const getUserFullName = (userId) => {
        const user = (data.users || []).find((u) => u?.clerkId === userId);
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.firstName || user?.lastName || user?.username || userId || 'N/A';
    };

    const filteredUnitTests = (data.testGenerations || []).filter((test) => {
        const user = (data.users || []).find((u) => u?.clerkId === test?.userId);
        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
        const matchesUser = (test.userEmail?.toLowerCase() || '').includes(filters.username.toLowerCase()) ||
            fullName.toLowerCase().includes(filters.username.toLowerCase());
        const matchesRepo = (test.repoName?.toLowerCase() || '').includes(filters.repoName.toLowerCase());
        return (filters.username === '' || matchesUser) && (filters.repoName === '' || matchesRepo);
    });

    const filteredLoadTests = (data.loadTests || []).filter(test => {
        const user = (data.users || []).find((u) => u?.clerkId === test?.clerkId);
        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
        const matchesUser = fullName.toLowerCase().includes(filters.username.toLowerCase()) ||
            (test.githubUsername?.toLowerCase() || '').includes(filters.username.toLowerCase());
        const matchesRepo = (test.reponame?.toLowerCase() || '').includes(filters.repoName?.toLowerCase() || '');
        return (filters.username === '' || matchesUser) && (filters.repoName === '' || matchesRepo);
    });

    return (
        <div className="bg-0f172a min-h-screen text-blue-100/80">
            <div className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-f8fafc">API Manager Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-900/60 backdrop-blur p-4 rounded-lg shadow border border-blue-500/20">
                        <h2 className="font-bold text-blue-400">Unit Tests</h2>
                        <p className="text-2xl text-f8fafc">{data?.counts?.testGenerations || 0}</p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur p-4 rounded-lg shadow border border-blue-500/20">
                        <h2 className="font-bold text-blue-400">Performance Tests</h2>
                        <p className="text-2xl text-f8fafc">{data?.counts?.loadTests || 0}</p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur p-4 rounded-lg shadow border border-blue-500/20">
                        <h2 className="font-bold text-blue-400">Users</h2>
                        <p className="text-2xl text-f8fafc">{data?.counts?.users || 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1 text-blue-100/80">Search by User</label>
                        <input
                            type="text"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            placeholder="Email or username"
                            className="w-full p-2 border border-blue-500/30 rounded bg-blue-500/10 text-f8fafc placeholder-blue-100/50"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1 text-blue-100/80">Search by Repository</label>
                        <input
                            type="text"
                            name="repoName"
                            value={filters.repoName}
                            onChange={handleFilterChange}
                            placeholder="Repository name"
                            className="w-full p-2 border border-blue-500/30 rounded bg-blue-500/10 text-f8fafc placeholder-blue-100/50"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-4 border-b border-blue-500/20">
                    <ul className="flex flex-wrap -mb-px">
                        <li className="mr-2">
                            <button
                                className={`inline-block p-4 ${filters.activeTab === 'unit' ? 'border-b-2 border-blue-500 text-blue-400' : 'hover:text-blue-100 hover:border-blue-500/30'}`}
                                onClick={() => setFilters({ ...filters, activeTab: 'unit' })}
                            >
                                Unit Test History
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                className={`inline-block p-4 ${filters.activeTab === 'load' ? 'border-b-2 border-blue-500 text-blue-400' : 'hover:text-blue-100 hover:border-blue-500/30'}`}
                                onClick={() => setFilters({ ...filters, activeTab: 'load' })}
                            >
                                Performance Test History
                            </button>
                        </li>
                    </ul>
                </div>

                {loading ? (
                    <p className="text-blue-100/80">Loading data...</p>
                ) : error ? (
                    <p className="text-red-400">{error}</p>
                ) : (
                    <>
                        {/* Unit Test Table */}
                        {filters.activeTab === 'unit' && (
                            <div className="overflow-x-auto">
                                <h2 className="text-xl font-semibold mb-3 text-f8fafc">Unit Test History</h2>
                                {filteredUnitTests.length === 0 ? (
                                    <p className="text-blue-100/80">No unit tests match your search criteria.</p>
                                ) : (
                                    <div className="bg-gray-900/60 backdrop-blur rounded-lg border border-blue-500/20 overflow-hidden">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b border-blue-500/20">
                                                    <th className="py-2 px-4 text-blue-400 text-left">User</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Repository</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">File</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Coverage</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Generated</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUnitTests.map((test, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-blue-500/5' : ''}>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{getUserFullName(test?.userId) || test?.userEmail || 'N/A'}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{(test?.repoOwner || '') + '/' + (test?.repoName || '')}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.sourceFileName || 'N/A'}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.coveragePercentage || 0}%</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.generatedAt ? new Date(test.generatedAt).toLocaleString() : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Load Test Table */}
                        {filters.activeTab === 'load' && (
                            <div className="overflow-x-auto">
                                <h2 className="text-xl font-semibold mb-3 text-f8fafc">Performance Test History</h2>
                                {filteredLoadTests.length === 0 ? (
                                    <p className="text-blue-100/80">No performance tests match your search criteria.</p>
                                ) : (
                                    <div className="bg-gray-900/60 backdrop-blur rounded-lg border border-blue-500/20 overflow-hidden">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b border-blue-500/20">
                                                    <th className="py-2 px-4 text-blue-400 text-left">User</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Repository</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Success Rate</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Avg Response</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">RPS</th>
                                                    <th className="py-2 px-4 text-blue-400 text-left">Run Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLoadTests.map((test, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-blue-500/5' : ''}>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{getUserFullName(test?.clerkId) || test?.githubUsername || 'N/A'}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.reponame || 'N/A'}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.metrics?.success_rate || 0}%</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.metrics?.http_req_duration?.avg ? test.metrics.http_req_duration.avg.toFixed(2) : 0}ms</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.metrics?.rps || 0}</td>
                                                        <td className="py-2 px-4 border-b border-blue-500/10">{test?.timestamp ? new Date(test.timestamp).toLocaleString() : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;