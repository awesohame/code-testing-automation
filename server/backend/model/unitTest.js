const mongoose = require('mongoose');

const TestGenerationSchema = new mongoose.Schema({
  // User information
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: false
  },

  // Repository information
  repoName: {
    type: String,
    required: false
  },
  repoOwner: {
    type: String,
    required: false
  },

  // Source file information
  sourceFilePath: {
    type: String,
    required: true
  },
  sourceFileName: {
    type: String,
    required: true
  },
  sourceFileLanguage: {
    type: String,
    required: true
  },

  // Test file information
  testFilePath: {
    type: String,
    required: true
  },
  testFileName: {
    type: String,
    required: true
  },
  testCode: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },

  // Test coverage metrics
  coveragePercentage: {
    type: Number,
    required: true
  },
  coveredFunctions: [{
    type: String
  }],
  uncoveredAreas: [{
    type: String
  }],
  coverageNotes: {
    type: String
  },

  // Additional metadata
  testInstructions: {
    type: String
  },
  modelUsed: {
    type: String,
    default: 'gemini-2.0-flash'
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestGeneration', TestGenerationSchema);