// Supabase Edge Function for Graphlit MCP Server
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Generate a JWT token for Graphlit API authentication
const generateGraphlitJwt = async () => {
  // Get Graphlit credentials
  const orgId = Deno.env.get('GRAPHLIT_ORGANIZATION_ID');
  const envId = Deno.env.get('GRAPHLIT_ENVIRONMENT_ID');
  const jwtSecret = Deno.env.get('GRAPHLIT_JWT_SECRET');
  
  if (!orgId || !envId || !jwtSecret) {
    throw new Error('Required Graphlit environment variables are not set. Please ensure GRAPHLIT_ORGANIZATION_ID, GRAPHLIT_ENVIRONMENT_ID, and GRAPHLIT_JWT_SECRET are set.');
  }
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token expires in 1 hour
  
  // Try a different approach for the JWT payload - using specific claim syntax
  const projectId = Deno.env.get('GRAPHLIT_PROJECT_ID') || 'dd7c4ce6-22e5-430b-947e-bbfde2ae11b3';
  
  console.log('Using Project ID:', projectId);
  
  // Use standard JWT claims plus custom claims
  const payload = {
    // Standard JWT claims
    sub: projectId, // Use the project ID as the subject
    iss: 'crewkitai',
    iat: now,
    exp,
    aud: 'graphlit-api',
    // Custom claims with additional prefixes as sometimes required by APIs
    'https://graphlit.io/claims/organization_id': orgId,
    'https://graphlit.io/claims/environment_id': envId,
    'https://graphlit.io/claims/project_id': projectId
  };
  
  console.log('JWT Payload:', JSON.stringify(payload));
  
  try {
    // Use the JWT secret as provided (base64 encoded)
    // Since the secret is already provided in the correct format from Graphlit,
    // we don't need to encode it again
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Sign the JWT token
    const token = await create(
      { alg: "HS256", typ: "JWT" },
      payload,
      key
    );
    
    return token;
  } catch (error) {
    console.error('JWT Generation Error:', error);
    throw new Error(`Failed to generate JWT: ${error.message}`);
  }
};

// GraphQL implementation of Graphlit API calls
const graphlitApiRequest = async (operationName: string, query: string, variables?: any) => {
  // Get Graphlit credentials
  const orgId = Deno.env.get('GRAPHLIT_ORGANIZATION_ID');
  const envId = Deno.env.get('GRAPHLIT_ENVIRONMENT_ID');
  
  if (!orgId || !envId) {
    throw new Error('Required Graphlit environment variables are not set. Please ensure GRAPHLIT_ORGANIZATION_ID and GRAPHLIT_ENVIRONMENT_ID are set.');
  }
  
  // Use the correct GraphQL endpoint
  const url = 'https://data-scus.graphlit.io/api/v1/graphql';
  
  // Prepare the GraphQL request body
  const graphqlBody = {
    operationName,
    query,
    variables: variables || {}
  };
  
  // Add organization, environment, and project IDs to variables
  const projectId = Deno.env.get('GRAPHLIT_PROJECT_ID') || 'dd7c4ce6-22e5-430b-947e-bbfde2ae11b3';
  graphqlBody.variables.organizationId = orgId;
  graphqlBody.variables.environmentId = envId;
  graphqlBody.variables.projectId = projectId; // Include project ID in GraphQL variables
  
  console.log('GraphQL Request details:');
  console.log('- URL:', url);
  console.log('- Operation:', operationName);
  console.log('- Organization:', orgId);
  console.log('- Environment:', envId);
  console.log('- Query:', query);
  console.log('- Variables:', JSON.stringify(graphqlBody.variables));
  
  try {
    // Generate JWT token for authentication
    const jwtToken = await generateGraphlitJwt();
    console.log('- JWT Token:', `${jwtToken.substring(0, 20)}...`);
    
    // Send the GraphQL request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(graphqlBody),
    });
    
    console.log('Response details:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', JSON.stringify(Object.fromEntries([...response.headers])));
    
    const text = await response.text();
    console.log('- Body:', text);
    
    if (!response.ok) {
      throw new Error(`Graphlit API error (${response.status}): ${text}`);
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Error in graphlitApiRequest:', error);
    throw error;
  }
};

