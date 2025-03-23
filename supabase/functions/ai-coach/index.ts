
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Access OpenAI API key from environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Create a Supabase client
const supabaseAdmin = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Interface to better type our AI settings
interface AISettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  models: {
    default: string;
    think?: string;
  };
  followUpEnabled: boolean;
  followUpDefaults: string[];
}

// Load AI settings from database
async function loadAISettings(): Promise<AISettings> {
  if (!supabaseAdmin) return { 
    systemPrompt: "You are an AI assistant for painting professionals. Provide helpful, specific advice about painting businesses.", 
    temperature: 0.7, 
    maxTokens: 1000,
    models: { 
      default: "gpt-4o-mini",
      think: "gpt-4o"
    },
    followUpEnabled: true,
    followUpDefaults: [
      "How do I price a job properly?",
      "What marketing strategies work best for painters?",
      "How can I improve my crew's efficiency?",
      "What should I include in my contracts?"
    ]
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_settings')
      .select('name, value')
      .in('name', [
        'ai_coach_system_prompt', 
        'ai_coach_temperature', 
        'ai_coach_max_tokens', 
        'ai_coach_models',
        'ai_coach_follow_up_enabled',
        'ai_coach_follow_up_defaults'
      ]);
    
    if (error) throw error;
    
    const settings: AISettings = {
      systemPrompt: "You are an AI assistant for painting professionals. Provide helpful, specific advice about painting businesses.",
      temperature: 0.7,
      maxTokens: 1000,
      models: {
        default: "gpt-4o-mini",
        think: "gpt-4o"
      },
      followUpEnabled: true,
      followUpDefaults: [
        "How do I price a job properly?",
        "What marketing strategies work best for painters?",
        "How can I improve my crew's efficiency?",
        "What should I include in my contracts?"
      ]
    };
    
    if (data) {
      data.forEach(setting => {
        if (setting.name === 'ai_coach_system_prompt') {
          settings.systemPrompt = setting.value;
        } else if (setting.name === 'ai_coach_temperature') {
          settings.temperature = parseFloat(setting.value) || 0.7;
        } else if (setting.name === 'ai_coach_max_tokens') {
          settings.maxTokens = parseInt(setting.value) || 1000;
        } else if (setting.name === 'ai_coach_models') {
          try {
            // Parse the models configuration
            let modelsConfig = typeof setting.value === 'string' 
              ? JSON.parse(setting.value) 
              : setting.value;
            
            // Ensure we have both default and think models
            settings.models = {
              default: modelsConfig.default || "gpt-4o-mini",
              think: modelsConfig.think || "gpt-4o"
            };
            
            console.log('[ai-coach] Loaded models configuration:', JSON.stringify(settings.models));
          } catch (e) {
            console.error("Error parsing models JSON:", e);
          }
        } else if (setting.name === 'ai_coach_follow_up_enabled') {
          settings.followUpEnabled = setting.value === 'true';
        } else if (setting.name === 'ai_coach_follow_up_defaults') {
          try {
            let defaults = typeof setting.value === 'string'
              ? JSON.parse(setting.value)
              : setting.value;
              
            if (Array.isArray(defaults)) {
              settings.followUpDefaults = defaults;
            }
            
            console.log('[ai-coach] Loaded follow-up defaults:', JSON.stringify(settings.followUpDefaults));
          } catch (e) {
            console.error("Error parsing follow-up defaults JSON:", e);
          }
        }
      });
    }
    
    return settings;
  } catch (err) {
    console.error("Error loading AI settings:", err);
    return { 
      systemPrompt: "You are an AI assistant for painting professionals. Provide helpful, specific advice about painting businesses.", 
      temperature: 0.7, 
      maxTokens: 1000,
      models: { 
        default: "gpt-4o-mini",
        think: "gpt-4o"
      },
      followUpEnabled: true,
      followUpDefaults: [
        "How do I price a job properly?",
        "What marketing strategies work best for painters?",
        "How can I improve my crew's efficiency?",
        "What should I include in my contracts?"
      ]
    };
  }
}

