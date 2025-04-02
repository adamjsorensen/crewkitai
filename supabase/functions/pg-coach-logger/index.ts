
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables for Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { user_id, action_type, action_details, conversation_id } = await req.json();
    
    if (!user_id || !action_type) {
      throw new Error('Missing required parameters: user_id and action_type are required');
    }
    
    console.log(`[pg-coach-logger] Logging activity: ${action_type} for user ${user_id}`);
    
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
      console.error('[pg-coach-logger] Error logging activity:', error);
      throw error;
    }
    
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
    console.error('[pg-coach-logger] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred'
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
