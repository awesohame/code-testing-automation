// standardizeCode.ts
//@ts-nocheck
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createClient } from '@supabase/supabase-js';
import { JinaEmbeddings } from '@langchain/community/embeddings/jina';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

// Type definitions
export interface TransformResult {
  originalCode: string;
  transformedCode: string;
  standards: string;
  query: string;
  success: boolean;
}

export interface CodeStandardizerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  jinaApiKey: string;
  googleApiKey: string;
}

export class CodeStandardizer {
  private supabase;
  private embeddings;
  private model;

  constructor(config: CodeStandardizerConfig) {
    // Initialize Supabase and embeddings
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

    this.embeddings = new JinaEmbeddings({
      apiKey: config.jinaApiKey,
      modelName: "jina-embeddings-v3"
    });

    // Initialize Google AI model
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.googleApiKey,
      modelName: "gemini-2.0-flash",
      temperature: 0,
      maxOutputTokens: 2048,
      timeout: 60000,
      maxRetries: 2
    });
  }

  // Step 1: Decompose code into functions/classes
  private decompose_code(code: string): string[] {
    const components: string[] = [];
    try {
      // Parse the JS/TS code
      const ast = acorn.parse(code, { 
        ecmaVersion: 'latest',
        sourceType: 'module',
        // @ts-ignore - acorn types don't include this but it works
        locations: true
      });
      
      // Walk through the AST to find function and class declarations
      walk.full(ast, (node: any) => {
        if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
          // Extract source for this node
          const start = node.start;
          const end = node.end;
          components.push(code.substring(start, end));
        }
      });
      
      // If no components found, return the entire code
      if (components.length === 0) {
        components.push(code);
      }
    } catch (error) {
      console.error("Error parsing code:", error);
      components.push(code);
    }
    
    return components;
  }

  // Step 2: Generate a query for the vector store
  private async generate_query(component: string): Promise<string> {
    const prompt = `Analyze this code component and generate a concise query to retrieve relevant coding standards:

    Code Component:
    ${component}

    Query:`;
    
    const result = await this.model.invoke(prompt);
    return result.content as string;
  }

  // Step 3: Retrieve standards from Supabase
  private async retrieve_standards(query: string): Promise<string> {
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      this.embeddings,
      {
        client: this.supabase,
        tableName: "documents",
        queryName: "match_documents",
      }
    );
    
    const docs = await vectorStore.similaritySearch(query, 2);
    return docs.map(doc => doc.pageContent).join("\n");
  }

  // Step 4: Transform code with standards
  private async transform_code(component: string, standards: string): Promise<string> {
    const prompt = `Rewrite this code to follow company standards:

    Standards:
    ${standards}

    Original Code:
    ${component}

    Transformed Code:`;
    
    const result = await this.model.invoke(prompt);
    return result.content;
  }

  // Step 5: Verify completeness
  private async verify_code(original: string, transformed: string): Promise<boolean> {
    const prompt = `Verify if this transformed code fully implements the original logic:

    Original:
    ${original}

    Transformed:
    ${transformed}

    Answer YES or NO:`;
    
    const result = await this.model.invoke(prompt);
    return result.content.trim().toUpperCase().includes("YES");
  }

  // Main method to transform code
  public async standardize(code: string): Promise<TransformResult[]> {
    const results: TransformResult[] = [];
    const components = this.decompose_code(code);
    
    for (const component of components) {
      const query = await this.generate_query(component);
      const standards = await this.retrieve_standards(query);
      const transformedCode = await this.transform_code(component, standards);
      const success = await this.verify_code(component, transformedCode);
      
      results.push({
        originalCode: component,
        transformedCode,
        standards,
        query,
        success
      });
    }
    
    return results;
  }
}