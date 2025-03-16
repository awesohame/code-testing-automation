const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");

// Get the root project directory
const rootDir = path.join(__dirname, "..", "..");  // Moves up to the root of the repo

exports.cloneRepo = (repoUrl) => {
    return new Promise((resolve, reject) => {
        const repoName = path.basename(repoUrl, ".git") + "-" + uuidv4();
        const tempDir = path.join(rootDir, "repos", repoName); // ✅ Now clones into /repos/

        console.log("🛠️ Cloning repository:", repoUrl);
        console.log("📂 Target directory:", tempDir);

        // Ensure the `/repos/` folder exists in the root directory
        fs.ensureDir(path.join(rootDir, "repos"), (err) => {
            if (err) console.warn("⚠️ Could not create /repos/ directory:", err);

            // Remove the repo folder if it already exists
            fs.remove(tempDir, (err) => {
                if (err) console.warn("⚠️ Could not remove old repo:", err);

                // Clone the repo into `/repos/[foldername]` at root level
                exec(`git clone ${repoUrl} ${tempDir}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error("❌ Clone failed:", stderr);
                        return reject(new Error("Failed to clone repository"));
                    }
                    console.log("✅ Clone successful:", stdout);
                    resolve(tempDir);
                });
            });
        });
    });
};
