
import { supabaseClient } from "./supabase-client.ts";
import { callOpenAI } from "./ai-service.ts";
import { logDebug, logError } from "./logger.ts";

export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Improved CORS handling with better browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
    };
    
    // Basic CORS handling
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    // Ensure request is POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // Extract the request body with validation
    let body;
    try {
      body = await req.json();
      logDebug("Request received:", body);
      
      // Validate required fields
      if (!body || !body.customPromptId) {
        throw new Error('Missing required fields in request body: customPromptId');
      }
    } catch (parseError) {
      logError("Error parsing request body:", parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body', 
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get the authorization token from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Initialize Supabase client with auth token
    const supabase = supabaseClient(authHeader.replace('Bearer ', ''));

    // Implement content generation with timeout management
    const executionStart = Date.now();
    
    // 1. Get custom prompt details
    const { data: customPrompt, error: customPromptError } = await supabase
      .from('custom_prompts')
      .select(`
        id,
        created_by,
        prompts:base_prompt_id(id, title, prompt)
      `)
      .eq('id', body.customPromptId)
      .single();
    
    if (customPromptError || !customPrompt) {
      logError("Error fetching custom prompt:", customPromptError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch prompt data',
        details: customPromptError?.message || 'Custom prompt not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 2. Get AI settings
    const { data: aiSettings, error: aiSettingsError } = await supabase
      .from('ai_settings')
      .select('name, value')
      .in('name', ['content_generator_model', 'content_generator_temperature', 'content_generator_system_prompt']);
    
    if (aiSettingsError) {
      logError("Error fetching AI settings:", aiSettingsError);
    }
    
    // Default settings
    const settings = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      systemPrompt: "You are an expert content writer for painting professionals. Create high-quality, detailed, and practical content."
    };
    
    // Parse settings if available
    if (aiSettings) {
      aiSettings.forEach(setting => {
        try {
          const value = JSON.parse(setting.value);
          switch (setting.name) {
            case 'content_generator_model':
              settings.model = value;
              break;
            case 'content_generator_temperature':
              settings.temperature = parseFloat(value);
              break;
            case 'content_generator_system_prompt':
              settings.systemPrompt = value;
              break;
          }
        } catch (e) {
          logError(`Error parsing setting ${setting.name}:`, e);
        }
      });
    }

    // 3. Get prompt customizations (tweaks)
    const { data: customizations, error: customizationsError } = await supabase
      .from('prompt_customizations')
      .select(`
        id,
        tweaks:parameter_tweak_id(
          id,
          name,
          sub_prompt,
          parameter_id,
          parameters:prompt_parameters(id, name)
        )
      `)
      .eq('custom_prompt_id', body.customPromptId);
    
    if (customizationsError) {
      logError("Error fetching customizations:", customizationsError);
    }

    // 4. Get additional context
    const { data: additionalContext, error: contextError } = await supabase
      .from('prompt_additional_context')
      .select('context_text')
      .eq('custom_prompt_id', body.customPromptId)
      .maybeSingle();
    
    if (contextError) {
      logError("Error fetching additional context:", contextError);
    }

    // 5. Build the complete prompt
    const basePrompt = customPrompt.prompts?.prompt || '';
    let fullPrompt = basePrompt + "\n\n";
    
    // Add selected tweaks
    if (customizations && customizations.length > 0) {
      fullPrompt += "CUSTOMIZATIONS:\n";
      customizations.forEach(customization => {
        if (customization.tweaks) {
          const parameterName = customization.tweaks.parameters?.name || 'Parameter';
          fullPrompt += `${parameterName}: ${customization.tweaks.name}\n`;
          fullPrompt += `${customization.tweaks.sub_prompt}\n\n`;
        }
      });
    }
    
    // Add additional context if provided
    if (additionalContext?.context_text) {
      fullPrompt += "ADDITIONAL CONTEXT:\n";
      fullPrompt += additionalContext.context_text + "\n\n";
    }

    logDebug("Full prompt assembled:", {
      basePromptLength: basePrompt.length,
      customizationsCount: customizations?.length || 0,
      hasAdditionalContext: !!additionalContext?.context_text,
      totalLength: fullPrompt.length
    });

    // 6. Call OpenAI API
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'The server is not properly configured to generate content'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Call OpenAI with the assembled prompt
    try {
      const { generatedContent, aiData } = await callOpenAI(apiKey, {
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: 2000,
        systemPrompt: settings.systemPrompt
      }, fullPrompt);

      // 7. Save the generated content
      // MODIFIED: Ensure we're using the correct schema fields and including created_by
      const { data: generationData, error: generationError } = await supabase
        .from('prompt_generations')
        .insert({
          custom_prompt_id: body.customPromptId,
          generated_content: generatedContent,
          created_by: customPrompt.created_by  // Use the custom_prompt's created_by value
        })
        .select('id')
        .single();

      if (generationError) {
        logError("Error saving generation:", generationError);
        return new Response(JSON.stringify({ 
          error: 'Failed to save generated content',
          details: generationError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // 8. Return the generated content and metadata
      return new Response(JSON.stringify({
        generatedContent,
        generationId: generationData.id,
        metadata: {
          model: aiData.model,
          processingTime: `${(Date.now() - executionStart) / 1000}s`,
          tokensUsed: aiData.usage?.total_tokens || 0
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        status: 200,
      });
    } catch (aiError) {
      logError("OpenAI API error:", aiError);
      return new Response(JSON.stringify({ 
        error: 'AI generation failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    logError('Error handling request:', error);
    
    // Structured error response
    const errorResponse = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
}
