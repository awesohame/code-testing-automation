const express = require('express');
const router = express.Router();
const LoadTest = require('../model/performanceTest'); // Adjust path as needed

/**
 * POST /api/loadtests
 * Store a new load test result
 */
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.clerkId || !req.body.reponame) {
      return res.status(400).json({
        success: false,
        message: 'clerkId and reponame are required fields'
      });
    }
    
    // Extract test data and raw output
    const testData = {
      clerkId: req.body.clerkId,
      reponame: req.body.reponame,
      timestamp: req.body.timestamp || new Date(),
      metrics: req.body.metrics || {},
      rawOutput: req.body.rawOutput || ''
    };
    
    // Create and save new record
    const loadTest = new LoadTest(testData);
    await loadTest.save();
    
    res.status(201).json({
      success: true,
      id: loadTest._id,
      message: 'Load test results saved successfully'
    });
  } catch (error) {
    console.error('Error saving load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save load test results',
      error: error.message
    });
  }
});

/**
 * GET /api/loadtests
 * Get all load test results with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Filter by clerkId if provided
    if (req.query.clerkId) {
      filter.clerkId = req.query.clerkId;
    }
    
    // Filter by reponame if provided
    if (req.query.reponame) {
      filter.reponame = req.query.reponame;
    }
    
    // Date range filtering
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const loadTests = await LoadTest
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await LoadTest.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: loadTests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: loadTests
    });
  } catch (error) {
    console.error('Error fetching load tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch load test results',
      error: error.message
    });
  }
});

/**
 * GET /api/loadtests/user/:clerkId
 * Get all tests for a specific user
 */
router.get('/user/:clerkId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const loadTests = await LoadTest
      .find({ clerkId: req.params.clerkId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await LoadTest.countDocuments({ clerkId: req.params.clerkId });
    
    res.status(200).json({
      success: true,
      count: loadTests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: loadTests
    });
  } catch (error) {
    console.error('Error fetching user load tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user load test results',
      error: error.message
    });
  }
});

/**
 * GET /api/loadtests/repo/:reponame
 * Get all tests for a specific repository
 */
router.get('/repo/:reponame', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const loadTests = await LoadTest
      .find({ reponame: req.params.reponame })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await LoadTest.countDocuments({ reponame: req.params.reponame });
    
    res.status(200).json({
      success: true,
      count: loadTests.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: loadTests
    });
  } catch (error) {
    console.error('Error fetching repository load tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repository load test results',
      error: error.message
    });
  }
});

/**
 * GET /api/loadtests/:id
 * Get a specific load test result
 */
router.get('/:id', async (req, res) => {
  try {
    const loadTest = await LoadTest.findById(req.params.id);
    
    if (!loadTest) {
      return res.status(404).json({
        success: false,
        message: 'Load test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: loadTest
    });
  } catch (error) {
    console.error('Error fetching load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch load test',
      error: error.message
    });
  }
});

/**
 * PUT /api/loadtests/:id
 * Update a load test result
 */
router.put('/:id', async (req, res) => {
  try {
    const loadTest = await LoadTest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!loadTest) {
      return res.status(404).json({
        success: false,
        message: 'Load test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: loadTest
    });
  } catch (error) {
    console.error('Error updating load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update load test',
      error: error.message
    });
  }
});

/**
 * DELETE /api/loadtests/:id
 * Delete a load test result
 */
router.delete('/:id', async (req, res) => {
  try {
    const loadTest = await LoadTest.findByIdAndDelete(req.params.id);
    
    if (!loadTest) {
      return res.status(404).json({
        success: false,
        message: 'Load test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Load test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete load test',
      error: error.message
    });
  }
});

module.exports = router;