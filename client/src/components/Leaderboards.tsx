import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
    const [data, setData] = useState({
        testGenerations: [],
        loadTests: [],
        users: [],
        counts: { testGenerations: 0, loadTests: 0, users: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [leaderboardType, setLeaderboardType] = useState('coverage');

    // Function to generate letter avatar background color
    const getLetterAvatarColor = (name) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
            'bg-red-500', 'bg-teal-500', 'bg-orange-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Add dummy data to users for demonstration
    const addDummyData = (realData = {}) => {
        const { testGenerations = [], loadTests = [], users = [], counts = {} } = realData;
        const { testGenerations: testCount = 0, loadTests: loadCount = 0, users: userCount = 0 } = counts;

        const dummyUsers = [
            {
                clerkId: 'dummy1',
                firstName: 'Alex',
                lastName: 'Johnson',
                username: 'alexj',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
            },
            {
                clerkId: 'dummy2',
                firstName: 'Sarah',
                lastName: 'Williams',
                username: 'sarahw',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces'
            },
            {
                clerkId: 'dummy3',
                firstName: 'Michael',
                lastName: 'Chen',
                username: 'mikec',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
            },
            {
                clerkId: 'dummy4',
                firstName: 'Jessica',
                lastName: 'Brown',
                username: 'jessb',
                avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces'
            },
            {
                clerkId: 'dummy5',
                firstName: 'David',
                lastName: 'Smith',
                username: 'daves',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
            },
        ];

        // Add dummy test generations with high coverage scores
        const dummyTestGenerations = [
            { userId: 'dummy1', repoName: 'project-alpha', sourceFileName: 'main.js', coveragePercentage: 97, generatedAt: new Date().toISOString() },
            { userId: 'dummy2', repoName: 'cool-app', sourceFileName: 'api.js', coveragePercentage: 96, generatedAt: new Date().toISOString() },
            { userId: 'dummy3', repoName: 'data-vis', sourceFileName: 'chart.js', coveragePercentage: 93, generatedAt: new Date().toISOString() },
            { userId: 'dummy4', repoName: 'backend-service', sourceFileName: 'server.js', coveragePercentage: 89, generatedAt: new Date().toISOString() },
            { userId: 'dummy5', repoName: 'mobile-app', sourceFileName: 'app.js', coveragePercentage: 87, generatedAt: new Date().toISOString() },
        ];

        // Add dummy load tests with performance metrics
        const dummyLoadTests = [
            { clerkId: 'dummy1', reponame: 'project-alpha', metrics: { success_rate: 99.8, http_req_duration: { avg: 87 }, rps: 450 }, timestamp: new Date().toISOString() },
            { clerkId: 'dummy2', reponame: 'cool-app', metrics: { success_rate: 99.5, http_req_duration: { avg: 92 }, rps: 420 }, timestamp: new Date().toISOString() },
            { clerkId: 'dummy3', reponame: 'data-vis', metrics: { success_rate: 98.7, http_req_duration: { avg: 105 }, rps: 380 }, timestamp: new Date().toISOString() },
            { clerkId: 'dummy4', reponame: 'backend-service', metrics: { success_rate: 97.8, http_req_duration: { avg: 115 }, rps: 350 }, timestamp: new Date().toISOString() },
            { clerkId: 'dummy5', reponame: 'mobile-app', metrics: { success_rate: 96.5, http_req_duration: { avg: 124 }, rps: 320 }, timestamp: new Date().toISOString() },
        ];

        return {
            testGenerations: [...testGenerations, ...dummyTestGenerations],
            loadTests: [...loadTests, ...dummyLoadTests],
            users: [...users, ...dummyUsers],
            counts: {
                testGenerations: testCount + dummyTestGenerations.length,
                loadTests: loadCount + dummyLoadTests.length,
                users: userCount + dummyUsers.length
            }
        };
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/manager');
            const responseData = response?.data || {
                testGenerations: [],
                loadTests: [],
                users: [],
                counts: { testGenerations: 0, loadTests: 0, users: 0 }
            };
            const enhancedData = addDummyData(responseData);
            setData(enhancedData);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
            console.error(err);
        }
    };

    // Get user full name and avatar
    const getUserDetails = (userId = '') => {
        const user = (data.users || []).find((u = {}) => u?.clerkId === userId);
        const { firstName = '', lastName = '', avatarUrl = '' } = user || {};
        const name = user ? `${firstName} ${lastName}`.trim() : 'Unknown User';

        // If no avatar URL is provided, create a letter avatar
        const letterAvatar = !avatarUrl && name !== 'Unknown User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const avatarBgColor = getLetterAvatarColor(name);

        return {
            name,
            avatar: avatarUrl,
            letterAvatar,
            initials,
            avatarBgColor
        };
    };

    // Compute leaderboard data based on selected criteria
    const getLeaderboardData = () => {
        let results = [];
        const { testGenerations = [], loadTests = [] } = data;

        if (leaderboardType === 'coverage') {
            // Group test generations by user and calculate average coverage
            const userScores = {};

            testGenerations.forEach((test = {}) => {
                const { userId = '', coveragePercentage = 0 } = test;
                if (!userId) return;

                if (!userScores[userId]) {
                    userScores[userId] = {
                        totalCoverage: 0,
                        count: 0
                    };
                }

                userScores[userId].totalCoverage += coveragePercentage;
                userScores[userId].count += 1;
            });

            results = Object.entries(userScores).map(([userId, scoreData = {}]) => {
                const { totalCoverage = 0, count = 0 } = scoreData;
                return {
                    userId,
                    score: count > 0 ? Math.round(totalCoverage / count) : 0,
                    metric: '%',
                    label: 'Avg. Test Coverage'
                };
            });
        } else if (leaderboardType === 'performance') {
            // Group load tests by user and calculate average success rate
            const userScores = {};

            loadTests.forEach((test = {}) => {
                const { clerkId = '', metrics = {} } = test;
                const { success_rate = 0 } = metrics;
                if (!clerkId) return;

                if (!userScores[clerkId]) {
                    userScores[clerkId] = {
                        totalSuccessRate: 0,
                        count: 0
                    };
                }

                userScores[clerkId].totalSuccessRate += success_rate;
                userScores[clerkId].count += 1;
            });

            results = Object.entries(userScores).map(([userId, scoreData = {}]) => {
                const { totalSuccessRate = 0, count = 0 } = scoreData;
                return {
                    userId,
                    score: count > 0 ? Math.round(totalSuccessRate / count * 10) / 10 : 0,
                    metric: '%',
                    label: 'Avg. Success Rate'
                };
            });
        } else if (leaderboardType === 'speed') {
            // Group load tests by user and calculate average response time (lower is better)
            const userScores = {};

            loadTests.forEach((test = {}) => {
                const { clerkId = '', metrics = {} } = test;
                const { http_req_duration = {} } = metrics;
                const { avg = 0 } = http_req_duration;
                if (!clerkId) return;

                if (!userScores[clerkId]) {
                    userScores[clerkId] = {
                        totalResponseTime: 0,
                        count: 0
                    };
                }

                userScores[clerkId].totalResponseTime += avg;
                userScores[clerkId].count += 1;
            });

            results = Object.entries(userScores).map(([userId, scoreData = {}]) => {
                const { totalResponseTime = 0, count = 0 } = scoreData;
                return {
                    userId,
                    score: count > 0 ? Math.round(totalResponseTime / count) : 0,
                    metric: 'ms',
                    label: 'Avg. Response Time',
                    lowerIsBetter: true
                };
            });
        } else if (leaderboardType === 'throughput') {
            // Group load tests by user and calculate average RPS
            const userScores = {};

            loadTests.forEach((test = {}) => {
                const { clerkId = '', metrics = {} } = test;
                const { rps = 0 } = metrics;
                if (!clerkId) return;

                if (!userScores[clerkId]) {
                    userScores[clerkId] = {
                        totalRps: 0,
                        count: 0
                    };
                }

                userScores[clerkId].totalRps += rps;
                userScores[clerkId].count += 1;
            });

            results = Object.entries(userScores).map(([userId, scoreData = {}]) => {
                const { totalRps = 0, count = 0 } = scoreData;
                return {
                    userId,
                    score: count > 0 ? Math.round(totalRps / count) : 0,
                    metric: '/sec',
                    label: 'Avg. Requests Per Second'
                };
            });
        }

        // Sort results (higher is better by default, unless lowerIsBetter is true)
        return results
            .sort((a = {}, b = {}) => {
                const { score: scoreA = 0, lowerIsBetter: lowerIsBetterA = false } = a;
                const { score: scoreB = 0 } = b;

                if (lowerIsBetterA) {
                    return scoreA - scoreB;
                }
                return scoreB - scoreA;
            })
            .map((item = {}, index) => {
                const { userId = '' } = item;
                return {
                    ...item,
                    rank: index + 1,
                    userDetails: getUserDetails(userId)
                };
            });
    };

    const leaderboardData = getLeaderboardData();
    const firstPlaceItem = leaderboardData[0] || {};
    const { label = 'Leaderboard' } = firstPlaceItem;

    // Extract podium place data before rendering
    const firstPlace = leaderboardData[0] || {};
    const secondPlace = leaderboardData[1] || {};
    const thirdPlace = leaderboardData[2] || {};

    const { userDetails: firstUserDetails = {}, score: firstScore = 0, metric: firstMetric = '' } = firstPlace;
    const { userDetails: secondUserDetails = {}, score: secondScore = 0, metric: secondMetric = '' } = secondPlace;
    const { userDetails: thirdUserDetails = {}, score: thirdScore = 0, metric: thirdMetric = '' } = thirdPlace;

    const renderAvatar = (userDetails, size = 'regular') => {
        const { name = '', avatar = '', letterAvatar = false, initials = '', avatarBgColor = '' } = userDetails;
        const sizeClasses = size === 'large' ? 'w-24 h-24' : size === 'medium' ? 'w-20 h-20' : 'w-10 h-10';

        if (letterAvatar) {
            return (
                <div className={`${sizeClasses} ${avatarBgColor} rounded-full flex items-center justify-center text-white font-bold`}>
                    <span className={size === 'large' ? 'text-2xl' : size === 'medium' ? 'text-xl' : 'text-sm'}>
                        {initials}
                    </span>
                </div>
            );
        }

        return (
            <div className={`${sizeClasses} rounded-full overflow-hidden`}>
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
        );
    };

    return (
        <div className="bg-gray-900 min-h-screen text-blue-100">
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-center text-white">API Testing Leaderboard</h1>

                {/* Leaderboard Type Selector */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setLeaderboardType('coverage')}
                            className={`px-4 py-2 rounded-lg ${leaderboardType === 'coverage' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-gray-700'}`}
                        >
                            Test Coverage
                        </button>
                        <button
                            onClick={() => setLeaderboardType('performance')}
                            className={`px-4 py-2 rounded-lg ${leaderboardType === 'performance' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-gray-700'}`}
                        >
                            Success Rate
                        </button>
                        <button
                            onClick={() => setLeaderboardType('speed')}
                            className={`px-4 py-2 rounded-lg ${leaderboardType === 'speed' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-gray-700'}`}
                        >
                            Response Time
                        </button>
                        <button
                            onClick={() => setLeaderboardType('throughput')}
                            className={`px-4 py-2 rounded-lg ${leaderboardType === 'throughput' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-gray-700'}`}
                        >
                            Throughput
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="mt-4">Loading leaderboard data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-10">
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : (
                    <div>
                        {/* Top 3 Podium */}
                        {leaderboardData.length > 0 && (
                            <div className="flex justify-center items-end mb-12 space-x-4">
                                {/* Second Place */}
                                {leaderboardData.length > 1 && (
                                    <div className="flex flex-col items-center">
                                        <div className="border-4 border-gray-300 rounded-full mb-2">
                                            {renderAvatar(secondUserDetails, 'medium')}
                                        </div>
                                        <div className="bg-gray-300 text-gray-800 w-16 h-16 rounded-t-lg flex items-center justify-center font-bold text-xl">2</div>
                                        <p className="mt-2 font-medium text-white">{secondUserDetails.name}</p>
                                        <p className="text-lg font-bold text-gray-300">{secondScore}{secondMetric}</p>
                                    </div>
                                )}

                                {/* First Place */}
                                <div className="flex flex-col items-center">
                                    <div className="border-4 border-yellow-400 rounded-full mb-2">
                                        {renderAvatar(firstUserDetails, 'large')}
                                    </div>
                                    <div className="bg-yellow-400 text-gray-900 w-20 h-20 rounded-t-lg flex items-center justify-center font-bold text-2xl">1</div>
                                    <p className="mt-2 font-semibold text-white text-lg">{firstUserDetails.name}</p>
                                    <p className="text-xl font-bold text-yellow-400">{firstScore}{firstMetric}</p>
                                </div>

                                {/* Third Place */}
                                {leaderboardData.length > 2 && (
                                    <div className="flex flex-col items-center">
                                        <div className="border-4 border-amber-700 rounded-full mb-2">
                                            {renderAvatar(thirdUserDetails, 'medium')}
                                        </div>
                                        <div className="bg-amber-700 text-white w-12 h-12 rounded-t-lg flex items-center justify-center font-bold text-lg">3</div>
                                        <p className="mt-2 font-medium text-white">{thirdUserDetails.name}</p>
                                        <p className="text-lg font-bold text-amber-700">{thirdScore}{thirdMetric}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Full Leaderboard Table */}
                        <div className="bg-gray-800/80 backdrop-blur rounded-lg border border-blue-500/20 overflow-hidden shadow-lg">
                            <div className="p-4 bg-gray-700/50 border-b border-blue-500/20">
                                <h2 className="text-xl font-semibold text-white">{label}</h2>
                            </div>

                            {leaderboardData.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    No data available for this leaderboard
                                </div>
                            ) : (
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-700/30">
                                            <th className="py-3 px-4 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Rank</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">User</th>
                                            <th className="py-3 px-4 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboardData.map((item = {}) => {
                                            const { userId = '', rank = 0, score = 0, metric = '', userDetails = {} } = item;

                                            return (
                                                <tr
                                                    key={userId}
                                                    className={`
                                                        ${rank === 1 ? 'bg-yellow-400/10' :
                                                            rank === 2 ? 'bg-gray-300/10' :
                                                                rank === 3 ? 'bg-amber-700/10' :
                                                                    rank % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/20'}
                                                        hover:bg-blue-500/10 transition-colors
                                                    `}
                                                >
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className={`
                                                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                                            ${rank === 1 ? 'bg-yellow-400 text-gray-900' :
                                                                rank === 2 ? 'bg-gray-300 text-gray-900' :
                                                                    rank === 3 ? 'bg-amber-700 text-white' :
                                                                        'bg-gray-700 text-white'}
                                                        `}>
                                                            {rank}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="mr-3">
                                                                {renderAvatar(userDetails)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{userDetails.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 whitespace-nowrap text-right">
                                                        <span className={`font-bold text-lg
                                                            ${rank === 1 ? 'text-yellow-400' :
                                                                rank === 2 ? 'text-gray-300' :
                                                                    rank === 3 ? 'text-amber-700' :
                                                                        'text-white'}
                                                        `}>
                                                            {score}{metric}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;