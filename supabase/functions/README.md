# CrewKitAI Supabase Edge Functions

This directory contains Edge Functions for the CrewKitAI application, specifically the Graphlit MCP server implementation for RAG capabilities.

## Graphlit MCP Server

The `graphlit-mcp` function provides a standalone implementation of the Graphlit Machine Communication Protocol server, which enables Retrieval Augmented Generation (RAG) capabilities for the PainterGrowth Coach and Strategic Compass features.

### Local Development

To run the Edge Function locally for development:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start the local development server
supabase start

# Run the function locally
supabase functions serve graphlit-mcp --env-file .env.local
```

### Environment Variables

The function requires the following environment variables:

- `GRAPHLIT_API_KEY`: Your Graphlit API key
- `GRAPHLIT_MODEL_PROVIDER`: The model provider to use (e.g., 'anthropic', 'openai')

Supabase automatically provides:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Deployment

To deploy the function to your Supabase project:

```bash
# Make the deployment script executable
chmod +x scripts/deploy-mcp-function.sh

# Run the deployment script
./scripts/deploy-mcp-function.sh
```

Alternatively, deploy manually:

```bash
# Deploy the function
supabase functions deploy graphlit-mcp --no-verify-jwt

# Set secrets
supabase secrets set GRAPHLIT_API_KEY=your_api_key GRAPHLIT_MODEL_PROVIDER=anthropic
```

### Testing

After deployment, you can test the function with:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/graphlit-mcp \
  -H "Authorization: Bearer your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{"serverName":"graphlit-mcp-server","toolName":"health","params":{}}'
```

## Frontend Integration

The CrewKitAI frontend is configured to use both Windsurf MCP (in development) and the Supabase Edge Function (in production) through the `mcpUtils.ts` utility.

Add the following to your `.env.local` file for the frontend:

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_EDGE_FUNCTION_URL=https://your-project-ref.supabase.co/functions/v1/graphlit-mcp
```
