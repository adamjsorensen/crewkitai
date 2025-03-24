
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

// This function acts as a cron job to call the compass-notify function
serve(async (req) => {
  console.log("[compass-notify-cron] Cron job triggered");
  
  try {
    // Get API keys and URLs from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    // Initialize client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log("[compass-notify-cron] Calling compass-notify function");
    
    // Call the notification function
    const { data, error } = await supabase.functions.invoke("compass-notify");
    
    if (error) {
      console.error("[compass-notify-cron] Error calling compass-notify:", error);
      throw error;
    }
    
    console.log("[compass-notify-cron] compass-notify function response:", data);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification job completed successfully',
        result: data
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('[compass-notify-cron] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
