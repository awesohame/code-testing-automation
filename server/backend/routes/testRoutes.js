const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const LoadTest=require('../model/performanceTest')
const TestGeneration=require('../model/unitTest')
const { clerkClient } = require('@clerk/clerk-sdk-node');

router.post("/run-tests", testController.runTests);

router.get('/testing-dashboard', async (req, res) => {
    try {
        console.log("here");
        const sessionToken = req.headers.authorization?.split(' ')[1];
    
        if (!sessionToken) {
            console.log("yo")
          return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }
        
        // Verify and get user from the session token
        const session = await clerkClient.verifyToken(sessionToken);
        const clerkId = session.userId;// Get current user ID from session/token
      
      // Fetch test data for the current user
      const testData = await TestGeneration.find({ clerkId:clerkId})
        .sort({ createdAt: -1 })
        .limit(50);
      console.log(testData)
      // Fetch performance data
      // Note: You may need to adjust this query if performance data has user-specific fields
      const performanceData = await LoadTest.find({clerkId:clerkId})
        .sort({ timestamp: -1 })
        .limit(50);

      console.log(performanceData)
      // Generate weekly data for the chart (last 5 weeks)
      const weeklyData = await generateWeeklyData(clerkId);
      
      // Generate history data (combining both test and performance data)
      const historyData = generateHistoryData(testData, performanceData);
      
      // Calculate summary metrics
      const metrics = calculateMetrics(testData, performanceData);
      
      // Return the complete dashboard data
      res.json({
        metrics,
        weeklyData,
        historyData,
        testData,
        performanceData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });
  
  /**
   * Generate weekly testing activity data for the last 5 weeks
   */
  async function generateWeeklyData(userId) {
    const fiveWeeksAgo = new Date();
    fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35); // 5 weeks ago
    
    // Aggregate test data by week
    const unitTestsByWeek = await TestGeneration.aggregate([
      { 
        $match: { 
          userId: userId,
          createdAt: { $gte: fiveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      { $limit: 5 }
    ]);
    
    // Aggregate performance test data by week
    const performanceTestsByWeek = await LoadTest.aggregate([
      { 
        $match: { 
          // Add user filter if applicable
          timestamp: { $gte: fiveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            week: { $week: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      { $limit: 5 }
    ]);
    
    // Generate last 5 weeks labels
    const weeks = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekNumber = getWeekNumber(date);
      weeks.push(`Week ${weekNumber}`);
    }
    
    // Combine the data
    return weeks.map((weekLabel, index) => {
      // Find matching data for this week
      const unitData = unitTestsByWeek.find(item => 
        getWeekNumber(new Date()) - index === item._id.week
      );
      
      const perfData = performanceTestsByWeek.find(item => 
        getWeekNumber(new Date()) - index === item._id.week
      );
      
      return {
        week: weekLabel,
        unit: unitData ? unitData.count : 0,
        performance: perfData ? perfData.count : 0
      };
    });
  }
  
  /**
   * Helper function to get week number from date
   */
  function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  /**
   * Generate history data by combining test and performance data
   */
  function generateHistoryData(testData, performanceData) {
    // Convert test data to history format
    const testHistory = testData.map((test, index) => ({
      id: `test-${test._id}`,
      timestamp: test.generatedAt || test.createdAt,
      activity: 'Unit Test Run',
      details: `Coverage: ${test.coveragePercentage}%, File: ${test.sourceFileName}`,
      repo: test.sourceFilePath.split('/')[0] || 'Unknown',
      type: 'unit'
    }));
    
    // Convert performance data to history format
    const perfHistory = performanceData.map((perf, index) => ({
      id: `perf-${perf._id}`,
      timestamp: perf.timestamp || perf.createdAt,
      activity: 'Performance Test Run',
      details: `Success Rate: ${perf.success_rate}%, Requests: ${perf.http_reqs}`,
      repo: 'API Endpoints',
      type: 'performance'
    }));
    
    // Combine and sort by timestamp (newest first)
    return [...testHistory, ...perfHistory]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Get only the 10 most recent activities
  }
  
  /**
   * Calculate summary metrics from the data
   */
  function calculateMetrics(testData, performanceData) {
    // Calculate repositories tested
    const repos = new Set();
    testData.forEach(test => {
      if (test.sourceFilePath) {
        const repo = test.sourceFilePath.split('/')[0];
        if (repo) repos.add(repo);
      }
    });
    
    // Calculate average success rate from performance tests
    let avgSuccessRate = 0;
    if (performanceData.length > 0) {
      avgSuccessRate = performanceData.reduce((sum, item) => sum + item.success_rate, 0) / performanceData.length;
    }
    
    // Calculate total tests run
    const totalHttpRequests = performanceData.reduce((sum, item) => sum + item.http_reqs, 0);
    const totalUnitTests = testData.reduce((sum, item) => {
      // Count covered functions if available, otherwise count as 1 test
      return sum + (Array.isArray(item.coveredFunctions) ? item.coveredFunctions.length : 1);
    }, 0);
    
    // Determine most used testing framework
    const frameworks = {};
    testData.forEach(test => {
      if (test.modelUsed) {
        frameworks[test.modelUsed] = (frameworks[test.modelUsed] || 0) + 1;
      }
    });
    
    let mostUsedFramework = { name: 'Unknown', count: 0 };
    for (const [name, count] of Object.entries(frameworks)) {
      if (count > mostUsedFramework.count) {
        mostUsedFramework = { name, count };
      }
    }
    
    return {
      repositories: repos.size,
      successRate: parseFloat(avgSuccessRate.toFixed(2)),
      totalTests: totalHttpRequests + totalUnitTests,
      framework: mostUsedFramework.name
    };
  }
  
  module.exports = router;
  
