
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

interface RequestData {
  customPromptId: string;
}

// Logging function for debugging
const logEvent = async (message: string, data: any = {}) => {
  console.log(`[crewkit-generate-content] ${message}`, data);
};

serve(async (req: Request) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the JWT token
    const jwt = authHeader.substring(7);

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token and get the user
    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Get the request data
    const requestData: RequestData = await req.json();

    // Validate the request
    if (!requestData.customPromptId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: customPromptId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await logEvent("Request received", { userId, requestData });

    // 1. Fetch the custom prompt, including the base prompt and tweaks
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

    if (customPromptError || !customPromptData) {
      await logEvent("Error fetching custom prompt", { error: customPromptError });
      return new Response(
        JSON.stringify({ error: "Failed to fetch custom prompt" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Get AI settings
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
      await logEvent("Error fetching AI settings", { error: aiSettingsError });
      return new Response(
        JSON.stringify({ error: "Failed to fetch AI settings" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse AI settings with defaults
    const settings = {
      systemPrompt: "You are an expert content writer for painting professionals. Create high-quality content.",
      temperature: 0.7,
      maxTokens: 2000,
      model: "gpt-4o-mini",
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
          console.error(`Error parsing setting ${setting.name}:`, e);
        }
      });
    }

    // 3. Get user's business profile for context
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, business_name, business_type, painter_type, years_in_business")
      .eq("id", userId)
      .single();

    if (profileError) {
      await logEvent("Error fetching user profile", { error: profileError });
      // Continue anyway, just without profile data
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

    // Add business context if available
    if (profile) {
      basePrompt += "\n\n### Business Context:\n" +
        `Business Name: ${profile.business_name || "Not specified"}\n` +
        `Business Type: ${profile.business_type || "Not specified"}\n` +
        `Painter Type: ${profile.painter_type || "Not specified"}\n` +
        `Years in Business: ${profile.years_in_business || "Not specified"}`;
    }

    await logEvent("Assembled prompt", { basePrompt });

    // 5. Make a request to the AI model API
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: settings.systemPrompt },
          { role: "user", content: basePrompt }
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      })
    });

    const aiData = await aiResponse.json();

    await logEvent("AI response received", { status: aiResponse.status });

    if (!aiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Error from AI service", details: aiData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const generatedContent = aiData.choices[0].message.content;

    // 6. Save the generation to the database
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
      await logEvent("Error saving generation", { error: generationError });
      // Continue anyway to return the content to the user
    }

    // 7. Log the activity
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        action_type: "content_generated",
        details: {
          prompt_id: customPromptData.prompts?.id,
          prompt_title: customPromptData.prompts?.title,
          generation_id: generationData?.id
        }
      });

    if (logError) {
      await logEvent("Error logging activity", { error: logError });
      // Continue anyway
    }

    // 8. Return the generated content
    return new Response(
      JSON.stringify({ 
        generatedContent: generatedContent,
        generationId: generationData?.id || null 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
