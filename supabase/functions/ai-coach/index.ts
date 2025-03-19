import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client with admin privileges
const supabase = createClient(
  supabaseUrl ?? '',
  supabaseServiceKey ?? ''
);

// Cache for settings to reduce database queries
const settingsCache: Record<string, any> = {};
let settingsCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute in milliseconds

// Function to fetch settings from the database with caching
async function getAiSettings() {
  const currentTime = Date.now();
  
  // If cache is valid, use it
  if (settingsCacheTime + CACHE_TTL > currentTime && Object.keys(settingsCache).length > 0) {
    console.log('Using cached AI settings');
    return settingsCache;
  }
  
  console.log('Fetching AI settings from database');
  
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('name, value')
      .in('name', [
        'ai_coach_system_prompt',
        'ai_coach_temperature',
        'ai_coach_max_tokens',
        'ai_coach_models'
      ]);
    
    if (error) {
      throw error;
    }
    
    // Update cache
    const settings: Record<string, any> = {};
    data.forEach(item => {
      let value = item.value;
      
      // Parse JSON values
      if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as is if parsing fails
          console.error('Error parsing JSON setting:', item.name, e);
        }
      }
      
      settings[item.name] = value;
    });
    
    settingsCache = settings;
    settingsCacheTime = currentTime;
    
    return settings;
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    
    // Return default settings if database fetch fails
    return {
      ai_coach_system_prompt: "You are an AI Coach specializing in the painting industry. Your goal is to provide expert advice tailored for painting professionals and businesses. Focus on areas like pricing jobs, managing clients, leading crews, and marketing strategies. Provide clear, actionable steps when giving advice. Use a friendly, supportive tone that makes complex topics approachable. Your responses should be industry-specific and practical. When the user shares an image, analyze it thoughtfully in the context of the painting industry (e.g., technique, color choices, surface preparation). If you don't know an answer, be honest and don't make up information.",
      ai_coach_temperature: 0.7,
      ai_coach_max_tokens: 1000,
      ai_coach_models: { default: "gpt-4o", think: "o3-mini-2025-01-31" }
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get AI settings from database (with caching)
    const settings = await getAiSettings();
    
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

    // Get system prompt from settings
    const systemPrompt = settings.ai_coach_system_prompt || "You are an AI Coach specializing in the painting industry...";
    
    // Prepare messages for OpenAI API
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

    // Get model configuration from settings
    const modelConfig = settings.ai_coach_models || { default: "gpt-4o", think: "o3-mini-2025-01-31" };
    
    // Select model based on thinkMode
    const model = thinkMode ? modelConfig.think : modelConfig.default;
    console.log(`Using model: ${model}`);

    // Define request body based on the model
    const requestBody: any = {
      model: model,
      messages: messages
    };

    // Add model-specific parameters
    // Check if the model is o3-mini (Anthropic Claude model)
    if (model.includes('o3-mini')) {
      // For o3-mini model (Anthropic Claude), use max_completion_tokens but skip temperature
      requestBody.max_completion_tokens = parseInt(settings.ai_coach_max_tokens) || 1000;
      console.log(`Using max_completion_tokens: ${requestBody.max_completion_tokens}`);
    } else {
      // For other models like GPT-4, use temperature and max_tokens
      requestBody.temperature = parseFloat(settings.ai_coach_temperature) || 0.7;
      requestBody.max_tokens = parseInt(settings.ai_coach_max_tokens) || 1000;
      console.log(`Using temperature: ${requestBody.temperature}`);
      console.log(`Using max tokens: ${requestBody.max_tokens}`);
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
