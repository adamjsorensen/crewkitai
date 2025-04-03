
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { logDebug, logInfo, logWarn, logError } from "./logger.ts";
import { validateBusinessProfile } from "./validators.ts";

// Fetch the custom prompt, including the base prompt and tweaks
export async function fetchCustomPromptData(supabase: any, customPromptId: string) {
  logDebug("Fetching custom prompt data", { customPromptId });
  
  try {
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
      .eq("id", customPromptId)
      .single();

    if (customPromptError) {
      logError("Error fetching custom prompt", { 
        error: customPromptError, 
        promptId: customPromptId 
      });
      return { customPromptData: null, customPromptError };
    }

    if (!customPromptData) {
      logError("Custom prompt not found", { promptId: customPromptId });
      return { 
        customPromptData: null, 
        customPromptError: new Error(`No prompt found with ID: ${customPromptId}`) 
      };
    }

    logInfo("Custom prompt fetched successfully", { 
      promptId: customPromptData.base_prompt_id,
      title: customPromptData.prompts?.title,
      hasCustomizations: (customPromptData.prompt_customizations?.length || 0) > 0,
      hasAdditionalContext: (customPromptData.prompt_additional_context?.length || 0) > 0
    });

    return { customPromptData, customPromptError: null };
  } catch (error) {
    logError("Unexpected error fetching custom prompt", { error });
    return { 
      customPromptData: null, 
      customPromptError: error 
    };
  }
}

// Fetch and parse AI settings
export async function fetchAISettings(supabase: any) {
  logDebug("Fetching AI settings");
  
  try {
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

    logDebug("AI settings", settings);
    return { settings, aiSettingsError: null };
  } catch (error) {
    logError("Unexpected error fetching AI settings", { error });
    return { 
      settings: {
        systemPrompt: "You are an expert content writer for painting professionals. Create high-quality content.",
        temperature: 0.7,
        maxTokens: 2000,
        model: "gpt-4o-mini",
      }, 
      aiSettingsError: error 
    };
  }
}

// Fetch user's business profile data
export async function fetchBusinessProfile(supabase: any, userId: string | null) {
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
    logWarn("No user ID available to fetch business profile");
  }

  return { businessProfile, hasProfileData };
}
