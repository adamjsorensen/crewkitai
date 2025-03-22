
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  console.log(`[ai-coach] Request received: ${req.method} ${req.url}`);
  
  // Handle OPTIONS (CORS preflight) requests
  if (req.method === 'OPTIONS') {
    console.log('[ai-coach] Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Health check endpoint
    if (req.method === 'GET') {
      console.log('[ai-coach] Handling GET request (health check)');
      return new Response(
        JSON.stringify({ status: 'ok', version: '20-restored' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Handle POST requests
    if (req.method === 'POST') {
      console.log('[ai-coach] Handling POST request');
      
      // Parse request body
      const requestData = await req.json();
      const message = requestData.message || 'No message provided';
      
      console.log(`[ai-coach] Received message: ${message.substring(0, 50)}...`);
      
      // Simple response for now - stable implementation
      const responseData = {
        response: `You asked: "${message.substring(0, 30)}..." - This is the restored stable version of the AI Coach. We'll implement the full AI capabilities once we confirm this version is working reliably.`,
        suggestedFollowUps: [
          "How do I price a job properly?",
          "What marketing strategies work best for painters?",
          "How can I improve my crew's efficiency?",
          "What should I include in my contracts?"
        ],
        timestamp: new Date().toISOString()
      };
      
      console.log('[ai-coach] Sending response');
      
      return new Response(
        JSON.stringify(responseData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Handle other request methods
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ai-coach] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
