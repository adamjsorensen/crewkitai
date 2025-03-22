
// @ts-ignore: Deno-specific imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: Deno-specific imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore: Deno-specific imports
import { OpenAI } from 'https://esm.sh/openai@4.0.0';

// Add Deno namespace declaration for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  
  // Enhanced logging function
  const log = (level: string, message: string, data?: any) => {
    const elapsed = Date.now() - startTime;
    console.log(`[${level}][req:${requestId}][+${elapsed}ms] ${message}`, data || '');
  };
  
  try {
    log('INFO', 'Processing vision analysis request');
    
    let requestBody;
    try {
      requestBody = await req.json();
      log('DEBUG', 'Request body parsed successfully');
    } catch (e) {
      log('ERROR', 'Failed to parse request body', e);
      throw new Error('Invalid request format: ' + (e instanceof Error ? e.message : String(e)));
    }
    
    const { imageUrl, prompt, userId, conversationId } = requestBody;
    
    // Log the incoming request data for debugging
    log('INFO', 'Request details', { 
      promptLength: prompt?.length || 0, 
      promptSample: prompt?.substring(0, 50) || '',
      imageUrlLength: imageUrl?.length || 0,
      imageUrlSample: imageUrl?.substring(0, 30) + '...' + (imageUrl?.length > 60 ? imageUrl?.substring(imageUrl.length - 30) : ''),
      conversationId: conversationId || 'new', 
      userId: userId?.substring(0, 8) || 'unknown'
    });
    
    // Validate required parameters
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      log('ERROR', 'Missing Supabase credentials');
      throw new Error('Server configuration error: Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    log('DEBUG', 'Supabase client initialized');
    
    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      log('ERROR', 'Missing OpenAI API key');
      throw new Error('Server configuration error: Missing OpenAI API key');
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    log('DEBUG', 'OpenAI client initialized');
    
    // Get system prompt from settings
    log('DEBUG', 'Fetching system prompt from settings');
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();
    
    if (settingsError) {
      log('WARN', 'Failed to fetch system prompt', settingsError);
    }
    
    const systemPrompt = settings?.value || 'You are an AI Coach for painting professionals.';
    log('DEBUG', 'Using system prompt', { length: systemPrompt.length });
    
    log('INFO', 'Processing with image URL - making GPT-4o request');
    
    // Test if image URL is accessible with a HEAD request
    log('DEBUG', 'Testing image URL with HEAD request');
    try {
      const imageTest = await fetch(imageUrl, { method: 'HEAD' });
      if (!imageTest.ok) {
        log('WARN', 'Image URL test failed', { 
          status: imageTest.status, 
          statusText: imageTest.statusText 
        });
      } else {
        log('DEBUG', 'Image URL test successful', { 
          contentType: imageTest.headers.get('content-type') 
        });
      }
    } catch (e) {
      log('WARN', 'Error testing image URL, but proceeding anyway', e);
    }
    
    // Use the GPT-4o model with vision capabilities
    log('INFO', 'Sending request to OpenAI');
    const requestStartTime = Date.now();
    let openaiResponse;
    
    try {
      openaiResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: {
                  url: imageUrl,
                  detail: 'high' // Use 'high' for better analysis
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const apiDuration = Date.now() - requestStartTime;
      log('INFO', `OpenAI API responded in ${apiDuration}ms`, {
        model: openaiResponse.model,
        hasChoices: !!openaiResponse.choices?.length
      });
    } catch (error) {
      log('ERROR', 'OpenAI API request failed', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    const analysis = openaiResponse.choices[0]?.message.content || 'Could not analyze the image.';
    log('INFO', 'Analysis completed successfully', { 
      analysisLength: analysis.length,
      sampleContent: analysis.substring(0, 50) + '...'
    });
    
    // Create a new conversation record if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      log('INFO', 'Creating new conversation record');
      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .insert({
          user_id: userId,
          user_message: prompt,
          ai_response: analysis,
          is_root: true,
          created_at: new Date().toISOString(),
          image_url: imageUrl,
          response_model: 'gpt-4o',
          has_image: true
        })
        .select('id')
        .single();
      
      if (error) {
        log('ERROR', 'Failed to create conversation record', error);
        throw error;
      }
      currentConversationId = data.id;
      log('INFO', 'New conversation created', { id: currentConversationId });
    } else {
      // Update existing conversation
      log('INFO', 'Updating existing conversation', { id: currentConversationId });
      const { error: updateError } = await supabase
        .from('ai_coach_conversations')
        .update({
          ai_response: analysis,
          updated_at: new Date().toISOString(),
          has_image: true
        })
        .eq('id', currentConversationId);
        
      if (updateError) {
        log('ERROR', 'Failed to update conversation', updateError);
        // Continue anyway - we don't want to fail the whole request just because of DB update
      }
    }
    
    const totalDuration = Date.now() - startTime;
    log('INFO', `Request completed successfully in ${totalDuration}ms`);
    
    return new Response(
      JSON.stringify({ 
        analysis, 
        conversationId: currentConversationId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[ERROR][req:${requestId}][+${totalDuration}ms] Error in vision-analysis function:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : 'Unknown',
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
