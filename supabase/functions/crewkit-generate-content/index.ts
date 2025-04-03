
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

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

// Improved logging function with levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Set current log level
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

// Logging function with severity levels
const logEvent = async (level, message, data = {}) => {
  if (level >= CURRENT_LOG_LEVEL) {
    const prefix = level === LOG_LEVELS.ERROR ? "❌ ERROR" :
                  level === LOG_LEVELS.WARN ? "⚠️ WARNING" :
                  level === LOG_LEVELS.INFO ? "ℹ️ INFO" : "🔍 DEBUG";
    
    console.log(`[${prefix}][crewkit-generate-content] ${message}`, data);
  }
};

// Log debug information
const logDebug = (message, data = {}) => logEvent(LOG_LEVELS.DEBUG, message, data);
// Log information
const logInfo = (message, data = {}) => logEvent(LOG_LEVELS.INFO, message, data);
// Log warnings
const logWarn = (message, data = {}) => logEvent(LOG_LEVELS.WARN, message, data);
// Log errors
const logError = (message, data = {}) => logEvent(LOG_LEVELS.ERROR, message, data);

// Enhanced validation for business profile data
const validateBusinessProfile = (profile) => {
  if (!profile) {
    logWarn("Profile is null or undefined");
    return { isValid: false, details: { reason: "Profile is null or undefined" } };
  }
  
  // Log the entire profile for debugging
  logDebug("Validating business profile", { 
    profileDataKeys: Object.keys(profile)
  });
  
  // Required fields for meaningful business context
  const requiredFields = [
    { key: 'business_name', fallback: 'company_name', required: true },
    { key: 'company_description', required: false },
    { key: 'crew_size', required: false },
    { key: 'specialties', required: false, isArray: true }
  ];
  
  // Count the number of meaningful fields
  let meaningfulFieldCount = 0;
  const validationDetails = {};
  
  // Check each required field
  for (const field of requiredFields) {
    const fieldValue = profile[field.key];
    let fallbackValue = null;
    
    if (field.fallback && !fieldValue) {
      fallbackValue = profile[field.fallback];
    }
    
    const value = fieldValue || fallbackValue;
    const isValid = field.isArray ? (Array.isArray(value) && value.length > 0) : !!value;
    
    validationDetails[field.key] = {
      present: isValid,
      value: field.isArray ? (value ? `Array with ${value?.length || 0} items` : 'empty/missing') 
                         : (value || 'missing')
    };
    
    if (isValid) {
      meaningfulFieldCount++;
    } else if (field.required) {
      logWarn(`Required field ${field.key} is missing or invalid`, { value });
    }
  }
  
  // Additional check for any presence of workload field
  if (profile.workload) {
    meaningfulFieldCount++;
    validationDetails.workload = { present: true, value: profile.workload };
  } else {
    validationDetails.workload = { present: false, value: 'missing' };
  }
  
  // Additional check for website
  if (profile.website) {
    meaningfulFieldCount++;
    validationDetails.website = { present: true, value: profile.website };
  } else {
    validationDetails.website = { present: false, value: 'missing' };
  }
  
  // Additional check for business_address
  if (profile.business_address) {
    meaningfulFieldCount++;
    validationDetails.business_address = { present: true, value: profile.business_address };
  } else {
    validationDetails.business_address = { present: false, value: 'missing' };
  }
  
  const isValid = meaningfulFieldCount >= 2;
  
  logInfo(`Business profile validation result: ${isValid ? 'VALID' : 'INVALID'}`, { 
    meaningfulFieldCount,
    validationDetails,
    profileId: profile.id
  });
  
  return { 
    isValid, 
    details: validationDetails,
    meaningfulFieldCount
  };
};

