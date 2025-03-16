const express = require("express");
const router = express.Router();
const testScriptController = require("../controllers/testScriptController");

router.post("/generate-test-script", testScriptController.generateTestScript);

module.exports = router;
