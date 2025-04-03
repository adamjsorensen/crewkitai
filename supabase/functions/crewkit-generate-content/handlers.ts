
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { logError, logInfo, logWarn, logDebug } from "./logger.ts";
import { validateBusinessProfile } from "./validators.ts";
import { fetchCustomPromptData, fetchAISettings, fetchBusinessProfile } from "./data-fetchers.ts";
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

    // Log headers for debugging (masking sensitive data)
    const headers = {};
    req.headers.forEach((value, key) => {
      headers[key] = key.toLowerCase().includes('auth') || 
                    key.toLowerCase().includes('key') || 
                    key.toLowerCase().includes('token') 
                    ? '[REDACTED]' : value;
    });
    
    logDebug("Request headers", headers);
    
    // Get the authorization header (optional for testing with verify_jwt=false)
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    let authError = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // If auth header is present, try to verify it
      const jwt = authHeader.substring(7);
      logDebug("JWT token present, length: " + jwt.length);
      
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
          authError = userError;
          logWarn("Authentication error but continuing due to --no-verify-jwt", { error: userError });
        }
        
        if (userData?.user) {
          userId = userData.user.id;
          logInfo("Authenticated user", { userId });
        } else {
          logWarn("No user found from JWT", { 
            hasUserData: !!userData,
            jwt: jwt.substring(0, 10) + '...' 
          });
        }
      } catch (authErr) {
        authError = authErr;
        logWarn("JWT verification error but continuing", { 
          error: authErr.message,
          stack: authErr.stack
        });
      }
    } else {
      logWarn("No authorization header, proceeding in test mode");
    }
    
    // Get the request data
    let requestData: RequestData;
    try {
      const bodyText = await req.text();
      logDebug("Request body", { body: bodyText });
      
      try {
        requestData = JSON.parse(bodyText);
      } catch (parseError) {
        return errorResponse(400, "Invalid JSON in request body", 
          "Request body must be valid JSON: " + parseError.message);
      }
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

    // 1. Fetch the custom prompt, including the base prompt and tweaks
    const { customPromptData, customPromptError } = await fetchCustomPromptData(supabase, requestData.customPromptId);
    
    if (customPromptError) {
      return errorResponse(404, "Failed to fetch custom prompt", 
        customPromptError.message || "The requested prompt could not be found");
    }

    // 2. Get AI settings
    const { settings, aiSettingsError } = await fetchAISettings(supabase);
    if (aiSettingsError) {
      logWarn("Error fetching AI settings, using defaults", { error: aiSettingsError });
    }

    // 3. Get user's business profile data 
    const { businessProfile, hasProfileData } = await fetchBusinessProfile(supabase, userId);

    // 4. Assemble the prompt
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
    if (hasProfileData && businessProfile) {
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
      
      logInfo("Added business context to prompt", {
        businessName: businessProfile.business_name || businessProfile.company_name,
        contextLength: basePrompt.length
      });
    } else {
      basePrompt += "\n\n### Business Context:\nNo business profile information available. Please create generic content.";
      logWarn("No valid business profile data available", {
        userId,
        hasProfileObject: !!businessProfile,
        validationPassed: hasProfileData,
        businessProfileKeys: businessProfile ? Object.keys(businessProfile) : []
      });
    }

    // Log the assembled prompt (truncated for logs)
    const truncatedPrompt = basePrompt.length > 200 
      ? basePrompt.substring(0, 200) + "..." 
      : basePrompt;
    
    logDebug("Assembled prompt", { 
      truncatedPrompt,
      fullLength: basePrompt.length,
      hasBusinessContext: hasProfileData
    });

    // 5. Check if OpenAI API key is configured
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      logError("OpenAI API key not configured");
      return errorResponse(500, "OpenAI API key not configured", 
        "Please ask your administrator to configure the OPENAI_API_KEY in Supabase Edge Function Secrets");
    }

    // 6. Make a request to the OpenAI API
    try {
      const { generatedContent, openaiRequestTime, aiData } = await callOpenAI(apiKey, settings, basePrompt);
      
      const contentPreview = generatedContent.length > 200 
        ? generatedContent.substring(0, 200) + "..." 
        : generatedContent;
      
      logInfo("Content generated successfully", { 
        contentLength: generatedContent.length,
        contentPreview 
      });

      // 7. Save the generation to the database
      logDebug("Saving generation to database", { 
        customPromptId: requestData.customPromptId,
        contentLength: generatedContent.length,
        userId: userId || "Anonymous"
      });
      
      const { data: generationData, error: generationError } = await supabase
        .from("prompt_generations")
        .insert({
          custom_prompt_id: requestData.customPromptId,
          generated_content: generatedContent,
          created_by: userId || null // Allow anonymous generations for testing
        })
        .select("id")
        .single();

      if (generationError) {
        logError("Error saving generation", { error: generationError });
        // Continue anyway to return the content to the user
      } else {
        logInfo("Generation saved to database", { generationId: generationData?.id });
      }

      // 8. Log the activity if user is authenticated
      if (userId) {
        logDebug("Logging user activity");
        
        try {
          // Log to dedicated pg-coach-logger function
          const loggerResponse = await fetch(`${supabaseUrl}/functions/v1/pg-coach-logger`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              user_id: userId,
              action_type: "content_generation_prompt",
              action_details: {
                prompt_id: customPromptData.prompts?.id,
                prompt_title: customPromptData.prompts?.title,
                generation_id: generationData?.id,
                business_profile_used: hasProfileData,
                business_context_included: hasProfileData,
                profile_validation_result: hasProfileData,
                business_profile_keys: businessProfile ? Object.keys(businessProfile).filter(k => !!businessProfile[k]) : []
              }
            })
          });
          
          if (!loggerResponse.ok) {
            const errorText = await loggerResponse.text();
            logWarn("Error calling activity logger function", { 
              status: loggerResponse.status,
              error: errorText
            });
          } else {
            logDebug("Activity logged successfully");
          }
        } catch (logError) {
          logWarn("Error calling activity logger", { error: logError });
        }
      }

      // 9. Return the generated content
      const responseTime = Date.now() - requestStartTime;
      logInfo(`Request completed successfully [${requestId}]`, { 
        responseTime,
        generationId: generationData?.id
      });
      
      return new Response(
        JSON.stringify({ 
          generatedContent: generatedContent,
          generationId: generationData?.id || null,
          businessContextIncluded: hasProfileData
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      logError("Error calling OpenAI API", { error: error.message, stack: error.stack });
      return errorResponse(500, "Error communicating with AI service", 
        error.message || "An unexpected error occurred while trying to generate content");
    }
  } catch (error) {
    logError("Unhandled error", { error: error.message, stack: error.stack });
    return errorResponse(500, "Internal server error", 
      error.message || "An unexpected error occurred in the edge function");
  }
}
