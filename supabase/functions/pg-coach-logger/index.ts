
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved logging function with levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Set current log level
const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;

// Logging function with severity levels
const logEvent = (level, message, data = {}) => {
  if (level >= CURRENT_LOG_LEVEL) {
    const prefix = level === LOG_LEVELS.ERROR ? "❌ ERROR" :
                  level === LOG_LEVELS.WARN ? "⚠️ WARNING" :
                  level === LOG_LEVELS.INFO ? "ℹ️ INFO" : "🔍 DEBUG";
    
    console.log(`[${prefix}][pg-coach-logger] ${message}`, data);
  }
};

// Log debug information
const logDebug = (message, data = {}) => logEvent(LOG_LEVELS.DEBUG, message, data);
// Log information
const logInfo = (message, data = {}) => logEvent(LOG_LEVELS.INFO, message, data);
// Log warnings
const logWarn = (message, data = {}) => logEvent(LOG_LEVELS.WARN, message, data);
// Log errors
const logError = (message, data = {}) => logEvent(LOG_LEVELS.ERROR, message, data);

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestTime = new Date().toISOString();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logDebug(`[${requestId}] Handling CORS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logInfo(`[${requestId}] Received activity logging request`, { time: requestTime });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables for Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body and log it for debugging
    const requestBody = await req.json();
    logDebug(`[${requestId}] Request body`, requestBody);
    
    const { user_id, action_type, action_details, conversation_id } = requestBody;
    
    if (!user_id || !action_type) {
      const errorMsg = 'Missing required parameters: user_id and action_type are required';
      logError(`[${requestId}] ${errorMsg}`, { receivedParams: requestBody });
      throw new Error(errorMsg);
    }
    
    logInfo(`[${requestId}] Logging activity: ${action_type} for user ${user_id}`, { 
      conversation_id: conversation_id || 'none',
      hasDetails: !!action_details
    });
    
    // Log the activity
    const { data, error } = await supabase
      .from('pg_activity_logs')
      .insert({
        user_id,
        action_type,
        action_details: action_details || {},
        conversation_id
      })
      .select('id');
      
    if (error) {
      logError(`[${requestId}] Error logging activity:`, error);
      throw error;
    }
    
    logInfo(`[${requestId}] Activity logged successfully`, { 
      log_id: data?.[0]?.id,
      processingTime: `${(new Date().getTime() - new Date(requestTime).getTime())}ms` 
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Activity logged successfully',
        id: data?.[0]?.id
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    logError(`[${requestId}] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred',
        request_id: requestId
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
