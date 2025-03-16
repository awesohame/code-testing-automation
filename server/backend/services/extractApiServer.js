const path = require("path");
const fs = require("fs-extra");
const geminiService = require("./geminiService"); // Handles Gemini API calls

// Function to detect entry file
const findEntryFile = (repoPath) => {
    const possibleFiles = ["server.js", "app.js", "index.js"];
    for (const file of possibleFiles) {
        const filePath = path.join(repoPath, "server", file);
        if (fs.existsSync(filePath)) return filePath;
    }
    throw new Error("Entry file not found");
};

// Function to collect relevant API files
const extractApiFiles = (repoPath) => {
    const serverDir = path.join(repoPath, "server");
    const routesDir = path.join(serverDir, "routes");
    const controllersDir = path.join(serverDir, "controllers");

    const entryFile = findEntryFile(repoPath);
    const filesToRead = [entryFile];

    if (fs.existsSync(routesDir)) {
        filesToRead.push(...fs.readdirSync(routesDir).map(f => path.join(routesDir, f)));
    }
    if (fs.existsSync(controllersDir)) {
        filesToRead.push(...fs.readdirSync(controllersDir).map(f => path.join(controllersDir, f)));
    }

    return filesToRead.map(file => ({
        path: file,
        content: fs.readFileSync(file, "utf-8"),
    }));
};

// Main function to extract API data
exports.extractApiMetadata = async (repoPath) => {
    try {
        const apiFiles = extractApiFiles(repoPath);
        const metadata = await geminiService.getApiMetadata(apiFiles);
        return metadata;
    } catch (error) {
        throw new Error("Failed to extract API metadata: " + error.message);
    }
};
