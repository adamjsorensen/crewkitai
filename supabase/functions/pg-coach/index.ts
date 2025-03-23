
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.3.0/mod.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { message, conversationId, imageUrl = null, isThinkMode = false } = await req.json();
    
    // Validate required fields
    if (!message) {
      throw new Error('Message is required');
    }

    // Get API keys from environment variables
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openAiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    // Create Supabase client with the service role key for admin access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user ID from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }
    
    const userId = user.id;
    
    // System prompt for the AI assistant
    const systemPrompt = `You are the PainterGrowth Coach, an AI assistant specialized in helping painting professionals grow their businesses. 
You provide expert advice tailored to the painting industry, addressing challenges like pricing jobs, managing clients, 
leading crews, and implementing effective marketing strategies.

Your responses should be:
- Practical and actionable, with clear steps
- Tailored to the painting industry context
- Professional but conversational in tone
- Concise but comprehensive

After each response, suggest 2-3 follow-up questions that would be useful for the user to continue the conversation.`;

    // Build the conversation history for context
    let messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];
    
    // If this is part of an existing conversation, fetch previous messages for context
    if (conversationId) {
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('pg_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Limit to last 10 messages for context
      
      if (!historyError && historyData && historyData.length > 0) {
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
      }
    }
    
    // If thinking mode is enabled, use a more analytical approach
    if (isThinkMode) {
      messages.unshift({
        role: "system",
        content: "For this response, I want you to think deeply and provide a more thorough analysis. Consider multiple perspectives, weigh pros and cons, and provide strategic insights."
      });
    }
    
    // If an image was provided, use the Vision model and include the image in the message
    let model = "gpt-4o-mini";
    if (imageUrl) {
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
    
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await openAIResponse.json();
    const aiResponse = responseData.choices[0]?.message?.content || '';
    
    // Extract suggested follow-up questions if present (format: "1. Question? 2. Question?")
    const suggestedFollowUps: string[] = [];
    const lines = aiResponse.split('\n');
    for (const line of lines) {
      // Look for numbered questions at the end of the response
      const questionMatch = line.match(/^\d+\.\s+(.*\?)/);
      if (questionMatch && questionMatch[1]) {
        suggestedFollowUps.push(questionMatch[1]);
      }
    }
    
    // If this is a new conversation, create it first
    let actualConversationId = conversationId;
    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await supabaseAdmin
        .from('pg_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select('id')
        .single();
      
      if (conversationError || !newConversation) {
        throw new Error(`Failed to create conversation: ${conversationError?.message || 'Unknown error'}`);
      }
      
      actualConversationId = newConversation.id;
    }
    
    // Save the user message
    const { error: userMsgError } = await supabaseAdmin
      .from('pg_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'user',
        content: message,
        image_url: imageUrl,
      });
    
    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }
    
    // Save the AI response
    const { error: aiMsgError } = await supabaseAdmin
      .from('pg_messages')
      .insert({
        conversation_id: actualConversationId,
        role: 'assistant',
        content: aiResponse,
        metadata: { suggestedFollowUps },
      });
    
    if (aiMsgError) {
      console.error('Error saving AI message:', aiMsgError);
    }
    
    // Update the conversation timestamp
    await supabaseAdmin
      .from('pg_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', actualConversationId);
    
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
    console.error('Edge function error:', error);
    
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
