from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from standardizer import decompose_code, generate_query, retrieve_standards, transform_code, verify_code
from post2swag import convert_postman_to_swagger
import json
import os
import tempfile
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],  # For development. In production, specify your frontend URL(s)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class CodeRequest(BaseModel):
    code: str

@app.post("/standardize/")
def standardize_code(request: CodeRequest):
    code = request.code
    print(code)
    components = decompose_code(code)
    transformed_components = []

    for comp in components:
        query = generate_query(comp)
        standards = retrieve_standards(query)
        transformed = transform_code(comp, standards)

        transformed_components.append(transformed)
        # if verify_code(comp, transformed):
        # else:
        #     transformed_components.append("Verification failed - needs human review")
        # transformed_components.append(transformed)
    

    return {"transformed_code": transformed_components}

@app.get("/")
def root():
    return {"message": "Standardization API is running!"}


@app.post('/convert')
async def convert(file: UploadFile = File(...)):
    """
    API endpoint to handle file upload and conversion
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # Read the file content
        postman_json = json.loads(await file.read())

        # Convert to Swagger
        swagger_json = convert_postman_to_swagger(postman_json)

        # Create a temporary file
        temp_dir = tempfile.gettempdir()
        output_filename = os.path.splitext(file.filename)[0] + "_swagger.json"
        output_path = os.path.join(temp_dir, output_filename)

        # Write the Swagger JSON to the temporary file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(swagger_json, f, indent=2)

        # Send the file as a response
        return FileResponse(
            output_path,
            filename=output_filename,
            media_type='application/json'
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})