
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { logError, logInfo, logWarn, logDebug } from "./logger.ts";
import { validateBusinessProfile } from "./validators.ts";
import { callOpenAI } from "./ai-service.ts";
import { errorResponse } from "./response-utils.ts";

interface RequestData {
  customPromptId: string;
}

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handleRequest(req: Request) {
  // Log the request
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  const requestUrl = req.url;
  
  logInfo(`Request received [${requestId}]`, { 
    method: req.method,
    url: requestUrl
  });
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      logDebug("CORS preflight request");
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // If auth header is present, verify it
      const jwt = authHeader.substring(7);
      
      // Create Supabase client with the service role key
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      if (!supabaseUrl || !supabaseKey) {
        return errorResponse(500, "Server configuration error", "Supabase URL or key not configured");
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      try {
        // Verify the JWT token and get the user
        const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
        
        if (userError) {
          return errorResponse(401, "Authentication error", userError.message);
        }
        
        if (userData?.user) {
          userId = userData.user.id;
          logInfo("Authenticated user", { userId });
        } else {
          return errorResponse(401, "Invalid user token", "No user found from provided token");
        }
      } catch (authErr) {
        return errorResponse(401, "JWT verification error", authErr.message);
      }
    } else {
      return errorResponse(401, "Authentication required", "No authorization header provided");
    }
    
    // Get the request data
    let requestData: RequestData;
    try {
      requestData = await req.json();
    } catch (bodyError) {
      return errorResponse(400, "Error reading request body", bodyError.message);
    }

    // Validate the request
    if (!requestData.customPromptId) {
      return errorResponse(400, "Missing required field: customPromptId", 
        "This field is required to identify which prompt to use");
    }

    logInfo("Request data valid", { customPromptId: requestData.customPromptId });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse(500, "Server configuration error", "Supabase URL or key not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the custom prompt with all related data in one query
    const { data: customPromptData, error: customPromptError } = await supabase
      .from("custom_prompts")
      .select(`
        id,
        base_prompt_id,
        created_by,
        prompts:base_prompt_id (
          id, 
          title,
          description,
          prompt
        ),
        prompt_customizations (
          parameter_tweak_id,
          parameter_tweaks:parameter_tweak_id (
            id,
            name,
            sub_prompt,
            parameter_id
          )
        ),
        prompt_additional_context (
          id,
          context_text
        )
      `)
      .eq("id", requestData.customPromptId)
      .single();

    if (customPromptError) {
      return errorResponse(404, "Failed to fetch custom prompt", customPromptError.message);
    }

    if (!customPromptData || !customPromptData.prompts) {
      return errorResponse(404, "Custom prompt not found or is invalid", 
        "The requested prompt could not be found or has invalid configuration");
    }

    // Get AI settings
    const { data: aiSettings, error: aiSettingsError } = await supabase
      .from("ai_settings")
      .select("name, value")
      .in("name", [
        "content_generator_system_prompt",
        "content_generator_temperature",
        "content_generator_max_tokens",
        "content_generator_model"
      ]);

    if (aiSettingsError) {
      logWarn("Error fetching AI settings, using defaults", { error: aiSettingsError });
    }

    // Parse AI settings with defaults
    const settings = {
      systemPrompt: "You are an expert content writer for painting professionals. Create high-quality content.",
      temperature: 0.7,
      maxTokens: 2000,
      model: "gpt-4o-mini", // Using the latest model
    };

    if (aiSettings) {
      aiSettings.forEach((setting: any) => {
        try {
          const value = JSON.parse(setting.value);
          switch (setting.name) {
            case "content_generator_system_prompt":
              settings.systemPrompt = value;
              break;
            case "content_generator_temperature":
              settings.temperature = parseFloat(value);
              break;
            case "content_generator_max_tokens":
              settings.maxTokens = parseInt(value);
              break;
            case "content_generator_model":
              settings.model = value;
              break;
          }
        } catch (e) {
          logWarn(`Error parsing setting ${setting.name}:`, e);
        }
      });
    }

    // Get user's business profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id, 
        full_name, 
        company_name, 
        company_description,
        business_address,
        website
      `)
      .eq("id", userId)
      .single();

    if (profileError) {
      logWarn("Error fetching basic profile", { error: profileError });
    }

    // Also get the compass user profile data which has additional business details
    const { data: compassProfile, error: compassProfileError } = await supabase
      .from("compass_user_profiles")
      .select(`
        id,
        business_name,
        crew_size,
        specialties,
        workload
      `)
      .eq("id", userId)
      .maybeSingle();

    if (compassProfileError) {
      logWarn("Error fetching compass profile", { error: compassProfileError });
    }

    // Combine the profiles into a comprehensive business profile
    const businessProfile = {
      id: userId,
      full_name: profile?.full_name || '',
      business_name: compassProfile?.business_name || profile?.company_name || '',
      company_name: profile?.company_name || '',
      company_description: profile?.company_description || '',
      business_address: profile?.business_address || '',
      website: profile?.website || '',
      crew_size: compassProfile?.crew_size || '',
      specialties: compassProfile?.specialties || [],
      workload: compassProfile?.workload || ''
    };

    // Validate if we have enough meaningful business profile data
    const validation = validateBusinessProfile(businessProfile);
    const hasProfileData = validation.isValid;

    // Assemble the prompt
    let basePrompt = customPromptData.prompts?.prompt || "";
    
    // Add sub-prompts from tweaks
    if (customPromptData.prompt_customizations && customPromptData.prompt_customizations.length > 0) {
      customPromptData.prompt_customizations.forEach(customization => {
        if (customization.parameter_tweaks?.sub_prompt) {
          basePrompt += "\n\n" + customization.parameter_tweaks.sub_prompt;
        }
      });
    }

    // Add additional context if provided
    if (customPromptData.prompt_additional_context && customPromptData.prompt_additional_context.length > 0) {
      basePrompt += "\n\n### Additional Context from User:\n" + 
        customPromptData.prompt_additional_context[0].context_text;
    }

    // Add enhanced business context if available
    if (hasProfileData) {
      basePrompt += "\n\n### Business Context:\n";

      if (businessProfile.business_name) {
        basePrompt += `Business Name: ${businessProfile.business_name}\n`;
      }
      
      if (businessProfile.company_description) {
        basePrompt += `Business Description: ${businessProfile.company_description}\n`;
      }
      
      if (businessProfile.business_address) {
        basePrompt += `Business Address: ${businessProfile.business_address}\n`;
      }
      
      if (businessProfile.website) {
        basePrompt += `Website: ${businessProfile.website}\n`;
      }
      
      if (businessProfile.crew_size) {
        basePrompt += `Crew Size: ${businessProfile.crew_size}\n`;
      }
      
      if (businessProfile.specialties && businessProfile.specialties.length > 0) {
        basePrompt += `Specialties: ${businessProfile.specialties.join(', ')}\n`;
      }
      
      if (businessProfile.workload) {
        basePrompt += `Current Workload: ${businessProfile.workload}\n`;
      }
    } else {
      basePrompt += "\n\n### Business Context:\nNo business profile information available. Please create generic content.";
    }

    // Check if OpenAI API key is configured
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return errorResponse(500, "OpenAI API key not configured", 
        "Please ask your administrator to configure the OPENAI_API_KEY in Supabase Edge Function Secrets");
    }

    // Make a request to the OpenAI API
    try {
      const { generatedContent, openaiRequestTime, aiData } = await callOpenAI(apiKey, settings, basePrompt);
      
      // Save the generation to the database
      const { data: generationData, error: generationError } = await supabase
        .from("prompt_generations")
        .insert({
          custom_prompt_id: requestData.customPromptId,
          generated_content: generatedContent,
          created_by: userId
        })
        .select("id")
        .single();

      if (generationError) {
        logError("Error saving generation", { error: generationError });
        // Continue anyway to return the content to the user
      }

      // Log the activity
      try {
        await supabase.rpc('log_user_activity', {
          p_action_type: 'content_generation',
          p_action_details: {
            prompt_id: customPromptData.prompts?.id,
            prompt_title: customPromptData.prompts?.title,
            generation_id: generationData?.id,
            business_profile_used: hasProfileData
          }
        });
      } catch (logError) {
        logWarn("Error logging activity", { error: logError });
      }

      // Return the generated content
      const responseTime = Date.now() - requestStartTime;
      logInfo(`Request completed successfully [${requestId}]`, { responseTime });
      
      return new Response(
        JSON.stringify({ 
          generatedContent,
          generationId: generationData?.id || null,
          businessContextIncluded: hasProfileData
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      return errorResponse(500, "Error communicating with AI service", error.message);
    }
  } catch (error) {
    return errorResponse(500, "Internal server error", error.message);
  }
}
