
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the service role key for admin access
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    // Get the request body
    const { message, imageUrl, userId, context = [], conversationId = null, thinkMode = false } = await req.json();
    
    if (!message && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Message or image is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: "You are an AI Coach specializing in the painting industry. Your goal is to provide expert advice tailored for painting professionals and businesses. Focus on areas like pricing jobs, managing clients, leading crews, and marketing strategies. Provide clear, actionable steps when giving advice. Use a friendly, supportive tone that makes complex topics approachable. Your responses should be industry-specific and practical. When the user shares an image, analyze it thoughtfully in the context of the painting industry (e.g., technique, color choices, surface preparation). If you don't know an answer, be honest and don't make up information."
      },
      ...context
    ];

    // Add user message with image if provided
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message || 'Please analyze this image.' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Log details for debugging
    console.log(`Processing request for user: ${userId || 'anonymous'}`);
    console.log(`Message: ${message ? message.substring(0, 50) + '...' : 'No text message'}`);
    console.log(`Image URL: ${imageUrl ? 'Yes' : 'No'}`);
    console.log(`Conversation ID: ${conversationId || 'new conversation'}`);
    console.log(`Think Mode: ${thinkMode ? 'Yes' : 'No'}`);

    // Select model based on thinkMode
    const model = thinkMode ? 'o3-mini-2025-01-31' : 'gpt-4o';
    console.log(`Using model: ${model}`);

    // Define request body based on the model
    const requestBody = {
      model: model,
      messages: messages,
      temperature: 0.7
    };

    // Add the appropriate token parameter based on the model
    if (model === 'o3-mini-2025-01-31') {
      // For o3-mini model, use max_completion_tokens
      Object.assign(requestBody, { max_completion_tokens: 1000 });
    } else {
      // For other models, use max_tokens
      Object.assign(requestBody, { max_tokens: 1000 });
    }

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        model: data.model,
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
