# from flask import Flask, request, jsonify, send_file
# from flask_cors import CORS
import json
import re
import os
import tempfile
from collections import defaultdict

# app = Flask(__name__)
# # Configure CORS to allow credentials and requests from the frontend
# CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

def convert_postman_to_swagger(postman_json):
    """
    Convert Postman collection to Swagger/OpenAPI 3.0.0 format
    """
    try:
        # If input is string, parse it
        if isinstance(postman_json, str):
            postman_data = json.loads(postman_json)
        else:
            postman_data = postman_json
            
        # Initialize Swagger structure
        swagger_data = {
            "openapi": "3.0.0",
            "info": {
                "title": postman_data.get("info", {}).get("name", "API Documentation"),
                "description": "Generated from Postman collection",
                "version": "1.0.0"
            },
            "servers": [
                {
                    "url": get_base_url(postman_data),
                    "description": "API Server"
                }
            ],
            "paths": {},
            "components": {
                "schemas": {},
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                }
            }
        }
        
        # Process all items recursively
        process_items(postman_data.get("item", []), swagger_data["paths"], "")
        
        return swagger_data
        
    except Exception as e:
        return {"error": f"Failed to convert: {str(e)}"}

def get_base_url(postman_data):
    """
    Extract base URL from Postman variables
    """
    variables = postman_data.get("variable", [])
    server_var = next((var for var in variables if var.get("key") == "server"), None)
    
    if server_var:
        return server_var.get("value", "http://localhost")
    
    return "http://localhost:8000/api/v1"  # Default value based on the collection

def process_items(items, paths, parent_path):
    """
    Process Postman items recursively and add them to Swagger paths
    """
    for item in items:
        # If it's a folder, process its children
        if "item" in item:
            process_items(item["item"], paths, f"{parent_path}/{item['name']}" if parent_path else item["name"])
        # If it's a request, process it
        elif "request" in item:
            process_request(item, paths, parent_path)

def process_request(item, paths, parent_path):
    """
    Process a single Postman request and convert it to Swagger path
    """
    request = item["request"]
    
    # Extract method and URL
    method = request["method"].lower()
    
    # Process URL
    url_raw = ""
    if isinstance(request["url"], dict):
        if "raw" in request["url"]:
            url_raw = request["url"]["raw"]
        else:
            # Construct URL from parts
            host = "/".join(request["url"].get("host", []))
            path = "/".join(request["url"].get("path", []))
            url_raw = f"{host}/{path}"
    else:
        url_raw = request["url"]
    
    # Replace variables
    url_raw = re.sub(r"\{\{([^}]+)\}\}", r"{{\1}}", url_raw)
    
    # Extract path without base URL and query parameters
    path = extract_path(url_raw)
    
    # Convert path params from :param to {param}
    path = re.sub(r":([^/]+)", r"{\1}", path)
    
    # Get or create path object
    if path not in paths:
        paths[path] = {}
    
    # Parameters
    parameters = []
    
    # Add path parameters
    path_params = re.findall(r"\{([^}]+)\}", path)
    for param in path_params:
        parameters.append({
            "name": param,
            "in": "path",
            "required": True,
            "schema": {"type": "string"}
        })
    
    # Add query parameters
    # Add query parameters
    if isinstance(request["url"], dict) and "query" in request["url"]:
        query_params = request["url"].get("query", [])
        if query_params:
            for query in query_params:
                if not query.get("disabled", False):
                    parameters.append({
                        "name": query["key"],
                        "in": "query",
                        "required": False,
                        "schema": {"type": "string"}
                    })

    # Request body
    request_body = None
    if "body" in request and request["body"]:
        request_body = process_request_body(request["body"])
    
    # Create operation object
    operation = {
        "tags": [parent_path if parent_path else "default"],
        "summary": item["name"],
        "description": item.get("description", ""),
        "operationId": sanitize_operation_id(item["name"]),
        "responses": {
            "200": {
                "description": "Successful operation"
            },
            "400": {
                "description": "Bad request"
            },
            "401": {
                "description": "Unauthorized"
            },
            "404": {
                "description": "Not found"
            },
            "500": {
                "description": "Internal server error"
            }
        }
    }
    
    # Add parameters if any
    if parameters:
        operation["parameters"] = parameters
    
    # Add request body if any
    if request_body:
        operation["requestBody"] = request_body
    
    # Add security if needed (assuming JWT for auth endpoints)
    if "login" not in path and "register" not in path:
        operation["security"] = [{"bearerAuth": []}]
    
    # Add operation to path
    paths[path][method] = operation

