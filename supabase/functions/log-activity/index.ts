
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action_type, action_details, affected_user_id, affected_resource_type, affected_resource_id } = await req.json()

    // Log the activity operation
    console.log(`Logging activity: ${action_type} by user ${session.user.id}`)
    
    // For AI interactions, log more details
    if (action_type.includes('chat') || action_type === 'compass_analyze' || action_type === 'content_generated') {
      console.log(`AI interaction: ${action_type}`)
      
      // Truncate very large content for logging purposes
      const truncatedDetails = { ...action_details }
      for (const key in truncatedDetails) {
        if (typeof truncatedDetails[key] === 'string' && truncatedDetails[key].length > 100) {
          truncatedDetails[key] = truncatedDetails[key].substring(0, 100) + '...'
        }
      }
      
      console.log(`Details: ${JSON.stringify(truncatedDetails)}`)
    }

    const { data, error } = await supabaseClient.rpc(
      'log_user_activity',
      {
        p_action_type: action_type,
        p_action_details: action_details || {},
        p_affected_user_id: affected_user_id || null,
        p_affected_resource_type: affected_resource_type || null,
        p_affected_resource_id: affected_resource_id || null
      }
    )

    if (error) {
      console.error('Error logging activity:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, log_id: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in log-activity function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
