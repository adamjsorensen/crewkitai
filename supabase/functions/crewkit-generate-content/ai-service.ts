
import { logDebug, logError } from "./logger.ts";

interface AISettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
}

export async function callOpenAI(apiKey: string, settings: AISettings, promptText: string) {
  const requestStartTime = Date.now();
  
  try {
    logDebug("Preparing OpenAI API request", { 
      model: settings.model,
      promptLength: promptText.length,
      temperature: settings.temperature
    });

    const messages = [
      {
        role: "system",
        content: settings.systemPrompt || "You are an expert content writer for painting professionals. Create high-quality content."
      },
      { 
        role: "user", 
        content: promptText 
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        messages,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError("OpenAI API error response", { 
        status: response.status, 
        statusText: response.statusText,
        errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    const generatedContent = responseData.choices[0]?.message?.content || "";
    const openaiRequestTime = Date.now() - requestStartTime;
    
    logDebug("OpenAI API request completed", { 
      timeMs: openaiRequestTime,
      tokens: responseData.usage,
      contentLength: generatedContent.length
    });

    return {
      generatedContent,
      openaiRequestTime,
      aiData: {
        model: settings.model,
        usage: responseData.usage,
        responseId: responseData.id
      }
    };
  } catch (error) {
    logError("Error in OpenAI API call", { error: error.message, stack: error.stack });
    throw error;
  }
}
