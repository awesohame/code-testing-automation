const TestGeneration = require('../model/unitTest.js');
const LoadTest = require('../model/performanceTest.js');
const User = require('../model/user.js');

/**
 * Extract metadata from all API models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllData = async (req, res) => {
    try {
        // Query all models in parallel for better performance
        const [testGenerations, loadTests, users] = await Promise.all([
            TestGeneration.find({}).lean(),
            LoadTest.find({}).lean(),
            User.find({}).lean()
        ]);

        // Construct response object with all data
        const metadata = {
            testGenerations,
            loadTests,
            users,
            counts: {
                testGenerations: testGenerations.length,
                loadTests: loadTests.length,
                users: users.length
            },
            timestamp: new Date()
        };

        return res.status(200).json(metadata);
    } catch (error) {
        console.error('Error extracting API metadata:', error);
        return res.status(500).json({
            error: 'Failed to extract API metadata',
            message: error.message
        });
    }
};

module.exports = {
    getAllData
};