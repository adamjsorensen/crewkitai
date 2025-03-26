
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { action_type, action_details, conversation_id, user_id } = await req.json();
    
    // Validate required fields
    if (!action_type) {
      return new Response(
        JSON.stringify({ error: 'action_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[pg-coach-logger] Recording activity: ${action_type}`);
    if (action_details) {
      console.log(`[pg-coach-logger] Details: ${JSON.stringify(action_details).substring(0, 100)}${JSON.stringify(action_details).length > 100 ? '...' : ''}`);
    }
    
    // Insert into pg_activity_logs table
    const { data, error } = await supabaseAdmin
      .from('pg_activity_logs')
      .insert({
        user_id,
        action_type,
        action_details: action_details || {},
        conversation_id: conversation_id || null
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('[pg-coach-logger] Error logging activity:', error);
      throw error;
    }
    
    console.log(`[pg-coach-logger] Successfully logged activity with ID: ${data.id}`);
    
    return new Response(
      JSON.stringify({ success: true, log_id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[pg-coach-logger] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
