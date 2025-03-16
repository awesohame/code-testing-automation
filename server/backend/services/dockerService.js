const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const CONTAINER_NAME = "my-api-container";
const TEST_SCRIPT_NAME = "test-script.js";

exports.buildAndRunContainer = (repoPath) => {
    return new Promise((resolve, reject) => {
        const serverPath = path.join(repoPath, "server");
        console.log(`🚀 Building and starting Docker container...`);

        exec(
            `cd ${serverPath} && docker build -t my-api . && docker run -d -p 8000:3000 --name ${CONTAINER_NAME} my-api`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error("❌ Failed to start Docker container:", stderr);
                    return reject(new Error("Failed to start Docker container"));
                }

                console.log("✅ Docker container started. Waiting for readiness...");

                // Wait until the container is fully ready
                waitForContainerReady(CONTAINER_NAME, 10)
                    .then(resolve)
                    .catch(reject);
            }
        );
    });
};

exports.injectTestScript = (repoPath, testScript) => {
    return new Promise((resolve, reject) => {
        const testDir = path.join(repoPath, "server", "load-test");
        const scriptPath = path.join(testDir, TEST_SCRIPT_NAME);

        console.log("📂 Ensuring 'load-test' directory exists...");
        if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

        console.log("📝 Writing test script...");
        fs.writeFile(scriptPath, testScript, (err) => {
            if (err) {
                console.error("❌ Failed to write test script:", err);
                return reject(new Error("Failed to write test script"));
            }

            console.log("🔄 Waiting for container readiness before injecting script...");
            waitForContainerReady(CONTAINER_NAME, 10)
                .then(() => {
                    console.log(`📦 Creating 'load-test' directory inside container (${CONTAINER_NAME})...`);
                    exec(`docker exec ${CONTAINER_NAME} mkdir -p /app/load-test`, (mkdirErr) => {
                        if (mkdirErr) {
                            console.error("❌ Failed to create 'load-test' directory:", mkdirErr);
                            return reject(new Error("Failed to create 'load-test' directory"));
                        }

                        console.log("📤 Copying test script into the container...");
                        exec(`docker cp ${scriptPath} ${CONTAINER_NAME}:/app/load-test/${TEST_SCRIPT_NAME}`, (copyErr, stdout, stderr) => {
                            if (copyErr) {
                                console.error("❌ Failed to inject test script:", stderr);
                                return reject(new Error("Failed to inject test script into container"));
                            }
                            console.log("✅ Test script injected successfully.");
                            resolve();
                        });
                    });
                })
                .catch(reject);
        });
    });
};

/**
 * Runs the K6 load test inside the running Docker container.
 */
exports.runLoadTests = () => {
    return new Promise((resolve, reject) => {
        console.log("🚀 Running K6 load tests inside the container...");

        exec(`docker exec ${CONTAINER_NAME} k6 run /app/load-test/${TEST_SCRIPT_NAME}`, (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Load test failed:", stderr);
                return reject(new Error(`Load test failed: ${stderr}`));
            }

            console.log("✅ Load test completed successfully.");
            resolve(stdout);
        });
    });
};

/**
 * Waits for the container to be fully ready before proceeding.
 */
function waitForContainerReady(containerName, retries) {
    return new Promise((resolve, reject) => {
        if (retries === 0) return reject(new Error("Container did not become ready in time."));

        exec(`docker ps -q -f name=${containerName}`, (err, stdout) => {
            if (stdout.trim()) {
                console.log("✅ Container is ready.");
                resolve();
            } else {
                console.log(`⏳ Waiting for container to be ready... (${retries} retries left)`);
                setTimeout(() => waitForContainerReady(containerName, retries - 1).then(resolve).catch(reject), 2000);
            }
        });
    });
}
