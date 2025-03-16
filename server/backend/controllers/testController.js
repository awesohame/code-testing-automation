const { cloneRepo } = require("../services/githubService");
const { buildAndRunContainer, injectTestScript, runLoadTests } = require("../services/dockerService");

exports.runTests = async (req, res) => {
    const { repoUrl, testScript } = req.body;
    if (!repoUrl || !testScript) return res.status(400).json({ error: "Repo URL and test script are required" });

    try {
        const repoPath = await cloneRepo(repoUrl);
        await buildAndRunContainer(repoPath);
        await injectTestScript(repoPath, testScript); // Save script inside the container
        const results = await runLoadTests();

        res.json({ success: true, results });
    } catch (error) {
        console.error("❌ Test execution failed:", error);
        res.status(500).json({ error: error.message });
    }
};
