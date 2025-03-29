
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

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
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    if (!openAiApiKey) {
      throw new Error('Missing OpenAI API key');
    }
    
    // Create Supabase client with the service key for admin access
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Extract data from request
    const { content, modification } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!modification) {
      return new Response(
        JSON.stringify({ error: 'modification is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user ID from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(`Invalid user token: ${userError?.message || 'No user found'}`);
    }
    
    const userId = user.id;
    
    console.log(`[crewkit-modify-content] Processing content modification request for userId: ${userId}`);
    
    // Get AI settings for model and temperature
    const { data: aiSettings, error: aiSettingsError } = await supabaseAdmin
      .from('ai_settings')
      .select('name, value')
      .in('name', ['content_modifier_temperature', 'content_generator_model']);
    
    // Default AI settings if none found in database
    let temperature = 0.7;
    let model = 'gpt-4o-mini';
    
    // Process AI settings if available
    if (aiSettings && aiSettings.length > 0) {
      for (const setting of aiSettings) {
        if (setting.name === 'content_modifier_temperature' && setting.value) {
          try {
            const tempValue = parseFloat(JSON.parse(setting.value));
            if (!isNaN(tempValue) && tempValue >= 0 && tempValue <= 1) {
              temperature = tempValue;
            }
          } catch (e) {
            console.error(`[crewkit-modify-content] Error parsing temperature: ${e}`);
          }
        } else if (setting.name === 'content_generator_model' && setting.value) {
          try {
            model = JSON.parse(setting.value);
          } catch (e) {
            console.error(`[crewkit-modify-content] Error parsing model: ${e}`);
          }
        }
      }
    }
    
    // Call OpenAI API to modify the content
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: `You are an editor and content improvement specialist. 
Your task is to modify the provided content according to the user's instructions. 
Return only the modified content without explanations, comments or any other text.` 
          },
          { 
            role: 'user', 
            content: `Original content: \n\n${content}\n\nModification instructions: ${modification}\n\nReturn only the modified content.` 
          }
        ],
        temperature: temperature,
      }),
    });
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await openAIResponse.json();
    const modifiedContent = responseData.choices[0]?.message?.content || '';
    
    // Log the activity
    await supabaseAdmin.functions.invoke('pg-coach-logger', {
      body: {
        user_id: userId,
        action_type: 'content_modified',
        action_details: {
          modification_instruction: modification
        }
      }
    });
    
    // Return the modified content
    return new Response(
      JSON.stringify({ modifiedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[crewkit-modify-content] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
