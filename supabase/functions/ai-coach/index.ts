
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

// Basic CORS headers - kept very simple
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
};

serve(async (req) => {
  console.log(`[ai-coach] Request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests - extremely simple implementation
  if (req.method === 'OPTIONS') {
    console.log('[ai-coach] Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // For GET requests, return a health check response
    if (req.method === 'GET') {
      console.log('[ai-coach] Handling GET request (health check)');
      return new Response(
        JSON.stringify({ status: 'ok', version: '1' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Handle POST request with minimal implementation
    if (req.method === 'POST') {
      console.log('[ai-coach] Handling POST request');
      
      // Minimal response for testing
      return new Response(
        JSON.stringify({ 
          response: "Hello! This is a test response from the AI coach function.", 
          suggestedFollowUps: [
            "How much should I charge for a painting job?",
            "What are the best marketing strategies?",
            "How can I improve my crew's efficiency?",
            "What equipment is worth investing in?"
          ],
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // If not GET, POST or OPTIONS, return 405 Method Not Allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ai-coach] Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
