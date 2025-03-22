import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
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

// Define a function to check for and clean up duplicate conversations
async function cleanupDuplicateConversations(userId: string, conversationId: string | null) {
  if (!conversationId) return;
  
  console.log(`Checking for duplicate conversations with ID: ${conversationId}`);
  
  try {
    // Find all messages with the same conversation_id
    const { data: messages, error } = await supabase
      .from('ai_coach_conversations')
      .select('id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error checking for duplicates:', error);
      return;
    }
    
    if (messages && messages.length > 1) {
      console.log(`Found ${messages.length} messages with conversation_id ${conversationId}, checking for duplicates...`);
      
      // Group messages by creation timestamp (rounded to seconds to catch near-duplicates)
      const timeGroups: Record<string, string[]> = {};
      messages.forEach(msg => {
        // Round to nearest second to catch near-duplicates
        const timeKey = new Date(msg.created_at).toISOString().split('.')[0];
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(msg.id);
      });
      
      // Find groups with more than one message (duplicates)
      for (const [timeKey, ids] of Object.entries(timeGroups)) {
        if (ids.length > 1) {
          console.log(`Found ${ids.length} duplicate messages at time ${timeKey}`);
          
          // Keep the first one, delete the rest
          const idsToDelete = ids.slice(1);
          console.log(`Deleting ${idsToDelete.length} duplicate messages`);
          
          const { error: deleteError } = await supabase
            .from('ai_coach_conversations')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteError) {
            console.error('Error deleting duplicates:', deleteError);
          } else {
            console.log(`Successfully deleted ${idsToDelete.length} duplicate messages`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in cleanupDuplicateConversations:', err);
  }
}

serve(async (req) => {
  console.log("[ai-coach] Received request:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries([...req.headers.entries()].filter(([key]) => 
      !['authorization', 'apikey'].includes(key.toLowerCase())
    ))
  });

  // Handle CORS preflight requests - improved with better error handling
  if (req.method === 'OPTIONS') {
    console.log("[ai-coach] Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204, // No Content is more appropriate for OPTIONS
      headers: corsHeaders,
    });
  }

  try {
    // Get AI settings from database (with caching)
    const settings = await getAiSettings();
    
    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[ai-coach] Parsed request body:", {
        hasMessage: !!requestBody.message,
        hasImageUrl: !!requestBody.imageUrl,
        userId: requestBody.userId ? `${requestBody.userId.substring(0, 8)}...` : 'missing',
        contextLength: requestBody.context?.length || 0,
        conversationId: requestBody.conversationId || 'new',
        thinkMode: !!requestBody.thinkMode
      });
    } catch (parseError) {
      console.error("[ai-coach] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { message, imageUrl, userId, context = [], conversationId = null, thinkMode = false } = requestBody;
    
    if (!message && !imageUrl) {
      console.error("[ai-coach] Missing required parameters: no message or image");
      return new Response(
        JSON.stringify({ error: 'Message or image is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userId) {
      console.error("[ai-coach] Missing required parameter: userId");
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean up any duplicate conversations before proceeding
    if (userId && conversationId) {
      await cleanupDuplicateConversations(userId, conversationId);
    }

    // Get system prompt from settings
    let systemPrompt = settings.ai_coach_system_prompt || "You are an AI Coach specializing in the painting industry...";
    
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

    // Define the function to generate follow-up suggestions
    const functionDefinitions = [
      {
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
      }
    ];

    // Define request body based on the model and include function calling
    const requestBody: any = {
      model: model,
      messages: messages,
      functions: functionDefinitions,
      function_call: {
        name: "generate_follow_up_questions"
      }
    };

    // Add model-specific parameters
    // Check if the model is o3-mini (Anthropic Claude model)
    if (model.includes('o3-mini')) {
      // For o3-mini model (Anthropic Claude), use max_completion_tokens but skip temperature
      requestBody.max_completion_tokens = parseInt(settings.ai_coach_max_tokens) || 1000;
      console.log(`Using max_completion_tokens: ${requestBody.max_completion_tokens}`);
      
      // Remove function calling for non-OpenAI models
      delete requestBody.functions;
      delete requestBody.function_call;
    } else {
      // For other models like GPT-4, use temperature and max_tokens
      requestBody.temperature = parseFloat(settings.ai_coach_temperature) || 0.7;
      requestBody.max_tokens = parseInt(settings.ai_coach_max_tokens) || 1000;
      console.log(`Using temperature: ${requestBody.temperature}`);
      console.log(`Using max tokens: ${requestBody.max_tokens}`);
    }

    // Call OpenAI API with enhanced error handling
    console.log('[ai-coach] Sending request to OpenAI API');
    console.log('[ai-coach] Request body:', JSON.stringify(requestBody, (key, value) => {
      // Truncate long strings in logging
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      return value;
    }, 2));
    
    let openAIResponse;
    try {
      console.log(`[ai-coach] Sending OpenAI request at ${new Date().toISOString()}, has image: ${imageUrl ? 'YES' : 'NO'}`);
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
      console.log(`[ai-coach] OpenAI API response received in ${duration}ms with status: ${openAIResponse.status}`);
    } catch (fetchError) {
      const errorDetails = fetchError instanceof Error ? {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      } : String(fetchError);
      
      console.error('[ai-coach] Fetch error calling OpenAI API:', {
        error: errorDetails,
        hasImage: !!imageUrl,
        model: requestBody.model
      });
      
      return new Response(
        JSON.stringify({
          error: 'Network error when calling OpenAI API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        }),
        {
          status: 502, // Bad Gateway is appropriate for upstream service failure
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!openAIResponse.ok) {
      let errorDetails = 'No error details available';
      try {
        const errorData = await openAIResponse.json();
        console.error('[ai-coach] OpenAI API error response:', errorData);
        errorDetails = JSON.stringify(errorData);
      } catch (parseError) {
        console.error('[ai-coach] Failed to parse error response:', parseError);
        try {
          errorDetails = await openAIResponse.text();
        } catch (textError) {
          console.error('[ai-coach] Failed to get error text:', textError);
        }
      }
      
      return new Response(
        JSON.stringify({
          error: `OpenAI API error (${openAIResponse.status})`,
          details: errorDetails
        }),
        {
          status: 502, // Bad Gateway
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await openAIResponse.json();
    console.log('OpenAI API response:', {
      model: data.model,
      usage: data.usage,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentPreview: data.choices?.[0]?.message?.content?.substring(0, 50) + '...',
      hasFunction: !!data.choices?.[0]?.message?.function_call,
      imageProcessed: imageUrl ? 'YES' : 'NO' 
    });
    
    // Check if we have a valid response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenAI API:', data);
      throw new Error('OpenAI API returned an invalid response structure');
    }
    
    const message = data.choices[0].message;
    const aiResponse = message.content || "";
    let suggestedFollowUps: string[] = [];
    
    // Extract follow-up questions from function call result
    if (message.function_call) {
      try {
        console.log('Found function call in response:', message.function_call.name);
        const functionArgs = JSON.parse(message.function_call.arguments);
        if (functionArgs.follow_up_questions && Array.isArray(functionArgs.follow_up_questions)) {
          suggestedFollowUps = functionArgs.follow_up_questions.slice(0, 4);
          console.log(`Extracted ${suggestedFollowUps.length} follow-up questions from function call`);
        }
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
      }
    }
    
    // Fallback to extracting from content for models without function calling
    if (suggestedFollowUps.length === 0 && model.includes('o3-mini')) {
      // Try to extract from text content
      const followUpRegex = /### SUGGESTED_FOLLOW_UPS\s+([\s\S]+?)(?=\n\n|$)/;
      const followUpMatch = aiResponse.match(followUpRegex);
      
      if (followUpMatch && followUpMatch[1]) {
        console.log('Found suggested follow-ups section in content');
        
        // Extract the suggestions
        const followUpSection = followUpMatch[1];
        const questions = followUpSection.split('\n')
          .map(line => line.trim())
          .filter(line => line.match(/^\d+\.\s+.+/))
          .map(line => line.replace(/^\d+\.\s+/, '').trim());
        
        // Take only 4 suggestions
        questions.slice(0, 4).forEach(question => {
          if (question) suggestedFollowUps.push(question);
        });
        
        console.log(`Extracted ${suggestedFollowUps.length} follow-up suggestions from content`);
      }
    }
    
    // If still no follow-ups, use default questions
    if (suggestedFollowUps.length === 0) {
      console.log('No follow-up suggestions extracted, using defaults');
      suggestedFollowUps = [
        "How much should I charge for a typical painting job?",
        "What are the best marketing strategies for painting businesses?",
        "How can I improve my crew's efficiency?",
        "What equipment is worth investing in for a painting business?"
      ];
    }
    
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
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error);
    
    console.error('[ai-coach] Error processing request:', errorDetails);
    
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
