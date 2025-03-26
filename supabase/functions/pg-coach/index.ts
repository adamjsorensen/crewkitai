import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define AI settings interface
interface AISettings {
  // Core settings
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  models: {
    default: string;
    think?: string;
    vision?: string;
  };
  // Follow-up settings
  followUpEnabled: boolean;
  followUpDefaults: string[];
  followUpPrompt: string;
}

// Default AI settings if database values aren't available
const defaultSettings: AISettings = {
  systemPrompt: `You are the PainterGrowth Coach, an AI assistant specialized in helping painting professionals grow their businesses. 
You provide expert advice tailored to the painting industry, addressing challenges like pricing jobs, managing clients, 
leading crews, and implementing effective marketing strategies.

Your responses should be:
- Practical and actionable, with clear steps
- Tailored to the painting industry context
- Professional but conversational in tone
- Concise but comprehensive`,
  temperature: 0.7,
  maxTokens: 1000,
  models: {
    default: "gpt-4o-mini",
    think: "gpt-4o",
    vision: "gpt-4o"
  },
  followUpEnabled: true,
  followUpDefaults: [
    "How do I price a job properly?",
    "What marketing strategies work best for painters?",
    "How can I improve my crew's efficiency?",
    "What should I include in my contracts?"
  ],
  followUpPrompt: "After each response, suggest 2-3 follow-up questions that would be useful for the user to continue the conversation."
};

// Function to load AI settings from the database
async function loadAISettings(supabaseAdmin: any): Promise<AISettings> {
  console.log("[pg-coach] Loading all AI settings from database");
  
  try {
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("ai_settings")
      .select("name, value")
      .in("name", [
        "ai_coach_system_prompt",
        "ai_coach_temperature", 
        "ai_coach_max_tokens",
        "ai_coach_models",
        "ai_coach_follow_up_enabled", 
        "ai_coach_follow_up_defaults", 
        "ai_coach_follow_up_prompt"
      ]);
      
    if (settingsError) {
      console.error("[pg-coach] Error loading settings:", settingsError);
      return defaultSettings;
    }
    
    if (!settingsData || settingsData.length === 0) {
      console.log("[pg-coach] No settings found in database, using defaults");
      return defaultSettings;
    }
    
    console.log("[pg-coach] Settings loaded:", settingsData);
    
    // Start with default settings
    const settings: AISettings = { ...defaultSettings };
    
    // Process each setting
    for (const setting of settingsData) {
      try {
        if (setting.name === "ai_coach_system_prompt") {
          settings.systemPrompt = JSON.parse(setting.value);
        } 
        else if (setting.name === "ai_coach_temperature") {
          const tempValue = parseFloat(JSON.parse(setting.value));
          if (!isNaN(tempValue) && tempValue >= 0 && tempValue <= 1) {
            settings.temperature = tempValue;
          }
        } 
        else if (setting.name === "ai_coach_max_tokens") {
          const tokenValue = parseInt(JSON.parse(setting.value));
          if (!isNaN(tokenValue) && tokenValue > 0) {
            settings.maxTokens = tokenValue;
          }
        } 
        else if (setting.name === "ai_coach_models") {
          try {
            const models = JSON.parse(setting.value);
            if (models && typeof models === 'object') {
              settings.models = {
                default: models.default || defaultSettings.models.default,
                think: models.think || defaultSettings.models.think,
                vision: models.vision || defaultSettings.models.vision
              };
            }
          } catch (e) {
            console.error("[pg-coach] Error parsing models setting:", e);
          }
        } 
        else if (setting.name === "ai_coach_follow_up_enabled") {
          settings.followUpEnabled = JSON.parse(setting.value) === "true";
        } 
        else if (setting.name === "ai_coach_follow_up_defaults") {
          try {
            const parsedDefaults = JSON.parse(setting.value);
            if (Array.isArray(parsedDefaults)) {
              settings.followUpDefaults = parsedDefaults;
            }
          } catch (e) {
            console.error("[pg-coach] Error parsing follow-up defaults:", e);
          }
        } 
        else if (setting.name === "ai_coach_follow_up_prompt") {
          settings.followUpPrompt = JSON.parse(setting.value);
        }
      } catch (e) {
        console.error(`[pg-coach] Error processing setting ${setting.name}:`, e);
      }
    }
    
    console.log("[pg-coach] Processed settings:", {
      systemPromptLength: settings.systemPrompt.length,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      defaultModel: settings.models.default,
      thinkModel: settings.models.think,
      visionModel: settings.models.vision,
      followUpEnabled: settings.followUpEnabled,
      followUpDefaultsCount: settings.followUpDefaults.length,
      followUpPromptLength: settings.followUpPrompt.length
    });
    
    return settings;
  } catch (error) {
    console.error("[pg-coach] Unexpected error loading settings:", error);
    return defaultSettings;
  }
}

