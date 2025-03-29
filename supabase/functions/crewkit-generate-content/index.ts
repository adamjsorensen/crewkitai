
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
    const { customPromptId } = await req.json();
    
    if (!customPromptId) {
      return new Response(
        JSON.stringify({ error: 'customPromptId is required' }),
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
    
    console.log(`[crewkit-generate-content] Processing request for customPromptId: ${customPromptId}, userId: ${userId}`);

    // 1. Fetch custom prompt and all related data to assemble the final prompt
    // Get the custom prompt
    const { data: customPrompt, error: customPromptError } = await supabaseAdmin
      .from('custom_prompts')
      .select('*, base_prompt:base_prompt_id(*)')
      .eq('id', customPromptId)
      .single();
    
    if (customPromptError || !customPrompt) {
      throw new Error(`Error fetching custom prompt: ${customPromptError?.message || 'Not found'}`);
    }
    
    // Get the customizations (parameter tweaks)
    const { data: customizations, error: customizationsError } = await supabaseAdmin
      .from('prompt_customizations')
      .select('*, parameter_tweak:parameter_tweak_id(*)')
      .eq('custom_prompt_id', customPromptId);
    
    if (customizationsError) {
      throw new Error(`Error fetching customizations: ${customizationsError.message}`);
    }
    
    // Get additional context if any
    const { data: additionalContext, error: additionalContextError } = await supabaseAdmin
      .from('prompt_additional_context')
      .select('context_text')
      .eq('custom_prompt_id', customPromptId)
      .maybeSingle();
    
    if (additionalContextError) {
      console.error(`[crewkit-generate-content] Error fetching additional context: ${additionalContextError.message}`);
    }
    
    // Get user's business profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error(`[crewkit-generate-content] Error fetching user profile: ${profileError.message}`);
    }
    
    // Get AI settings
    const { data: aiSettings, error: aiSettingsError } = await supabaseAdmin
      .from('ai_settings')
      .select('name, value')
      .in('name', ['content_generator_system_prompt', 'content_generator_temperature', 'content_generator_max_tokens', 'content_generator_model']);
    
    if (aiSettingsError) {
      console.error(`[crewkit-generate-content] Error fetching AI settings: ${aiSettingsError.message}`);
    }
    
    // Default AI settings if none found in database
    let systemPrompt = 'You are an expert content writer for painting professionals. Create high-quality, professional content based on the provided prompt and specifications.';
    let temperature = 0.7;
    let maxTokens = 2000;
    let model = 'gpt-4o-mini';
    
    // Process AI settings if available
    if (aiSettings && aiSettings.length > 0) {
      for (const setting of aiSettings) {
        if (setting.name === 'content_generator_system_prompt' && setting.value) {
          try {
            systemPrompt = JSON.parse(setting.value);
          } catch (e) {
            console.error(`[crewkit-generate-content] Error parsing system prompt: ${e}`);
          }
        } else if (setting.name === 'content_generator_temperature' && setting.value) {
          try {
            const tempValue = parseFloat(JSON.parse(setting.value));
            if (!isNaN(tempValue) && tempValue >= 0 && tempValue <= 1) {
              temperature = tempValue;
            }
          } catch (e) {
            console.error(`[crewkit-generate-content] Error parsing temperature: ${e}`);
          }
        } else if (setting.name === 'content_generator_max_tokens' && setting.value) {
          try {
            const tokenValue = parseInt(JSON.parse(setting.value));
            if (!isNaN(tokenValue) && tokenValue > 0) {
              maxTokens = tokenValue;
            }
          } catch (e) {
            console.error(`[crewkit-generate-content] Error parsing max tokens: ${e}`);
          }
        } else if (setting.name === 'content_generator_model' && setting.value) {
          try {
            model = JSON.parse(setting.value);
          } catch (e) {
            console.error(`[crewkit-generate-content] Error parsing model: ${e}`);
          }
        }
      }
    }
    
    // 2. Assemble the final prompt
    // Start with the base prompt
    let finalPrompt = customPrompt.base_prompt?.prompt || '';
    
    // Add parameter tweaks (customizations)
    if (customizations && customizations.length > 0) {
      // Sort by parameter.order if available
      customizations.sort((a, b) => {
        return (a.parameter_tweak?.order || 0) - (b.parameter_tweak?.order || 0);
      });
      
      for (const customization of customizations) {
        if (customization.parameter_tweak?.sub_prompt) {
          finalPrompt += '\n\n' + customization.parameter_tweak.sub_prompt;
        }
      }
    }
    
    // Add additional context if available
    if (additionalContext && additionalContext.context_text) {
      finalPrompt += '\n\nAdditional context: ' + additionalContext.context_text;
    }
    
    // Add business profile information if available
    if (profile) {
      let businessContext = '\n\nBusiness Information:';
      
      if (profile.company_name) {
        businessContext += `\nCompany Name: ${profile.company_name}`;
      }
      
      if (profile.company_description) {
        businessContext += `\nCompany Description: ${profile.company_description}`;
      }
      
      if (profile.website) {
        businessContext += `\nWebsite: ${profile.website}`;
      }
      
      finalPrompt += businessContext;
    }
    
    console.log(`[crewkit-generate-content] Assembled prompt (truncated): ${finalPrompt.substring(0, 100)}...`);
    
    // 3. Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalPrompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await openAIResponse.json();
    const generatedContent = responseData.choices[0]?.message?.content || '';
    
    // 4. Save the generated content
    const { data: generation, error: generationError } = await supabaseAdmin
      .from('prompt_generations')
      .insert({
        custom_prompt_id: customPromptId,
        generated_content: generatedContent,
        created_by: userId
      })
      .select('id')
      .single();
    
    if (generationError) {
      throw new Error(`Error saving generated content: ${generationError.message}`);
    }
    
    // 5. Log the activity
    await supabaseAdmin.functions.invoke('pg-coach-logger', {
      body: {
        user_id: userId,
        action_type: 'content_generated',
        action_details: {
          custom_prompt_id: customPromptId,
          generation_id: generation.id
        }
      }
    });
    
    // 6. Return the response
    return new Response(
      JSON.stringify({
        generatedContent,
        generationId: generation.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[crewkit-generate-content] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
