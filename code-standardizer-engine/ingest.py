# ingest.py
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import SupabaseVectorStore
# from langchain_openai import OpenAIEmbeddings
from supabase.client import create_client
from langchain_community.embeddings import JinaEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase and OpenAI
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
embeddings = JinaEmbeddings(jina_api_key=os.environ["JINA_API_KEY"],  model_name="jina-embeddings-v3")


# Ingest PDFs into Supabase
def ingest_documents():
    # Load PDFs from the 'documents' folder
    loader = PyPDFDirectoryLoader("documents")
    documents = loader.load()

    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)

    # Store chunks in Supabase vector store
    SupabaseVectorStore.from_documents(
        docs,
        embeddings,
        client=supabase,
        table_name="documents",
        query_name="match_documents",
    )
    print("✅ Documents ingested successfully!")


if __name__ == "__main__":
    ingest_documents()