def extract_path(url_raw):
    """
    Extract path from raw URL
    """
    # Remove query parameters
    url_without_query = url_raw.split("?")[0]
    
    # Remove variable syntax
    url_without_var = re.sub(r"\{\{[^}]+\}\}", "", url_without_query)
    
    # If it's a full URL, extract only the path
    if url_without_var.startswith("http"):
        parts = url_without_var.split("/", 3)
        if len(parts) >= 4:
            return "/" + parts[3]
    
    # For relative paths, ensure they start with /
    return "/" + url_without_var if not url_without_var.startswith("/") else url_without_var

def process_request_body(body):
    """
    Process request body and convert to Swagger format
    """
    if body.get("mode") == "raw":
        try:
            # Try to parse JSON
            content_type = "application/json"
            raw_data = body.get("raw", "{}")
            
            # Remove comments from JSON
            raw_data = re.sub(r"//.*?(\n|$)", "", raw_data)
            
            if raw_data.strip():
                json_data = json.loads(raw_data)
                schema = infer_schema(json_data)
                
                return {
                    "content": {
                        content_type: {
                            "schema": schema
                        }
                    }
                }
            
        except json.JSONDecodeError:
            # Fallback to text if not valid JSON
            return {
                "content": {
                    "text/plain": {
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
    
    elif body.get("mode") == "formdata":
        schema = {
            "type": "object",
            "properties": {}
        }
        required = []
        
        for param in body.get("formdata", []):
            prop_name = param.get("key", "")
            if param.get("type") == "file":
                schema["properties"][prop_name] = {
                    "type": "string",
                    "format": "binary"
                }
            else:
                schema["properties"][prop_name] = {
                    "type": "string",
                    "example": param.get("value", "")
                }
            
            if param.get("required", False):
                required.append(prop_name)
        
        if required:
            schema["required"] = required
        
        return {
            "content": {
                "multipart/form-data": {
                    "schema": schema
                }
            }
        }
    
    # Default empty body
    return None

def infer_schema(data):
    """
    Infer JSON schema from sample data
    """
    if isinstance(data, dict):
        properties = {}
        for key, value in data.items():
            properties[key] = infer_schema(value)
        
        return {
            "type": "object",
            "properties": properties
        }
    
    elif isinstance(data, list):
        if data:
            # Use the first item as representative
            return {
                "type": "array",
                "items": infer_schema(data[0])
            }
        else:
            return {
                "type": "array",
                "items": {}
            }
    
    elif isinstance(data, str):
        return {"type": "string"}
    
    elif isinstance(data, bool):
        return {"type": "boolean"}
    
    elif isinstance(data, int):
        return {"type": "integer"}
    
    elif isinstance(data, float):
        return {"type": "number"}
    
    elif data is None:
        return {"type": "null"}
    
    else:
        return {"type": "string"}

def sanitize_operation_id(name):
    """
    Create a valid operationId from the request name
    """
    # Replace non-alphanumeric characters with spaces
    sanitized = re.sub(r'[^a-zA-Z0-9]', ' ', name)
    # Convert to camelCase
    words = sanitized.split()
    if not words:
        return "operation"
    return words[0].lower() + ''.join(word.capitalize() for word in words[1:])