// Function to call OpenAI API
async function callOpenAI(message: string, settings: AISettings, isThinkMode = false) {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  
  try {
    // Use the appropriate model based on think mode
    const model = isThinkMode 
      ? settings.models.think || settings.models.default // Use think model if available, otherwise fall back to default
      : settings.models.default;
    
    // Log which model we're using
    console.log(`[ai-coach] Using model: ${model}${isThinkMode ? ' (Think Mode)' : ''}`);
    
    let systemPrompt = isThinkMode 
      ? `${settings.systemPrompt}\n\nTake your time to think deeply about this question. Consider multiple angles and provide a comprehensive response.` 
      : settings.systemPrompt;
    
    // Add follow-up questions instruction if enabled
    if (settings.followUpEnabled) {
      systemPrompt += "\n\nAfter your response, suggest 2-3 follow-up questions that would be helpful for the user to continue the conversation.";
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        temperature: isThinkMode ? Math.min(settings.temperature + 0.1, 1.0) : settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // Enhanced logging
    console.log('[ai-coach] OpenAI response received:', {
      model: model,
      responseLength: data.choices[0]?.message?.content?.length || 0,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    });
    
    // Validate response content
    if (!data.choices?.[0]?.message?.content) {
      console.error("[ai-coach] Invalid response format from OpenAI:", data);
      throw new Error("Invalid response format from OpenAI");
    }
    
    return {
      response: data.choices[0].message.content,
      model: model,
      usage: data.usage
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

// Function to extract follow-up questions from text
function extractFollowUpQuestions(text: string, settings: AISettings) {
  // If follow-up questions are disabled, return an empty array
  if (!settings.followUpEnabled) {
    return [];
  }
  
  // Look for patterns like numbered lists, bullet points, or sections with "Questions to consider", etc.
  const followUpPatterns = [
    /(?:Questions to consider|Follow-up questions|You might ask|Consider asking):([\s\S]*?)(?:\n\n|$)/i,
    /(?:\d+\.\s+(.*?)(?:\n|$))/g,
    /(?:- (.*?)(?:\n|$))/g,
    /(?:[•*]\s+(.*?)(?:\n|$))/g
  ];
  
  // Try to find follow-up questions using patterns
  let followUps = [];
  
  // Try the first pattern which looks for explicit sections
  const sectionMatch = text.match(followUpPatterns[0]);
  if (sectionMatch && sectionMatch[1]) {
    const section = sectionMatch[1].trim();
    // Extract from the section using numbered or bullet patterns
    const matches = [...section.matchAll(followUpPatterns[1])].concat([...section.matchAll(followUpPatterns[2])], [...section.matchAll(followUpPatterns[3])]);
    
    if (matches.length > 0) {
      followUps = matches.map(m => m[1].trim()).filter(q => q.length > 10 && q.length < 100 && q.includes('?'));
    }
  }
  
  // If no explicit section, try to find anywhere in the text
  if (followUps.length === 0) {
    const matches = [...text.matchAll(followUpPatterns[1])].concat([...text.matchAll(followUpPatterns[2])], [...text.matchAll(followUpPatterns[3])]);
    followUps = matches.map(m => m[1].trim()).filter(q => q.length > 10 && q.length < 100 && q.includes('?'));
  }
  
  // If still no follow-ups, use defaults from settings
  if (followUps.length === 0 && settings.followUpDefaults.length > 0) {
    return settings.followUpDefaults;
  }
  
  // Limit to 4 follow-up questions
  return followUps.slice(0, 4);
}

// Main handler function
serve(async (req) => {
  console.log(`[ai-coach] Request received: ${req.method} ${req.url}`);
  
  // Handle OPTIONS (CORS preflight) requests
  if (req.method === 'OPTIONS') {
    console.log('[ai-coach] Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Health check endpoint
    if (req.method === 'GET') {
      console.log('[ai-coach] Handling GET request (health check)');
      return new Response(
        JSON.stringify({ status: 'ok', version: '23-message-display-fix' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Handle POST requests
    if (req.method === 'POST') {
      console.log('[ai-coach] Handling POST request');
      
      // Parse request body
      const requestData = await req.json();
      const message = requestData.message || 'No message provided';
      const imageUrl = requestData.imageUrl;
      const isThinkMode = requestData.isThinkMode || false;
      
      console.log(`[ai-coach] Received message: ${message.substring(0, 50)}...${isThinkMode ? ' (Think Mode)' : ''}`);
      
      try {
        // Load AI settings
        const settings = await loadAISettings();
        console.log('[ai-coach] Loaded AI settings:', JSON.stringify({
          systemPromptLength: settings.systemPrompt.length,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          models: settings.models,
          followUpEnabled: settings.followUpEnabled,
          followUpDefaultsCount: settings.followUpDefaults.length
        }));
        
        // Get AI response from OpenAI
        let aiResponse;
        try {
          console.log('[ai-coach] Calling OpenAI API');
          const openAIResult = await callOpenAI(message, settings, isThinkMode);
          console.log('[ai-coach] OpenAI API response received:', {
            model: openAIResult.model,
            tokens: openAIResult.usage?.total_tokens || 'unknown',
            responseLength: openAIResult.response.length
          });
          
          aiResponse = openAIResult.response;
        } catch (openAIError) {
          console.error('[ai-coach] OpenAI API error:', openAIError);
          // Fallback response if OpenAI fails
          aiResponse = "I'm having trouble connecting to my knowledge base right now. Please try again in a few moments.";
        }
        
        // Extract potential follow-up questions from the response
        const suggestedFollowUps = extractFollowUpQuestions(aiResponse, settings);
        console.log('[ai-coach] Extracted follow-ups:', suggestedFollowUps);
        
        // Prepare response data
        const responseData = {
          response: aiResponse,
          suggestedFollowUps,
          timestamp: new Date().toISOString()
        };
        
        console.log('[ai-coach] Sending response of length:', aiResponse.length);
        
        return new Response(
          JSON.stringify(responseData),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      } catch (processingError) {
        console.error('[ai-coach] Error processing request:', processingError);
        return new Response(
          JSON.stringify({
            error: 'Error processing request',
            details: processingError instanceof Error ? processingError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Handle other request methods
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ai-coach] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
