
import { logInfo, logDebug, logError } from "./logger.ts";

// Call OpenAI API to generate content
export async function callOpenAI(apiKey: string, settings: any, basePrompt: string) {
  logInfo("Making request to OpenAI API", { 
    model: settings.model, 
    temperature: settings.temperature,
    max_tokens: settings.maxTokens
  });
  
  const requestBody = JSON.stringify({
    model: settings.model,
    messages: [
      { role: "system", content: settings.systemPrompt },
      { role: "user", content: basePrompt }
    ],
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  });
  
  logDebug("OpenAI request payload", { 
    model: settings.model,
    system_prompt_length: settings.systemPrompt.length,
    user_prompt_length: basePrompt.length,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens
  });
  
  const openaiStartTime = Date.now();
  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: requestBody
  });
  const openaiRequestTime = Date.now() - openaiStartTime;
  
  logInfo("OpenAI API response received", { 
    status: aiResponse.status, 
    statusText: aiResponse.statusText,
    requestTime: openaiRequestTime
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    logError("OpenAI API error", { 
      status: aiResponse.status, 
      statusText: aiResponse.statusText,
      errorBody: errorText
    });
    
    throw new Error(`Error from AI service: ${aiResponse.status} ${aiResponse.statusText} - ${errorText}`);
  }

  const aiData = await aiResponse.json();
  logDebug("AI response data", { 
    choices: aiData.choices?.length || 0,
    id: aiData.id,
    model: aiData.model,
    usage: aiData.usage
  });

  if (!aiData.choices || !aiData.choices.length) {
    logError("Invalid response format from OpenAI", { aiData });
    throw new Error("Invalid response from AI service: The AI service did not return any choices");
  }

  const generatedContent = aiData.choices[0].message.content;
  
  return { generatedContent, openaiRequestTime, aiData };
}
