
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
  
  try {
    const { imageUrl, prompt, userId, conversationId } = await req.json();
    
    // Log the incoming request data for debugging
    console.log('Request data:', { 
      promptLength: prompt?.length || 0, 
      imageUrlLength: imageUrl?.length || 0,
      conversationId, 
      userId 
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
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    });
    
    // Get system prompt from settings
    const { data: settings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();
    
    const systemPrompt = settings?.value || 'You are an AI Coach for painting professionals.';
    
    console.log('Processing with image URL:', imageUrl.substring(0, 100) + '...');
    console.log('Using GPT-4o for image analysis');
    
    // Use the GPT-4o model with vision capabilities
    const response = await openai.chat.completions.create({
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
    
    const analysis = response.choices[0]?.message.content || 'Could not analyze the image.';
    console.log('Analysis completed successfully');
    
    // Create a new conversation record if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
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
      
      if (error) throw error;
      currentConversationId = data.id;
    } else {
      // Update existing conversation
      await supabase
        .from('ai_coach_conversations')
        .update({
          ai_response: analysis,
          updated_at: new Date().toISOString(),
          has_image: true
        })
        .eq('id', currentConversationId);
    }
    
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
    console.error('Error in vision-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
