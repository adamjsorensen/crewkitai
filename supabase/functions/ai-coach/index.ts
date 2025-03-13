
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      throw new Error('OpenAI API key is not set');
    }

    // Parse the request body
    const { messages, userProfile } = await req.json();
    
    // Construct the system message with user profile context if available
    let systemMessage = {
      role: "system",
      content: `You are a painting business coach, an expert in the painting industry. 
      Your job is to provide valuable, specific advice to help painting contractors and business owners 
      succeed in their business. Focus on practical, actionable insights related to running a painting business, 
      including pricing strategies, finding clients, crew management, marketing, and business growth.
      
      Respond in a friendly, conversational tone. Be concise but thorough. Always provide specific, 
      actionable steps when giving advice. Use examples relevant to the painting industry.`
    };

    // Add user profile context if available
    if (userProfile) {
      systemMessage.content += `\n\nYou're speaking with ${userProfile.full_name || 'a painting professional'}`;
      
      if (userProfile.company_name) {
        systemMessage.content += ` who runs a painting business called ${userProfile.company_name}`;
      }
      
      if (userProfile.company_size) {
        systemMessage.content += ` with ${userProfile.company_size} employees`;
      }
      
      systemMessage.content += '.';
    }

    // Create fetch request to OpenAI streaming API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          systemMessage,
          ...messages
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    // Check for errors
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    // Set up streaming response
    const readableStream = response.body;
    if (!readableStream) {
      throw new Error('No readable stream available from OpenAI');
    }

    // Create a TransformStream to process chunks
    const transformer = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          // Skip the "data: [DONE]" message
          if (line.includes('[DONE]')) continue;
          
          // Remove the "data: " prefix
          const jsonString = line.replace(/^data: /, '');
          
          try {
            // Parse the JSON
            const json = JSON.parse(jsonString);
            // Extract the content delta if it exists
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              // Send only the content part to the client
              controller.enqueue(new TextEncoder().encode(content));
            }
          } catch (error) {
            console.error('Error parsing JSON:', error, 'Line:', line);
          }
        }
      }
    });

    // Return the transformed stream directly
    return new Response(readableStream.pipeThrough(transformer), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Error in AI Coach edge function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
