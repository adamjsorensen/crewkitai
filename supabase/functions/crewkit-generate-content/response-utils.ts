
// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Format error response
export const errorResponse = (status: number, message: string, details: string | null = null) => {
  const body = { 
    error: message,
    details: details,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  };
  
  console.error(`[ERROR] ${message}`, { status, details, body });
  
  return new Response(
    JSON.stringify(body),
    { status, headers: corsHeaders }
  );
};
