const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Define structured schema with request body support
const apiSchema = {
    type: SchemaType.OBJECT,
    properties: {
        endpoints: {
            type: SchemaType.ARRAY,
            description: "List of API endpoints with details",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    method: {
                        type: SchemaType.STRING,
                        description: "HTTP method (GET, POST, PUT, DELETE, etc.)",
                    },
                    path: {
                        type: SchemaType.STRING,
                        description: "API route path (e.g., /users, /products/:id)",
                    },
                    headers: {
                        type: SchemaType.ARRAY,
                        description: "List of expected request headers as key-value pairs",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                key: {
                                    type: SchemaType.STRING,
                                    description: "Header name (e.g., Authorization, Content-Type)",
                                },
                                value: {
                                    type: SchemaType.STRING,
                                    description: "Expected value or format of the header",
                                },
                            },
                            required: ["key", "value"],
                        },
                    },
                    description: {
                        type: SchemaType.STRING,
                        description: "Brief description of what this endpoint does",
                    },
                    bodyParams: {
                        type: SchemaType.ARRAY,
                        description: "List of expected body parameters for POST/PUT requests",
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                key: {
                                    type: SchemaType.STRING,
                                    description: "Request body field name (e.g., name, email)",
                                },
                                type: {
                                    type: SchemaType.STRING,
                                    description: "Expected data type (e.g., string, number, boolean)",
                                },
                                required: {
                                    type: SchemaType.BOOLEAN,
                                    description: "Whether this field is mandatory",
                                },
                            },
                            required: ["key", "type", "required"],
                        },
                    },
                },
                required: ["method", "path"],
            },
        },
    },
};

exports.getApiMetadata = async (apiFiles) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: apiSchema,
            },
        });

        // ✅ Prepare prompt
        const fileContents = apiFiles.map(f => `File: ${f.path}\n${f.content}`).join("\n\n");
        const prompt = `
Analyze the following backend code and extract API metadata, including:
- HTTP methods (GET, POST, PUT, DELETE, etc.)
- Paths (e.g., /users, /products/:id)
- Headers (if any)
- Descriptions of what the endpoint does
- Required request body parameters for POST and PUT methods, including their names, types, and whether they are mandatory.

Format the response strictly based on the provided schema.

${fileContents}`;

        // ✅ Call Gemini
        const result = await model.generateContent(prompt);
        const responseJson = JSON.parse(result.response.text());

        console.log("✅ Gemini API response:", responseJson);
        return responseJson;
    } catch (error) {
        console.error("❌ Error in Gemini API call:", error);
        return { error: "Failed to analyze API metadata" };
    }
};
