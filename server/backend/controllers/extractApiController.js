const fs = require("fs");
const path = require("path");
const geminiService = require("../services/geminiService");
const githubService = require("../services/githubService");
const { getEntryFile } = require("../utils/getEntryFile");

exports.extractApiMetadata = async (req, res) => {
    try {
        const { repoUrl } = req.body;
        if (!repoUrl) {
            return res.status(400).json({ error: "GitHub repository URL is required" });
        }

        // ✅ Step 1: Clone the GitHub repo
        const repoPath = await githubService.cloneRepo(repoUrl);

        // ✅ Step 2: Find relevant API files (entry file, routes, controllers)
        const apiFiles = [];
        const entryFile = getEntryFile(repoPath);

        if (!entryFile) {
            return res.status(400).json({ error: "No valid entry file found in repository" });
        }

        // ✅ Add entry file content
        apiFiles.push({
            path: path.relative(repoPath, entryFile), // Save relative path
            content: fs.readFileSync(entryFile, "utf-8"),
        });

        // ✅ Check for API folders inside `server/` or root
        const possibleApiPaths = ["server", "."].map(dir => ({
            routes: path.join(repoPath, dir, "routes"),
            controllers: path.join(repoPath, dir, "controllers")
        }));

        possibleApiPaths.forEach(({ routes, controllers }) => {
            if (fs.existsSync(routes)) {
                fs.readdirSync(routes).forEach(file => {
                    const filePath = path.join(routes, file);
                    if (fs.lstatSync(filePath).isFile() && file.endsWith(".js")) {
                        apiFiles.push({
                            path: path.relative(repoPath, filePath),
                            content: fs.readFileSync(filePath, "utf-8"),
                        });
                    }
                });
            }

            if (fs.existsSync(controllers)) {
                fs.readdirSync(controllers).forEach(file => {
                    const filePath = path.join(controllers, file);
                    if (fs.lstatSync(filePath).isFile() && file.endsWith(".js")) {
                        apiFiles.push({
                            path: path.relative(repoPath, filePath),
                            content: fs.readFileSync(filePath, "utf-8"),
                        });
                    }
                });
            }
        });

        if (apiFiles.length === 0) {
            return res.status(404).json({ error: "No API-related files found in repository" });
        }

        console.log("📂 Extracted API Files:", apiFiles.map(f => f.path));

        // ✅ Step 3: Send API files to Gemini for analysis
        const apiMetadata = await geminiService.getApiMetadata(apiFiles);

        return res.json({ success: true, apiMetadata });
    } catch (error) {
        console.error("❌ Error extracting API metadata:", error.message);
        res.status(500).json({ error: "Failed to extract API metadata" });
    }
};
