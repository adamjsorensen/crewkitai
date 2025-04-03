
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

// Helper function to validate business profile
const validateBusinessProfile = (profile) => {
  // Track what fields were found and missing
  const fieldsStatus = {
    found: [],
    missing: []
  };
  
  // Check core fields from profiles table
  ['id', 'full_name', 'company_name', 'company_description', 'business_address', 'website'].forEach(field => {
    if (profile && profile[field] !== undefined && profile[field] !== null && profile[field] !== '') {
      fieldsStatus.found.push(field);
    } else {
      fieldsStatus.missing.push(field);
    }
  });
  
  // Check compass_user_profiles related fields
  if (profile && profile.compass_user_profiles) {
    ['business_name', 'crew_size', 'specialties', 'workload'].forEach(field => {
      if (profile.compass_user_profiles[field] !== undefined && profile.compass_user_profiles[field] !== null) {
        if (field === 'specialties' && Array.isArray(profile.compass_user_profiles[field]) && profile.compass_user_profiles[field].length === 0) {
          fieldsStatus.missing.push(`compass_user_profiles.${field}`);
        } else {
          fieldsStatus.found.push(`compass_user_profiles.${field}`);
        }
      } else {
        fieldsStatus.missing.push(`compass_user_profiles.${field}`);
      }
    });
  } else {
    fieldsStatus.missing.push('compass_user_profiles');
  }
  
  // Calculate how complete the profile is
  const totalFields = fieldsStatus.found.length + fieldsStatus.missing.length;
  const completeness = totalFields > 0 ? Math.round((fieldsStatus.found.length / totalFields) * 100) : 0;
  
  return {
    isValid: fieldsStatus.found.length > 0,
    completeness,
    fieldsStatus
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
    let authData = null;
    
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
        const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
        authData = { userData, authError };
        
        logDebug("Auth verification results", { 
          hasUserData: !!userData, 
          hasUser: !!(userData?.user),
          hasError: !!authError,
          errorMessage: authError?.message
        });
        
        if (authError) {
          logWarn("Authentication error but continuing due to --no-verify-jwt", { error: authError });
        }
        
        if (userData?.user) {
          userId = userData.user.id;
          logInfo("Authenticated user", { userId });
        }
      } catch (authErr) {
        logWarn("JWT verification error but continuing", { error: authErr.message });
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

    // 3. Get user's business profile for context
    let businessProfile = null;
    let profileValidationResults = null;
    let rawProfileData = null;
    
    if (userId) {
      logDebug("Fetching user business profile", { userId });
      
      // Log detailed profile retrieval attempt
      const profileStartTime = Date.now();
      
      // Updated query to fetch data from both profiles and compass_user_profiles tables
      const profileQueryResult = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          company_name, 
          company_description,
          business_address,
          website,
          compass_user_profiles:id(
            business_name,
            crew_size,
            specialties,
            workload
          )
        `)
        .eq("id", userId)
        .maybeSingle();

      const profileQueryTime = Date.now() - profileStartTime;
      
      // Log the raw query results for debugging
      logDebug("Raw profile query results", {
        queryTime: profileQueryTime + "ms",
        data: profileQueryResult.data,
        error: profileQueryResult.error,
        status: profileQueryResult.status,
        statusText: profileQueryResult.statusText
      });
      
      // Log detailed field analysis if data exists
      if (profileQueryResult.data) {
        const fieldAnalysis = {};
        for (const [key, value] of Object.entries(profileQueryResult.data)) {
          if (key === 'compass_user_profiles') {
            fieldAnalysis[key] = {
              type: value === null ? 'null' : typeof value,
              isEmpty: value === null,
              hasProperties: value !== null && Object.keys(value).length > 0,
              propertyCount: value !== null ? Object.keys(value).length : 0
            };
            
            if (value !== null) {
              const subFieldAnalysis = {};
              for (const [subKey, subValue] of Object.entries(value)) {
                if (subKey === 'specialties') {
                  subFieldAnalysis[subKey] = {
                    type: subValue === null ? 'null' : typeof subValue,
                    isArray: Array.isArray(subValue),
                    length: Array.isArray(subValue) ? subValue.length : 'not an array',
                    isEmpty: subValue === null || (Array.isArray(subValue) && subValue.length === 0),
                    value: subValue
                  };
                } else {
                  subFieldAnalysis[subKey] = {
                    type: subValue === null ? 'null' : typeof subValue,
                    isEmpty: subValue === null || subValue === '',
                    value: subValue
                  };
                }
              }
              fieldAnalysis['compass_user_profiles_fields'] = subFieldAnalysis;
            }
          } else {
            fieldAnalysis[key] = {
              type: value === null ? 'null' : typeof value,
              isEmpty: value === null || value === '',
              value: value
            };
          }
        }
        
        logDebug("Profile field analysis", fieldAnalysis);
      }
      
      const { data: mergedProfileData, error: profileError } = profileQueryResult;
      rawProfileData = mergedProfileData; // Store the raw data for logging
      
      if (profileError) {
        logWarn("Error fetching user profile", { 
          error: profileError,
          errorCode: profileError.code,
          errorDetails: profileError.details,
          errorHint: profileError.hint,
          errorMessage: profileError.message
        });
      } else if (mergedProfileData) {
        // Validate the retrieved profile data
        profileValidationResults = validateBusinessProfile(mergedProfileData);
        logDebug("Business profile validation results", profileValidationResults);
        
        // Combine the data from both tables for a complete business profile
        businessProfile = {
          id: mergedProfileData.id,
          full_name: mergedProfileData.full_name,
          // Prioritize compass_user_profiles business name if available
          business_name: mergedProfileData.compass_user_profiles?.business_name || mergedProfileData.company_name,
          company_description: mergedProfileData.company_description,
          business_address: mergedProfileData.business_address,
          website: mergedProfileData.website,
          crew_size: mergedProfileData.compass_user_profiles?.crew_size,
          specialties: mergedProfileData.compass_user_profiles?.specialties,
          workload: mergedProfileData.compass_user_profiles?.workload
        };
        
        logDebug("User business profile created", { 
          businessProfile,
          profileCompleteness: profileValidationResults.completeness + "%",
          fieldsFound: profileValidationResults.fieldsStatus.found,
          fieldsMissing: profileValidationResults.fieldsStatus.missing
        });
      } else {
        logInfo("No user profile found", { userId });
      }
    } else {
      logDebug("No user ID available, skipping profile fetch", { authData });
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
    const businessContextStartTime = Date.now();
    
    // Track which fields were included in business context
    const includedFields = [];
    
    if (businessProfile && profileValidationResults && profileValidationResults.isValid) {
      basePrompt += "\n\n### Business Context:\n";
      
      if (businessProfile.business_name) {
        basePrompt += `Business Name: ${businessProfile.business_name}\n`;
        includedFields.push('business_name');
      }
      
      if (businessProfile.company_description) {
        basePrompt += `Business Description: ${businessProfile.company_description}\n`;
        includedFields.push('company_description');
      }
      
      if (businessProfile.business_address) {
        basePrompt += `Business Address: ${businessProfile.business_address}\n`;
        includedFields.push('business_address');
      }
      
      if (businessProfile.website) {
        basePrompt += `Website: ${businessProfile.website}\n`;
        includedFields.push('website');
      }
      
      if (businessProfile.crew_size) {
        basePrompt += `Crew Size: ${businessProfile.crew_size}\n`;
        includedFields.push('crew_size');
      }
      
      if (businessProfile.specialties && Array.isArray(businessProfile.specialties) && businessProfile.specialties.length > 0) {
        basePrompt += `Specialties: ${businessProfile.specialties.join(', ')}\n`;
        includedFields.push('specialties');
      }
      
      if (businessProfile.workload) {
        basePrompt += `Current Workload: ${businessProfile.workload}\n`;
        includedFields.push('workload');
      }
      
      logDebug("Added business context to prompt", { 
        includedFields,
        profileCompleteness: profileValidationResults.completeness + "%"
      });
    } else {
      basePrompt += "\n\n### Business Context:\n";
      
      if (userId) {
        // Provide detailed reason why business profile wasn't used
        if (!rawProfileData) {
          basePrompt += "No business profile information available. Please create generic content.\n";
          logDebug("No business profile data found for user", { 
            userId,
            rawProfileQueryResult: rawProfileData
          });
        } else if (!profileValidationResults || !profileValidationResults.isValid) {
          basePrompt += "Limited business profile information available. Please create mostly generic content.\n";
          logDebug("Business profile validation failed", {
            validationResults: profileValidationResults,
            rawProfile: rawProfileData
          });
        }
      } else {
        basePrompt += "No business profile information available. Please create generic content.";
        logDebug("No user ID available for business profile", { 
          authHeader: !!authHeader,
          authData
        });
      }
    }
    
    logDebug("Business context assembly", {
      processingTime: (Date.now() - businessContextStartTime) + "ms",
      hasBusinessProfile: !!businessProfile,
      businessProfileFields: businessProfile ? Object.keys(businessProfile).filter(k => 
        businessProfile[k] !== null && 
        businessProfile[k] !== undefined && 
        (typeof businessProfile[k] !== 'string' || businessProfile[k] !== '') &&
        (!Array.isArray(businessProfile[k]) || businessProfile[k].length > 0)
      ) : [],
      includedFields
    });

    // Store the full assembled prompt for logging
    const fullAssembledPrompt = basePrompt;

    // Log the assembled prompt (truncated for logs)
    const truncatedPrompt = basePrompt.length > 200 
      ? basePrompt.substring(0, 200) + "..." 
      : basePrompt;
    
    logDebug("Assembled prompt", { truncatedPrompt });

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
        
        const { error: logError } = await supabase
          .from("user_activity_logs")
          .insert({
            user_id: userId,
            action_type: "content_generation_prompt",
            action_details: {
              prompt_id: customPromptData.prompts?.id,
              prompt_title: customPromptData.prompts?.title,
              generation_id: generationData?.id,
              full_prompt: fullAssembledPrompt,
              system_prompt: settings.systemPrompt,
              model: settings.model,
              business_profile_used: !!businessProfile && profileValidationResults?.isValid,
              business_profile_completeness: profileValidationResults?.completeness || 0,
              business_fields_used: includedFields
            }
          });

        if (logError) {
          logWarn("Error logging activity", { error: logError });
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
          generationId: generationData?.id || null 
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
