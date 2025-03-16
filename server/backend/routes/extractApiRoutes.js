const express = require("express");
const router = express.Router();
const extractApiController = require("../controllers/extractApiController");

// ✅ Route to extract API metadata
router.post("/", extractApiController.extractApiMetadata);

module.exports = router;
