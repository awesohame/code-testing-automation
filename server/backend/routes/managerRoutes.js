const express = require("express");
const router = express.Router();
const managerController = require("../controllers/managerController.js");

// ✅ Route to extract API metadata
router.post("/", managerController.getAllData);

module.exports = router;
