from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from standardizer import decompose_code, generate_query, retrieve_standards, transform_code, verify_code

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, specify your frontend URL(s)
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