serve(async (req: Request) => {
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
    logDebug("Fetching custom prompt data", { customPromptId: requestData.customPromptId });
    
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
      logError("Error fetching custom prompt", { 
        error: customPromptError, 
        promptId: requestData.customPromptId 
      });
      
      return errorResponse(404, "Failed to fetch custom prompt", 
        customPromptError.message || "The requested prompt could not be found");
    }

    if (!customPromptData) {
      return errorResponse(404, "Custom prompt not found", 
        `No prompt found with ID: ${requestData.customPromptId}`);
    }

    logInfo("Custom prompt fetched successfully", { 
      promptId: customPromptData.base_prompt_id,
      title: customPromptData.prompts?.title,
      hasCustomizations: (customPromptData.prompt_customizations?.length || 0) > 0,
      hasAdditionalContext: (customPromptData.prompt_additional_context?.length || 0) > 0
    });

    // 2. Get AI settings
    logDebug("Fetching AI settings");
    
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
      model: "gpt-4o-mini", // Updated to the latest model
    };

    if (aiSettings) {
      aiSettings.forEach(setting => {
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

    logDebug("AI settings", settings);

    // 3. Get user's business profile data - FIXED IMPLEMENTATION
    let businessProfile = null;
    let profileFetchStartTime = Date.now();
    let hasProfileData = false;
    
    if (userId) {
      logDebug("Fetching user business profile", { userId });
      
      // FIXED APPROACH: Fetch data from both tables separately
      try {
        // First, fetch basic profile data
        const { data: basicProfileData, error: basicProfileError } = await supabase
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
          .maybeSingle();

        if (basicProfileError) {
          logWarn("Error fetching basic profile data", { error: basicProfileError });
        } else {
          logDebug("Basic profile data fetched successfully", { 
            hasData: !!basicProfileData,
            profileKeys: basicProfileData ? Object.keys(basicProfileData) : []
          });
        }
        
        // Next, fetch compass user profile data
        const { data: compassProfileData, error: compassProfileError } = await supabase
          .from("compass_user_profiles")
          .select(`
            business_name,
            crew_size,
            specialties,
            workload
          `)
          .eq("id", userId)
          .maybeSingle();
          
        if (compassProfileError) {
          logWarn("Error fetching compass profile data", { error: compassProfileError });
        } else {
          logDebug("Compass profile data fetched successfully", { 
            hasData: !!compassProfileData,
            profileKeys: compassProfileData ? Object.keys(compassProfileData) : []
          });
        }
        
        const profileFetchTime = Date.now() - profileFetchStartTime;
        
        // Now combine the data from both sources into a complete business profile
        if (basicProfileData || compassProfileData) {
          businessProfile = {
            id: userId,
            full_name: basicProfileData?.full_name || '',
            // Prioritize compass_user_profiles business name if available
            business_name: compassProfileData?.business_name || basicProfileData?.company_name || '',
            company_name: basicProfileData?.company_name || '',
            company_description: basicProfileData?.company_description || '',
            business_address: basicProfileData?.business_address || '',
            website: basicProfileData?.website || '',
            crew_size: compassProfileData?.crew_size || '',
            specialties: compassProfileData?.specialties || [],
            workload: compassProfileData?.workload || ''
          };
          
          logInfo("Successfully merged profile data", {
            fetchTimeMs: profileFetchTime,
            hasBasicProfile: !!basicProfileData,
            hasCompassProfile: !!compassProfileData,
            mergedProfileKeys: Object.keys(businessProfile)
          });
          
          // Validate if we have enough meaningful data using the enhanced validator
          const validation = validateBusinessProfile(businessProfile);
          hasProfileData = validation.isValid;
          
          logInfo(`Profile validation complete: ${hasProfileData ? 'VALID' : 'INVALID'}`, {
            validationDetails: validation.details,
            meaningfulFieldCount: validation.meaningfulFieldCount
          });
        } else {
          logWarn("No profile data found for user", { 
            userId,
            fetchTimeMs: profileFetchTime
          });
        }
      } catch (profileError) {
        logError("Unexpected error fetching profile data", {
          error: profileError.message,
          stack: profileError.stack
        });
      }
    } else {
      logWarn("No user ID available to fetch business profile", {
        authError: authError ? authError.message : null
      });
    }

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

    // Store the full assembled prompt for logging
    const fullAssembledPrompt = basePrompt;

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
      logInfo("Making request to OpenAI API", { 
        model: settings.model, 
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      });
      
      const requestBody = JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: settings.systemPrompt },
          { role: "user", content: basePrompt }
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });
      
      logDebug("OpenAI request payload", { 
        model: settings.model,
        system_prompt_length: settings.systemPrompt.length,
        user_prompt_length: basePrompt.length,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      });
      
      const openaiStartTime = Date.now();
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: requestBody
      });
      const openaiRequestTime = Date.now() - openaiStartTime;
      
      logInfo("OpenAI API response received", { 
        status: aiResponse.status, 
        statusText: aiResponse.statusText,
        requestTime: openaiRequestTime
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        logError("OpenAI API error", { 
          status: aiResponse.status, 
          statusText: aiResponse.statusText,
          errorBody: errorText
        });
        
        return errorResponse(502, `Error from AI service: ${aiResponse.status} ${aiResponse.statusText}`, errorText);
      }

      const aiData = await aiResponse.json();
      logDebug("AI response data", { 
        choices: aiData.choices?.length || 0,
        id: aiData.id,
        model: aiData.model,
        usage: aiData.usage
      });

      if (!aiData.choices || !aiData.choices.length) {
        logError("Invalid response format from OpenAI", { aiData });
        return errorResponse(502, "Invalid response from AI service", "The AI service did not return any choices");
      }

      const generatedContent = aiData.choices[0].message.content;
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
});

// Format error response
const errorResponse = (status, message, details = null) => {
  const body = { 
    error: message,
    details: details,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  };
  
  logError(message, { status, details, body });
  
  return new Response(
    JSON.stringify(body),
    { status, headers: corsHeaders }
  );
};