// MCP tool implementations
const mcpTools: Record<string, (params: any) => Promise<any>> = {
  // Collection operations
  'mcp0_queryCollections': async (params: any) => {
    const { name, limit = 100 } = params || {};
    
    // GraphQL query for collections
    const query = `
      query QueryCollections($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $limit: Int, $name: String) {
        collections(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, limit: $limit, name: $name) {
          items {
            id
            name
            contents {
              count
            }
          }
        }
      }
    `;
    
    return graphlitApiRequest('QueryCollections', query, { name, limit });
  },
  
  'mcp0_createCollection': async (params: any) => {
    const { name, contents } = params;
    
    // GraphQL mutation for creating a collection
    const mutation = `
      mutation CreateCollection($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $name: String!, $contents: [ID!]) {
        createCollection(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, name: $name, contents: $contents) {
          id
          name
        }
      }
    `;
    
    return graphlitApiRequest('CreateCollection', mutation, { name, contents });
  },
  
  'mcp0_addContentsToCollection': async (params: any) => {
    const { id, contents } = params;
    
    // GraphQL mutation for adding contents to a collection
    const mutation = `
      mutation AddContentsToCollection($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $id: ID!, $contents: [ID!]!) {
        addContentsToCollection(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, id: $id, contents: $contents) {
          id
          name
        }
      }
    `;
    
    return graphlitApiRequest('AddContentsToCollection', mutation, { id, contents });
  },
  
  'mcp0_removeContentsFromCollection': async (params: any) => {
    const { id, contents } = params;
    
    // GraphQL mutation for removing contents from a collection
    const mutation = `
      mutation RemoveContentsFromCollection($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $id: ID!, $contents: [ID!]!) {
        removeContentsFromCollection(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, id: $id, contents: $contents) {
          id
          name
        }
      }
    `;
    
    return graphlitApiRequest('RemoveContentsFromCollection', mutation, { id, contents });
  },
  
  // Retrieval operations
  'mcp0_retrieveSources': async (params: any) => {
    const { prompt, contentType, fileType, inLast, collections, feeds } = params || {};
    
    // GraphQL query for retrieving sources
    const query = `
      query RetrieveSources(
        $organizationId: ID!, 
        $environmentId: ID!, 
        $projectId: ID!,
        $prompt: String!, 
        $contentType: ContentType, 
        $fileType: FileType, 
        $inLast: String, 
        $collections: [ID!], 
        $feeds: [ID!]
      ) {
        retrieveSources(
          organizationId: $organizationId, 
          environmentId: $environmentId,
          projectId: $projectId,
          prompt: $prompt, 
          type: $contentType, 
          fileType: $fileType, 
          inLast: $inLast, 
          collections: $collections, 
          feeds: $feeds
        ) {
          items {
            id
            name
            contentType
            fileType
            timestamp
            uri
            summary
          }
        }
      }
    `;
    
    const variables = { 
      prompt, 
      contentType, 
      fileType, 
      inLast,
      collections: collections ? (Array.isArray(collections) ? collections : [collections]) : undefined,
      feeds: feeds ? (Array.isArray(feeds) ? feeds : [feeds]) : undefined
    };
    
    return graphlitApiRequest('RetrieveSources', query, variables);
  },
  
  // Content operations
  'mcp0_queryContents': async (params: any) => {
    const { name, type, fileType, inLast, limit = 100, collections, feeds, location } = params || {};
    
    // GraphQL query for contents
    const query = `
      query QueryContents(
        $organizationId: ID!, 
        $environmentId: ID!, 
        $name: String, 
        $type: ContentType, 
        $fileType: FileType, 
        $inLast: String, 
        $limit: Int,
        $collections: [ID!], 
        $feeds: [ID!],
        $location: LocationInput
      ) {
        contents(
          organizationId: $organizationId, 
          environmentId: $environmentId, 
          name: $name, 
          type: $type, 
          fileType: $fileType, 
          inLast: $inLast, 
          limit: $limit,
          collections: $collections, 
          feeds: $feeds,
          location: $location
        ) {
          items {
            id
            name
            contentType
            fileType
            timestamp
            uri
          }
        }
      }
    `;
    
    const variables = { 
      name, 
      type, 
      fileType, 
      inLast,
      limit,
      collections: collections ? (Array.isArray(collections) ? collections : [collections]) : undefined,
      feeds: feeds ? (Array.isArray(feeds) ? feeds : [feeds]) : undefined,
      location
    };
    
    return graphlitApiRequest('QueryContents', query, variables);
  },
  
  // Ingestion operations
  'mcp0_ingestText': async (params: any) => {
    const { name, text, textType, id } = params;
    
    // GraphQL mutation for ingesting text
    const mutation = `
      mutation IngestText($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $name: String!, $text: String!, $textType: TextType, $id: ID) {
        ingestText(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, name: $name, text: $text, textType: $textType, id: $id) {
          id
          name
          contentType
          fileType
          uri
        }
      }
    `;
    
    return graphlitApiRequest('IngestText', mutation, { name, text, textType, id });
  },
  
  'mcp0_ingestUrl': async (params: any) => {
    const { url } = params;
    
    // GraphQL mutation for ingesting URL
    const mutation = `
      mutation IngestUrl($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $url: String!) {
        ingestUrl(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, url: $url) {
          id
          name
          contentType
          fileType
          uri
        }
      }
    `;
    
    return graphlitApiRequest('IngestUrl', mutation, { url });
  },
  
  // Health check (custom implementation)
  'health': async () => {
    try {
      console.log('Attempting Graphlit health check via GraphQL...');
      
      // Use a simple GraphQL query to check if the API is available
      // Query to get collections as a health check, including projectId in the parameters
      const collectionsQuery = `
        query GetCollections($organizationId: ID!, $environmentId: ID!, $projectId: ID!, $limit: Int) {
          collections(organizationId: $organizationId, environmentId: $environmentId, projectId: $projectId, limit: $limit) {
            items {
              id
              name
            }
          }
        }
      `;
      
      const result = await graphlitApiRequest(
        'GetCollections', 
        collectionsQuery, 
        { limit: 1 }
      );
      
      return { status: 'healthy', data: result };
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Create a detailed error message
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      };
      
      throw new Error(`Graphlit API unavailable: ${JSON.stringify(errorDetails)}`);
    }
  },
};

// Main request handler
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Parse the request body first
    const requestData = await req.json();
    const { serverName, toolName, params } = requestData;
    
    // Allow anonymous access for health check
    if (toolName === 'health') {
      // Verify we're handling a Graphlit MCP request
      if (serverName !== 'graphlit-mcp-server') {
        return new Response(JSON.stringify({ error: 'Unsupported MCP server' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Call health check directly
      const result = await mcpTools[toolName](params);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // For all other endpoints, require authentication
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: authError?.message || 'User not authenticated' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Request body already parsed above
    
    // Verify we're handling a Graphlit MCP request
    if (serverName !== 'graphlit-mcp-server') {
      return new Response(JSON.stringify({ error: 'Unsupported MCP server' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if the requested tool exists
    if (!mcpTools[toolName]) {
      return new Response(JSON.stringify({ error: `Tool not found: ${toolName}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Call the MCP tool
    const result = await mcpTools[toolName](params);
    
    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log and return any errors
    console.error('Error processing MCP request:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
