
#!/bin/bash
# Script to deploy the CrewKit Generate Content Edge Function to Supabase

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Login to Supabase if needed
supabase login

# Set OpenAI API key from environment or prompt user
if [ -z "$OPENAI_API_KEY" ]; then
    read -p "Enter your OpenAI API key: " OPENAI_API_KEY
fi

# Deploy the function with secrets
echo "Deploying CrewKit Generate Content Edge Function..."
supabase functions deploy crewkit-generate-content --no-verify-jwt

# Set secrets for the function
echo "Setting secrets for CrewKit Generate Content Edge Function..."
supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"

echo "Deployment complete! Function is now available at:"
echo "https://cicnpivviiqycyudgxxg.supabase.co/functions/v1/crewkit-generate-content"

