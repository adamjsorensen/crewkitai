
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

// Basic CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client
const supabase = createClient(
  supabaseUrl ?? '',
  supabaseServiceKey ?? ''
);

serve(async (req) => {
  console.log(`[ai-coach] Received request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight - this must be extremely simple and reliable
  if (req.method === 'OPTIONS') {
    console.log('[ai-coach] Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get request body
    const requestBody = await req.json();
    const { message, imageUrl, userId, context = [], conversationId = null, thinkMode = false } = requestBody;
    
    console.log(`[ai-coach] Processing request for user: ${userId ? `${userId.substring(0, 8)}...` : 'anonymous'}`);
    
    if ((!message && !imageUrl) || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare messages for OpenAI API
    const systemPrompt = "You are an AI Coach specializing in the painting industry. Your goal is to provide expert advice tailored for painting professionals and businesses. Focus on areas like pricing jobs, managing clients, leading crews, and marketing strategies. Provide clear, actionable steps when giving advice. Use a friendly, supportive tone that makes complex topics approachable. Your responses should be industry-specific and practical.";
    
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...context
    ];

    // Add user message with image if provided
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message || 'Please analyze this image.' },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Select model based on thinkMode
    const model = thinkMode ? "o3-mini-2025-01-31" : "gpt-4o";
    console.log(`[ai-coach] Using model: ${model}`);

    // Define request body
    const requestBody: any = {
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    // Add function calling for follow-up questions (only for OpenAI models)
    if (!model.includes('o3-mini')) {
      requestBody.functions = [{
        name: "generate_follow_up_questions",
        description: "Generate 4 follow-up questions based on the conversation context",
        parameters: {
          type: "object",
          properties: {
            follow_up_questions: {
              type: "array",
              description: "Four follow-up questions the user might want to ask next",
              items: {
                type: "string"
              },
              minItems: 4,
              maxItems: 4
            }
          },
          required: ["follow_up_questions"]
        }
      }];
      
      requestBody.function_call = {
        name: "generate_follow_up_questions"
      };
    }

    // Call OpenAI API
    console.log('[ai-coach] Sending request to OpenAI API');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`[ai-coach] OpenAI API error: ${openAIResponse.status}`, errorText);
      
      return new Response(
        JSON.stringify({
          error: `OpenAI API error (${openAIResponse.status})`,
          details: errorText
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await openAIResponse.json();
    console.log('[ai-coach] Received response from OpenAI API');
    
    const message = data.choices[0].message;
    const aiResponse = message.content || "";
    let suggestedFollowUps: string[] = [];
    
    // Extract follow-up questions from function call if present
    if (message.function_call) {
      try {
        const functionArgs = JSON.parse(message.function_call.arguments);
        if (functionArgs.follow_up_questions && Array.isArray(functionArgs.follow_up_questions)) {
          suggestedFollowUps = functionArgs.follow_up_questions.slice(0, 4);
        }
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
      }
    }
    
    // If no follow-ups, use default questions
    if (suggestedFollowUps.length === 0) {
      suggestedFollowUps = [
        "How much should I charge for a typical painting job?",
        "What are the best marketing strategies for painting businesses?",
        "How can I improve my crew's efficiency?",
        "What equipment is worth investing in for a painting business?"
      ];
    }
    
    // Store conversation in database if needed
    let newConversationId = conversationId;
    
    try {
      if (!conversationId && userId) {
        // Create new conversation
        const title = message ? (message.length > 30 ? message.substring(0, 30) + '...' : message) : 'Image analysis';
        
        const { data: rootData, error: rootError } = await supabase
          .from('ai_coach_conversations')
          .insert({
            user_id: userId,
            user_message: message || 'Image analysis request',
            ai_response: aiResponse,
            is_root: true,
            title,
            image_url: imageUrl
          })
          .select('id')
          .single();
        
        if (rootError) {
          console.error('Error creating conversation:', rootError);
        } else {
          console.log('Created new conversation with ID:', rootData.id);
          newConversationId = rootData.id;
        }
      } else if (conversationId && userId) {
        // Add to existing conversation
        const { error: msgError } = await supabase
          .from('ai_coach_conversations')
          .insert({
            user_id: userId,
            user_message: message || 'Image analysis request',
            ai_response: aiResponse,
            conversation_id: conversationId,
            image_url: imageUrl
          });
        
        if (msgError) {
          console.error('Error adding message to conversation:', msgError);
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue despite database errors to ensure user gets a response
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        suggestedFollowUps,
        model: data.model,
        usage: data.usage,
        imageProcessed: !!imageUrl,
        timestamp: new Date().toISOString(),
        conversationId: newConversationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ai-coach] Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