// Extract follow-up questions from AI response
function extractFollowUpQuestions(response: string, defaultQuestions: string[]): string[] {
  const suggestedFollowUps: string[] = [];
  
  try {
    // Try to find a section with numbered questions (1. Question? format)
    const lines = response.split('\n');
    let foundQuestionSection = false;
    
    for (const line of lines) {
      // Check for numbered questions
      const questionMatch = line.match(/^\d+\.\s+(.*\?)/);
      if (questionMatch && questionMatch[1]) {
        suggestedFollowUps.push(questionMatch[1]);
        foundQuestionSection = true;
      }
      // If we've found questions but now we're at a line that isn't a question, we're done
      else if (foundQuestionSection && line.trim() !== '') {
        break;
      }
    }
    
    // If no questions were found, look for bulleted questions
    if (suggestedFollowUps.length === 0) {
      for (const line of lines) {
        const bulletMatch = line.match(/^[\-\*•]\s+(.*\?)/);
        if (bulletMatch && bulletMatch[1]) {
          suggestedFollowUps.push(bulletMatch[1]);
        }
      }
    }
    
    // If still no questions, check for quoted questions
    if (suggestedFollowUps.length === 0) {
      const quotedQuestions = response.match(/"([^"]*\?)"|\*([^*]*\?)\*/g);
      if (quotedQuestions) {
        quotedQuestions.forEach(q => {
          const cleaned = q.replace(/["*]/g, '').trim();
          if (cleaned.endsWith('?')) {
            suggestedFollowUps.push(cleaned);
          }
        });
      }
    }
    
    // If still no questions found, use the defaults
    if (suggestedFollowUps.length === 0 && defaultQuestions.length > 0) {
      // Randomly select up to 3 questions from the defaults
      const shuffled = [...defaultQuestions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }
    
    // Limit to 3 questions max
    return suggestedFollowUps.slice(0, 3);
  } catch (error) {
    console.error("[pg-coach] Error extracting follow-up questions:", error);
    return defaultQuestions.slice(0, 3);
  }
}

// Log activity to pg_activity_logs
async function logActivity(supabaseAdmin: any, userId: string, actionType: string, actionDetails: any, affectedResourceType?: string, affectedResourceId?: string) {
  try {
    console.log(`[pg-coach] Logging activity: ${actionType}`);
    
    const { data, error } = await supabaseAdmin.functions.invoke(
      'pg-coach-logger',
      {
        body: {
          user_id: userId,
          action_type: actionType,
          action_details: actionDetails || {},
          conversation_id: affectedResourceId
        },
      }
    );

    if (error) {
      console.error('[pg-coach] Error calling pg-coach-logger function:', error);
    }
  } catch (error) {
    console.error('[pg-coach] Error in activity logging:', error);
  }
}

serve(async (req) => {
  console.log("[pg-coach] Function invoked:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[pg-coach] Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[pg-coach] Request body parsed successfully:", {
        hasMessage: !!requestBody.message,
        messageLength: requestBody.message?.length,
        hasConversationId: !!requestBody.conversationId,
        hasImageUrl: !!requestBody.imageUrl,
        isThinkMode: !!requestBody.isThinkMode
      });
    } catch (parseError) {
      console.error("[pg-coach] Error parsing request body:", parseError);
      throw new Error('Invalid JSON: ' + parseError.message);
    }
    
    const { message, conversationId, imageUrl = null, isThinkMode = false } = requestBody;
    
    // Validate required fields
    if (!message) {
      console.error("[pg-coach] Missing required field: message");
      throw new Error('Message is required');
    }

    // Get API keys from environment variables
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log("[pg-coach] Environment check:", {
      hasOpenAiKey: !!openAiApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      hasSupabaseServiceKey: !!supabaseServiceKey
    });
    
    if (!openAiApiKey) {
      console.error("[pg-coach] OpenAI API key not configured");
      throw new Error('OpenAI API key not configured');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[pg-coach] Supabase configuration missing");
      throw new Error('Supabase configuration missing');
    }
    
    // Create Supabase client with the service role key for admin access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user ID from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[pg-coach] Missing Authorization header");
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log("[pg-coach] Verifying user token...");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.error("[pg-coach] User token verification failed:", userError);
      throw new Error('Invalid user token: ' + userError.message);
    }
    
    if (!user) {
      console.error("[pg-coach] No user found in token");
      throw new Error('Invalid user token: No user found');
    }
    
    const userId = user.id;
    console.log("[pg-coach] User authenticated:", { userId });
    
    // Load AI settings from the database
    const settings = await loadAISettings(supabaseAdmin);
    
    // Build the system prompt
    let systemPrompt = settings.systemPrompt;

    // Add follow-up question instruction if enabled
    if (settings.followUpEnabled) {
      systemPrompt += `\n\n${settings.followUpPrompt}`;
    }

    // Build the conversation history for context
    let messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];
    
    // If this is part of an existing conversation, fetch previous messages for context
    if (conversationId) {
      console.log("[pg-coach] Fetching conversation history for ID:", conversationId);
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('pg_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Limit to last 10 messages for context
      
      if (historyError) {
        console.error("[pg-coach] Error fetching conversation history:", historyError);
      }
      
      if (!historyError && historyData && historyData.length > 0) {
        console.log("[pg-coach] Retrieved conversation history:", { messageCount: historyData.length });
        const contextMessages = historyData.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Insert the history before the current message
        messages = [
          messages[0], // Keep the system prompt first
          ...contextMessages,
          messages[1] // Current user message last
        ];
      } else {
        console.log("[pg-coach] No conversation history found or error occurred");
      }
    }
    
    // If thinking mode is enabled, use a more analytical approach
    if (isThinkMode) {
      console.log("[pg-coach] Think mode enabled, adding additional system instruction");
      messages.unshift({
        role: "system",
        content: "For this response, I want you to think deeply and provide a more thorough analysis. Consider multiple perspectives, weigh pros and cons, and provide strategic insights."
      });
    }
    
    // Determine which model to use based on settings
    let model = settings.models.default;
    
    // If thinking mode, use the think model if available
    if (isThinkMode && settings.models.think) {
      model = settings.models.think;
    }
    
    // If an image was provided, use the vision model and include the image in the message
    if (imageUrl) {
      console.log("[pg-coach] Image provided, using vision model");
      // Use vision model if configured, otherwise use default
      model = settings.models.vision || "gpt-4o";
      
      // Replace the last user message with one that includes the image
      messages[messages.length-1] = {
        role: "user",
        content: [
          { type: "text", text: message },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      };
    }
    
    console.log("[pg-coach] Calling OpenAI API:", {
      model,
      messageCount: messages.length,
      temperature: isThinkMode ? "N/A" : settings.temperature,
      maxCompletionTokens: settings.maxTokens,
    });
    
    // Prepare the OpenAI API request body - conditionally add temperature parameter
    const openAIRequestBody: any = {
      model: model,
      messages: messages,
      max_completion_tokens: settings.maxTokens,
    };
    
    // Only add temperature parameter for non-think mode
    if (!isThinkMode) {
      openAIRequestBody.temperature = settings.temperature;
    }
    
    console.log("[pg-coach] OpenAI request payload:", {
      model: openAIRequestBody.model,
      messagesCount: openAIRequestBody.messages.length,
      temperature: isThinkMode ? "N/A" : openAIRequestBody.temperature,
      max_completion_tokens: openAIRequestBody.max_completion_tokens
    });

    // Log user message to activity logs - updated to pass userId
    await logActivity(
      supabaseAdmin,
      userId, 
      'chat_message', 
      {
        user_message: message,
        conversation_id: conversationId,
        is_think_mode: isThinkMode,
        has_image: !!imageUrl
      }, 
      'conversation', 
      conversationId
    );
    
    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequestBody),
    });
    
    console.log("[pg-coach] OpenAI API response status:", {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      ok: openAIResponse.ok
    });
    
    if (!openAIResponse.ok) {
      let errorMessage = '';
      try {
        const errorData = await openAIResponse.json();
        console.error('[pg-coach] OpenAI API error:', errorData);
        errorMessage = errorData.error?.message || 'Unknown error';
      } catch (e) {
        console.error('[pg-coach] Could not parse OpenAI error response', e);
        errorMessage = await openAIResponse.text() || 'Unknown error parsing response';
      }
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }
    
    const responseData = await openAIResponse.json();
    console.log("[pg-coach] OpenAI API response received successfully");
    const aiResponse = responseData.choices[0]?.message?.content || '';
    
    // Extract suggested follow-up questions if enabled
    const suggestedFollowUps = settings.followUpEnabled 
      ? extractFollowUpQuestions(aiResponse, settings.followUpDefaults)
      : [];
    
    console.log("[pg-coach] Extracted follow-up suggestions:", {
      count: suggestedFollowUps.length,
      suggestions: suggestedFollowUps
    });
    
    // If this is a new conversation, create it first
    let actualConversationId = conversationId;
    if (!conversationId) {
      console.log("[pg-coach] Creating new conversation");
      const { data: newConversation, error: conversationError } = await supabaseAdmin
        .from('pg_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select('id')
        .single();
      
      if (conversationError) {
        console.error("[pg-coach] Error creating conversation:", conversationError);
        throw new Error(`Failed to create conversation: ${conversationError.message || 'Unknown error'}`);
      }
      
      if (!newConversation) {
        console.error("[pg-coach] No conversation data returned after insert");
        throw new Error('Failed to create conversation: No data returned');
      }
      
      actualConversationId = newConversation.id;
      console.log("[pg-coach] New conversation created:", actualConversationId);
    }
    
    // Save the user message
    console.log("[pg-coach] Saving user message");
    const { error: userMsgError } = await supabaseAdmin
      .from('pg_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'user',
        content: message,
        image_url: imageUrl,
      });
    
    if (userMsgError) {
      console.error('[pg-coach] Error saving user message:', userMsgError);
    }
    
    // Save the AI response
    console.log("[pg-coach] Saving AI response");
    const { error: aiMsgError } = await supabaseAdmin
      .from('pg_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: aiResponse,
        metadata: { suggestedFollowUps },
      });
    
    if (aiMsgError) {
      console.error('[pg-coach] Error saving AI message:', aiMsgError);
    }
    
    // Update the conversation timestamp
    await supabaseAdmin
      .from('pg_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', actualConversationId);

    // Log AI response to activity logs - updated to pass userId
    await logActivity(
      supabaseAdmin,
      userId, 
      'chat_response', 
      {
        prompt: message,
        response: aiResponse,
        conversation_id: actualConversationId,
        is_think_mode: isThinkMode,
        has_image: !!imageUrl
      }, 
      'conversation', 
      actualConversationId
    );
    
    console.log("[pg-coach] Function completed successfully");
    
    // Return the AI response and conversation ID
    return new Response(
      JSON.stringify({
        response: aiResponse,
        suggestedFollowUps,
        conversationId: actualConversationId,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('[pg-coach] Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
