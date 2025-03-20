const mongoose = require('mongoose');

// Single comprehensive schema for load test results
const LoadTestSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true
  },
  reponame: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  metrics: {
    http_req_duration: {
      avg: { type: Number, default: 0 },
      min: { type: Number, default: 0 },
      med: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      p90: { type: Number, default: 0 },
      p95: { type: Number, default: 0 }
    },
    http_reqs: { type: Number, default: 0 },
    iterations: { type: Number, default: 0 },
    vus: { type: Number, default: 0 },
    vus_max: { type: Number, default: 0 },
    success_rate: { type: Number, default: 0 },
    rps: { type: Number, default: 0 },
    http_req_blocked: { type: Number, default: 0 },
    http_req_connecting: { type: Number, default: 0 },
    http_req_tls_handshaking: { type: Number, default: 0 },
    http_req_sending: { type: Number, default: 0 },
    http_req_waiting: { type: Number, default: 0 },
    http_req_receiving: { type: Number, default: 0 },
    endpoints: [{
      method: String,
      path: String,
      success: Boolean,
      successRate: Number
    }]
  },
  rawOutput: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
LoadTestSchema.index({ timestamp: -1 });
LoadTestSchema.index({ clerkId: 1, reponame: 1 }); // Compound index for user+repo queries

const LoadTest = mongoose.model('LoadTest', LoadTestSchema);

module.exports = LoadTest;