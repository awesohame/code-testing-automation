// backend/routes/testGenerations.js
const express = require('express');
const router = express.Router();
const TestGeneration = require('../model/unitTest');

// Create a new test generation record
router.post('/', async (req, res) => {
  try {
    // Ensure the authenticated userId matches the one in the request\
    console.log("here");
    
    // Create a new test generation record
    const testGeneration = new TestGeneration(req.body);
    await testGeneration.save();
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Test generation data saved successfully',
      id: testGeneration._id
    });
  } catch (error) {
    console.error('Error saving test generation data:', error);
    return res.status(500).json({ error: 'Failed to save test generation data' });
  }
});

// Get test generations for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Query test generations for this user
    const testGenerations = await TestGeneration.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await TestGeneration.countDocuments({ userId });
    
    // Return the test generations
    return res.json({
      testGenerations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching test generations:', error);
    return res.status(500).json({ error: 'Failed to fetch test generations' });
  }
});

module.exports = router;