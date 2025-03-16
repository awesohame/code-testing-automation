const fs = require("fs");
const path = require("path");

function getEntryFile(repoPath) {
    console.log("🔎 Checking repoPath:", repoPath);

    const serverDir = path.join(repoPath, "server");
    console.log("📂 Expected server directory:", serverDir);

    if (!fs.existsSync(serverDir)) {
        console.error("❌ Server directory does NOT exist:", serverDir);
        return null;
    }

    // ✅ Common Node.js entry files
    const nodeEntryFiles = ["server.js", "app.js", "index.js"];

    // ✅ Common Python Flask entry files
    const flaskEntryFiles = ["app.py", "main.py"];

    // ✅ Common Django entry file
    const djangoEntryFile = "manage.py";

    console.log("🔍 Searching for entry files...");

    // 🔎 Look for Node.js entry files
    for (const file of nodeEntryFiles) {
        const fullPath = path.join(serverDir, file);
        console.log("🔍 Checking (Node.js):", fullPath);
        if (fs.existsSync(fullPath)) {
            console.log("✅ Found Node.js entry file:", fullPath);
            return fullPath;
        }
    }

    // 🔎 Look for Flask entry files
    for (const file of flaskEntryFiles) {
        const fullPath = path.join(serverDir, file);
        console.log("🔍 Checking (Flask):", fullPath);
        if (fs.existsSync(fullPath)) {
            console.log("✅ Found Flask entry file:", fullPath);
            return fullPath;
        }
    }

    // 🔎 Look for Django manage.py
    const djangoPath = path.join(serverDir, djangoEntryFile);
    console.log("🔍 Checking (Django):", djangoPath);
    if (fs.existsSync(djangoPath)) {
        console.log("✅ Found Django entry file:", djangoPath);
        return djangoPath;
    }

    console.error("❌ No valid entry file found.");
    return null;
}

module.exports = { getEntryFile };
