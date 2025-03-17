// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  // Onboarding fields
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  // Add onboarding question fields
  jobTitle: String,
  company: String,
  githubName:String,
  Experience:String,
  purpose:String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: Date
});

module.exports = mongoose.model('User', UserSchema);