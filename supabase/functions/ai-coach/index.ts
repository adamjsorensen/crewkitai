
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
    const { message, imageUrl, userId, context = [], conversationId = null } = await req.json();
    
    if (!message && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Message or image is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userContent = imageUrl 
      ? `${message ? message + '\n\n' : ''}[Image: ${imageUrl}]`
      : message;

    const fullContext = [
      {
        role: 'system',
        content: "You are an AI Coach specializing in the painting industry. Your goal is to provide expert advice tailored for painting professionals and businesses. Focus on areas like pricing jobs, managing clients, leading crews, and marketing strategies. Provide clear, actionable steps when giving advice. Use a friendly, supportive tone that makes complex topics approachable. Your responses should be industry-specific and practical. When the user shares an image, analyze it thoughtfully in the context of the painting industry (e.g., technique, color choices, surface preparation). If you don't know an answer, be honest and don't make up information."
      },
      ...context,
      {
        role: 'user',
        content: userContent
      }
    ];

    // Log details for debugging
    console.log(`Processing request for user: ${userId || 'anonymous'}`);
    console.log(`Message: ${message ? message.substring(0, 50) + '...' : 'No text message'}`);
    console.log(`Image URL: ${imageUrl ? 'Yes' : 'No'}`);
    console.log(`Conversation ID: ${conversationId || 'new conversation'}`);

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use a model that can understand image references
        messages: fullContext,
        temperature: 0.7,
        max_tokens: 1000
      })
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
