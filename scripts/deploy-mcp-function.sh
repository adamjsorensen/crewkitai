#!/bin/bash
# Script to deploy the Graphlit MCP Edge Function to Supabase

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Login to Supabase if needed
supabase login

# Set Graphlit API key from environment or prompt user
if [ -z "$GRAPHLIT_API_KEY" ]; then
    read -p "Enter your Graphlit API key: " GRAPHLIT_API_KEY
fi

# Set model provider from environment or default to anthropic
GRAPHLIT_MODEL_PROVIDER=${GRAPHLIT_MODEL_PROVIDER:-anthropic}

# Deploy the function with secrets
echo "Deploying Graphlit MCP Edge Function..."
supabase functions deploy graphlit-mcp --no-verify-jwt

# Set secrets for the function
echo "Setting secrets for Graphlit MCP Edge Function..."
supabase secrets set GRAPHLIT_API_KEY="$GRAPHLIT_API_KEY" GRAPHLIT_MODEL_PROVIDER="$GRAPHLIT_MODEL_PROVIDER"

echo "Deployment complete! Function is now available at:"
echo "https://[your-project-ref].supabase.co/functions/v1/graphlit-mcp"
echo ""
echo "Add the following to your .env.local file:"
echo "REACT_APP_SUPABASE_EDGE_FUNCTION_URL=https://[your-project-ref].supabase.co/functions/v1/graphlit-mcp"
