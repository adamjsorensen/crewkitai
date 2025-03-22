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
let settingsCache: Record<string, any> = {};
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
      console.log('Processing image URL:', imageUrl.substring(0, 100) + '...');
      console.log('Image URL details:', {
        startsWithHttp: imageUrl.startsWith('http'),
        includesSignedUrl: imageUrl.includes('token='),
        includesStorage: imageUrl.includes('storage'),
        length: imageUrl.length
      });
      
      let imageValidated = false;
      let validationError = null;
      
      // Validate the image URL
      try {
        // Test if URL is valid by making a HEAD request
        console.log('Testing image URL with HEAD request');
        let imageResponse;
        try {
          imageResponse = await fetch(imageUrl, { 
            method: 'HEAD',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
        } catch (fetchError) {
          console.error('Fetch error during image URL validation:', fetchError);
          throw new Error(`Network error accessing image URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
        }
        
        console.log('Image URL HEAD response:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          headers: Object.fromEntries([...imageResponse.headers.entries()])
        });
        
        if (!imageResponse.ok) {
          console.error(`Image URL test failed: ${imageResponse.status} ${imageResponse.statusText}`);
          
          // Try a GET request as a fallback since some CDNs don't handle HEAD requests well
          console.log('Trying GET request instead...');
          try {
            const getResponse = await fetch(imageUrl, {
              method: 'GET',
              headers: {
                'Range': 'bytes=0-1024' // Just get the first KB to check the mime type
              }
            });
            
            console.log('Image URL GET response:', {
              status: getResponse.status,
              statusText: getResponse.statusText,
              headers: Object.fromEntries([...getResponse.headers.entries()])
            });
            
            if (getResponse.ok) {
              console.log('GET request successful, proceeding with the image');
              imageResponse = getResponse;
            } else {
              throw new Error(`Image URL is not accessible: ${getResponse.status} ${getResponse.statusText}`);
            }
          } catch (getError) {
            console.error('GET request also failed:', getError);
            throw new Error(`Image URL is not accessible even with GET request: ${getError instanceof Error ? getError.message : 'Unknown error'}`);
          }
        }
        
        // Check content type to ensure it's an image
        const contentType = imageResponse.headers.get('content-type');
        console.log('Content type from request:', contentType);
        
        if (!contentType || !contentType.startsWith('image/')) {
          // Some URLs might not return correct content type in headers
          // but still be valid images. We'll log this but still try to use the image
          console.warn(`Suspicious content type: ${contentType || 'none'}, but proceeding with image URL anyway`);
        }
        
        console.log(`Image URL validation completed successfully`);
        imageValidated = true;
        
        // Add message with validated image URL
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: message || 'Please analyze this image.' },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }
          ]
        });
      } catch (error) {
        validationError = error;
        console.error('Image URL validation failed:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          imageUrl: imageUrl.substring(0, 100) + '...'
        });
        
        // Fallback to text-only mode if image URL is invalid
        messages.push({
          role: 'user',
          content: `${message || 'I wanted to share an image, but'} (Note: The image could not be processed: ${error instanceof Error ? error.message : 'Unknown error'}).`
        });
      }
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

    // Call OpenAI API with enhanced error handling
    console.log('Sending request to OpenAI API');
    console.log('Request body:', JSON.stringify(requestBody, (key, value) => {
      // Truncate long strings in logging
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      return value;
    }, 2));
    
    let openAIResponse;
    try {
      console.log(`Sending OpenAI request at ${new Date().toISOString()}, has image: ${imageUrl ? 'YES' : 'NO'}`);
      const startTime = Date.now();
      
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const duration = Date.now() - startTime;
      console.log(`OpenAI API response received in ${duration}ms with status: ${openAIResponse.status}`);
      
      // Log response headers for debugging
      console.log('OpenAI response headers:', Object.fromEntries([...openAIResponse.headers.entries()]));
    } catch (fetchError) {
      console.error('Fetch error calling OpenAI API:', {
        error: fetchError instanceof Error ? {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        } : fetchError,
        hasImage: !!imageUrl,
        model: requestBody.model
      });
      throw new Error(`Network error calling OpenAI API: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
    }

    if (!openAIResponse.ok) {
      let errorDetails = 'No error details available';
      try {
        const errorData = await openAIResponse.json();
        console.error('OpenAI API error response:', errorData);
        errorDetails = JSON.stringify(errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        try {
          errorDetails = await openAIResponse.text();
        } catch (textError) {
          console.error('Failed to get error text:', textError);
        }
      }
      
      throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorDetails}`);
    }

    const data = await openAIResponse.json();
    console.log('OpenAI API response:', {
      model: data.model,
      usage: data.usage,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentPreview: data.choices?.[0]?.message?.content?.substring(0, 50) + '...',
      imageProcessed: imageUrl ? 'YES' : 'NO' 
    });
    
    // Check if we have a valid response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenAI API:', data);
      throw new Error('OpenAI API returned an invalid response structure');
    }
    
    const aiResponse = data.choices[0].message.content;
    
    // Calculate response quality metrics
    const responseLength = aiResponse ? aiResponse.length : 0;
    const hasImageReference = aiResponse && (aiResponse.toLowerCase().includes('image') || aiResponse.toLowerCase().includes('picture'));
    
    console.log('Response quality metrics:', {
      length: responseLength,
      hasImageReference,
      imageWasProvided: !!imageUrl
    });

    // Store conversation in database if needed
    let newConversationId = conversationId;
    
    if (!conversationId && userId) {
      try {
        // Create a new root conversation
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
      } catch (dbError) {
        console.error('Database error when creating conversation:', dbError);
      }
    } else if (conversationId && userId) {
      try {
        // Add message to existing conversation
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
        } else {
          console.log('Added message to existing conversation:', conversationId);
        }
      } catch (dbError) {
        console.error('Database error when adding message:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
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
