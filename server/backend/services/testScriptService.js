exports.generateTestScript = (apiMetadata) => {
    let script = `
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 10,
    duration: '10s',
};

export default function () {
`;

    apiMetadata.endpoints.forEach((endpoint, index) => {  // 🔹 Use 'index' to generate unique variable names
        const { method, path, headers, bodyParams } = endpoint;
        let requestOptions = {};
        let payload = "{}";

        // Add headers if available
        if (headers && headers.length > 0) {
            requestOptions.headers = headers.reduce((acc, header) => {
                acc[header.key] = header.value;
                return acc;
            }, {});
        }

        // Add body if applicable
        if (method === "POST" || method === "PUT") {
            if (bodyParams && bodyParams.length > 0) {
                payload = JSON.stringify(
                    bodyParams.reduce((acc, param) => {
                        acc[param.key] = param.type === "string" ? "testValue" : 123;
                        return acc;
                    }, {})
                );
                requestOptions.headers = requestOptions.headers || {};
                requestOptions.headers["Content-Type"] = "application/json";
            }
        }

        // 🔹 Use 'res${index}' to make variable names unique
        script += `
    let res${index} = http.${method.toLowerCase()}('http://localhost:3000${path}', ${method === "POST" || method === "PUT" ? `payload, ${JSON.stringify(requestOptions)}` : JSON.stringify(requestOptions)
            });
    check(res${index}, { "status is 200": (r) => r.status === 200 });
    sleep(1);
`;
    });

    script += "}\n";
    return script;
};
