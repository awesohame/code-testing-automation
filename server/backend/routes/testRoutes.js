const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");

router.post("/run-tests", testController.runTests);

module.exports = router;
