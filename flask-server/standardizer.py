import os
from dotenv import load_dotenv
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from supabase.client import create_client
from langchain_community.embeddings import JinaEmbeddings
from pydantic import BaseModel, Field
import ast
import json

# Load environment variables
load_dotenv()

# Initialize Supabase and OpenAI
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
embeddings = JinaEmbeddings(jina_api_key=os.environ["JINA_API_KEY"], model_name="jina-embeddings-v3")

class StandardizedCode(BaseModel):
    language: str = Field(description="The programming language of the input code")
    original_code: str = Field(description="The original code before standardization")
    transformed_code: str = Field(description="The code after applying standardization")
    description: str = Field(description="A brief step by step explanation of the changes made")
    verified: bool = Field(description="Indicates if the transformed code retains the original logic")

# Initialize the LLM with structured output
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.1, max_tokens=None, timeout=None, max_retries=2)
structured_llm = llm.with_structured_output(StandardizedCode)

# Step 1: Decompose code into functions/classes
def decompose_code(code):
    components = []
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                components.append(ast.get_source_segment(code, node))
    except:
        components = [code]
    return components

# Step 2: Intermediate model to generate a query for the vector store
def generate_query(component):
    prompt = f"""Analyze the given code component and generate a precise query to retrieve the most relevant company coding standards:

    Code Component:
    {component}

    Generate a concise query to retrieve relevant standards:"""
    return llm.invoke(prompt).content

# Step 3: Retrieve standards from Supabase
def retrieve_standards(query):
    vector_store = SupabaseVectorStore(
        embedding=embeddings,
        client=supabase,
        table_name="documents",
        query_name="match_documents",
    )
    docs = vector_store.similarity_search(query, k=2)
    return "\n".join([d.page_content for d in docs])

# Function to transform code using company standards
def transform_code(component: str, standards: str) -> dict:
    prompt = f"""Rewrite the given code to strictly adhere to the following company coding standards:

    Company Coding Standards:
    {standards}

    Original Code:
    {component}

    Provide the transformed code below, ensuring all standards are followed:

    Transformed Code:
    """
    response = structured_llm.invoke(prompt)
    json_res = response.model_dump_json(indent=4)
    print(json_res)  # Print structured JSON response
    return json_res

# Step 5: Verify completeness
def verify_code(original, transformed):
    transformed = json.loads(transformed)
    print(transformed["transformed_code"])
    prompt = f"""Verify whether the transformed code accurately and completely implements the original logic:

    Original Code:
    {original}

    Transformed Code:
    {transformed}

    Respond with YES if the logic is fully preserved, otherwise respond with NO:
    """
    return "YES" in llm.invoke(prompt).content.strip().upper()

# Main workflow
def main():
    sample_code = """
    class Solution {
    public:
        int add(int a, int b) {
            return a + b;
        }
    };
    class Solution2 {
    public:
        int subtract(int a, int b) {
            return a - b;
        }
    };
    """
    components = decompose_code(sample_code)
    for comp in components:
        query = generate_query(comp)  # Intermediate step
        standards = retrieve_standards(query)
        transformed = transform_code(comp, standards)
        print(transformed)
        if verify_code(comp, transformed):
            print(f"✅ Transformed Code:\n{transformed}\n")
        else:
            print("❌ Verification failed - needs human review\n")

if __name__ == "__main__":
    main()