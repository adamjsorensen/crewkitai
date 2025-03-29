
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

interface RequestData {
  content: string;
  modification: string;
}

// Logging function for debugging
const logEvent = async (message: string, data: any = {}) => {
  console.log(`[crewkit-modify-content] ${message}`, data);
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
    if (!requestData.content || !requestData.modification) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content and/or modification" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await logEvent("Request received", { userId, requestData: { 
      contentLength: requestData.content.length,
      modificationLength: requestData.modification.length
    }});

    // 1. Get AI settings for content modification
    const { data: aiSettings, error: aiSettingsError } = await supabase
      .from("ai_settings")
      .select("name, value")
      .in("name", [
        "content_generator_model",
        "content_modifier_temperature"
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
      temperature: 0.7,
      model: "gpt-4o-mini",
    };

    if (aiSettings) {
      aiSettings.forEach(setting => {
        try {
          const value = JSON.parse(setting.value);
          switch (setting.name) {
            case "content_modifier_temperature":
              settings.temperature = parseFloat(value);
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

    // 2. Make a request to the AI model API
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = "You are an editor helping a painting professional modify their content. Make the requested changes to the content while maintaining the core message and professional tone. Return ONLY the modified content, nothing else.";
    
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Original Content:\n\n${requestData.content}\n\nModify the content as follows: ${requestData.modification}\n\nReturn only the modified content.` }
        ],
        temperature: settings.temperature,
        max_tokens: 4000,
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

    const modifiedContent = aiData.choices[0].message.content;

    // 3. Log the activity
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        action_type: "content_modified",
        details: {
          originalLength: requestData.content.length,
          modifiedLength: modifiedContent.length,
          modification: requestData.modification
        }
      });

    if (logError) {
      await logEvent("Error logging activity", { error: logError });
      // Continue anyway
    }

    // 4. Return the modified content
    return new Response(
      JSON.stringify({ modifiedContent }),
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
