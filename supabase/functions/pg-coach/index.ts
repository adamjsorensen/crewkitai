
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Load settings from the database
    console.log("[pg-coach] Loading AI settings from database");
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("ai_settings")
      .select("name, value")
      .in("name", [
        "ai_coach_follow_up_enabled", 
        "ai_coach_follow_up_defaults", 
        "ai_coach_follow_up_prompt"
      ]);
      
    if (settingsError) {
      console.error("[pg-coach] Error loading settings:", settingsError);
    }
    
    // Default settings
    let followUpEnabled = true;
    let followUpDefaults = [
      "How do I price a job properly?",
      "What marketing strategies work best for painters?",
      "How can I improve my crew's efficiency?",
      "What should I include in my contracts?"
    ];
    let followUpPrompt = "After each response, suggest 2-3 follow-up questions that would be useful for the user to continue the conversation.";
    
    // Process settings if available
    if (settingsData && settingsData.length > 0) {
      for (const setting of settingsData) {
        if (setting.name === "ai_coach_follow_up_enabled") {
          followUpEnabled = setting.value === "true";
        } else if (setting.name === "ai_coach_follow_up_defaults") {
          try {
            const parsed = typeof setting.value === 'string' 
              ? JSON.parse(setting.value) 
              : setting.value;
              
            if (Array.isArray(parsed)) {
              followUpDefaults = parsed;
            }
          } catch (e) {
            console.error("[pg-coach] Error parsing follow-up defaults:", e);
          }
        } else if (setting.name === "ai_coach_follow_up_prompt") {
          followUpPrompt = setting.value;
        }
      }
    }
    
    console.log("[pg-coach] Follow-up settings:", {
      enabled: followUpEnabled,
      defaultsCount: followUpDefaults.length,
      prompt: followUpPrompt.substring(0, 50) + (followUpPrompt.length > 50 ? '...' : '')
    });
    
    // System prompt for the AI assistant
    let systemPrompt = `You are the PainterGrowth Coach, an AI assistant specialized in helping painting professionals grow their businesses. 
You provide expert advice tailored to the painting industry, addressing challenges like pricing jobs, managing clients, 
leading crews, and implementing effective marketing strategies.

Your responses should be:
- Practical and actionable, with clear steps
- Tailored to the painting industry context
- Professional but conversational in tone
- Concise but comprehensive`;

    // Add follow-up question instruction if enabled
    if (followUpEnabled) {
      systemPrompt += `\n\n${followUpPrompt}`;
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
    
    // If an image was provided, use the Vision model and include the image in the message
    let model = "gpt-4o-mini";
    if (imageUrl) {
      console.log("[pg-coach] Image provided, using vision model");
      model = "gpt-4o"; // Use vision model
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
      temperature: 0.7,
      maxTokens: 1000
    });
    
    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    console.log("[pg-coach] OpenAI API response status:", {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      ok: openAIResponse.ok
    });
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('[pg-coach] OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await openAIResponse.json();
    console.log("[pg-coach] OpenAI API response received successfully");
    const aiResponse = responseData.choices[0]?.message?.content || '';
    
    // Extract suggested follow-up questions if enabled
    const suggestedFollowUps: string[] = [];
    
    if (followUpEnabled) {
      const lines = aiResponse.split('\n');
      for (const line of lines) {
        // Look for numbered questions at the end of the response
        const questionMatch = line.match(/^\d+\.\s+(.*\?)/);
        if (questionMatch && questionMatch[1]) {
          suggestedFollowUps.push(questionMatch[1]);
        }
      }
      
      // If no follow-ups were found, use defaults
      if (suggestedFollowUps.length === 0 && followUpDefaults.length > 0) {
        followUpDefaults.forEach(q => suggestedFollowUps.push(q));
      }
    }
    
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
      console.log("[pg-coach] New conversation created with ID:", actualConversationId);
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
