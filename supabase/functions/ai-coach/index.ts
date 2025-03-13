
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
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
