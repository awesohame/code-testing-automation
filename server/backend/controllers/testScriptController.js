const testScriptService = require("../services/testScriptService");

exports.generateTestScript = async (req, res) => {
    try {
        const apiMetadata = req.body.apiMetadata;
        if (!apiMetadata || !apiMetadata.endpoints) {
            return res.status(400).json({ error: "Invalid API metadata" });
        }

        const testScript = await testScriptService.generateTestScript(apiMetadata);
        res.json({ success: true, testScript });
    } catch (error) {
        console.error("❌ Error generating test script:", error);
        res.status(500).json({ error: "Failed to generate test script" });
    }
};


