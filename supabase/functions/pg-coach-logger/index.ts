
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple logger function
const logEvent = (level, message, data = {}) => {
  const prefix = level === 'ERROR' ? "❌ ERROR" :
                level === 'WARN' ? "⚠️ WARNING" :
                level === 'INFO' ? "ℹ️ INFO" : "🔍 DEBUG";
  
  console.log(`[${prefix}][pg-coach-logger] ${message}`, data);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStartTime = Date.now();
  const requestId = crypto.randomUUID();
  
  logEvent('INFO', `Request received [${requestId}]`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Create Supabase client with the service key for admin access
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Extract user ID and data from request
    let requestBody;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
      
      logEvent('DEBUG', `Request body`, { 
        bodyPreview: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
      });
    } catch (parseError) {
      logEvent('ERROR', `Error parsing request body`, { error: parseError });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { action_type, action_details, conversation_id, user_id } = requestBody;
    
    // Validate required fields
    if (!action_type) {
      logEvent('ERROR', 'Missing required field: action_type');
      return new Response(
        JSON.stringify({ error: 'action_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      logEvent('ERROR', 'Missing required field: user_id');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logEvent('INFO', `Recording activity: ${action_type}`, { userId: user_id });
    
    if (action_details) {
      // Safely log details without exposing sensitive information
      const logSafeDetails = { ...action_details };
      
      // Avoid logging large text fields completely
      const sensitiveKeys = ['prompt', 'full_prompt', 'system_prompt', 'content'];
      sensitiveKeys.forEach(key => {
        if (logSafeDetails[key] && typeof logSafeDetails[key] === 'string' && logSafeDetails[key].length > 100) {
          logSafeDetails[key] = `${logSafeDetails[key].substring(0, 100)}... [${logSafeDetails[key].length} chars total]`;
        }
      });
      
      logEvent('DEBUG', `Activity details`, logSafeDetails);
    }
    
    // Add metadata to the log entry
    const enhancedDetails = {
      ...(action_details || {}),
      _meta: {
        logged_at: new Date().toISOString(),
        request_id: requestId
      }
    };
    
    // Insert into pg_activity_logs table
    const { data, error } = await supabaseAdmin
      .from('pg_activity_logs')
      .insert({
        user_id,
        action_type,
        action_details: enhancedDetails,
        conversation_id: conversation_id || null
      })
      .select('id')
      .single();
      
    if (error) {
      logEvent('ERROR', 'Error logging activity:', { error });
      throw error;
    }
    
    const responseTime = Date.now() - requestStartTime;
    logEvent('INFO', `Successfully logged activity`, { 
      logId: data.id, 
      responseTime: `${responseTime}ms` 
    });
    
    return new Response(
      JSON.stringify({ success: true, log_id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const responseTime = Date.now() - requestStartTime;
    logEvent('ERROR', 'Error:', { 
      error: error.message || 'Unknown error', 
      stack: error.stack,
      responseTime: `${responseTime}ms`
    });
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
