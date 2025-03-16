const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.generateTestScript = async (apiMetadata) => {
    const templateScript = `
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 10,
    duration: '10s',
};

const baseUrl = 'http://localhost:3000';

export default function () {
    // API tests will be dynamically inserted here
}
`;

    const prompt = `
You are an AI assistant that generates k6 load test scripts for API testing. 
Follow this template and dont change the base code.:
\`\`\`
${templateScript}
\`\`\`
Given the following API metadata:
\`\`\`
${JSON.stringify(apiMetadata, null, 2)}
\`\`\`
- Generate a robust k6 test script.
- Ensure each request variable is **unique**.
- Handle **errors gracefully** with retries if needed.
- Add **meaningful checks** for status codes.
- Ensure the script runs **without syntax errors**.
- Maintain correct JSON formatting for request bodies.
`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);

        // Extract the text content by calling the function
        let generatedScript = result.response.text();

        // Clean up the script by removing markdown code block formatting
        generatedScript = cleanupGeneratedScript(generatedScript);

        console.log("✅ Generated script preview:", generatedScript.substring(0, 100) + "...");

        // ✅ Ensure script is not empty
        if (!generatedScript) {
            console.error("❌ Generated script is empty.");
            throw new Error("Test script generation failed.");
        }

        return generatedScript;
    } catch (error) {
        console.error("❌ Failed to generate test script:", error);
        throw new Error("Test script generation failed.");
    }
};

// Helper function to clean up the generated script
function cleanupGeneratedScript(script) {
    // Remove opening markdown code fence (```javascript or just ```)
    script = script.replace(/^```(javascript)?\s*/i, '');

    // Remove closing markdown code fence (```)
    script = script.replace(/\s*```\s*$/, '');

    // Trim any extra whitespace
    script = script.trim();

    // Handle potential HTML entities that might be present
    script = script.replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');

    return script;
}