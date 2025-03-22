// @ts-ignore: Deno-specific imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno-specific imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Deno-specific imports
import { OpenAI } from 'https://esm.sh/openai@4.0.0'

// Add Deno namespace declaration for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Define types for OpenAI messages
type MessageContent = string | { type: string; text?: string; image_url?: { url: string; detail: string } }[];

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { userMessage, conversationId, userId, imageUrl } = await req.json()
    
    // Log the incoming request data for debugging
    console.log('Request data:', { userMessage: userMessage.substring(0, 50) + '...', conversationId, userId, hasImage: !!imageUrl })
    
    // Set up response headers for streaming
    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', 'text/event-stream')
    headers.set('Cache-Control', 'no-cache')
    headers.set('Connection', 'keep-alive')
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })
    
    // Create a new conversation record if no conversationId is provided
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data, error } = await supabase
        .from('ai_coach_conversations')
        .insert({
          user_id: userId,
          user_message: userMessage,
          ai_response: '', // Will be updated with streaming content
          is_root: true,
          created_at: new Date().toISOString(),
          image_url: imageUrl || null
        })
        .select('id')
        .single()
      
      if (error) throw error
      currentConversationId = data.id
    }
    
    // Create ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get system prompt from settings
          const { data: settings } = await supabase
            .from('ai_settings')
            .select('value')
            .eq('key', 'system_prompt')
            .single()
          
          const systemPrompt = settings?.value || 'You are an AI Coach for painting professionals.'
          
          // Get conversation history if this is not a new conversation
          let conversationHistory = []
          if (conversationId) {
            const { data: history } = await supabase
              .from('ai_coach_conversations')
              .select('user_message, ai_response')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true })
            
            if (history) {
              conversationHistory = history.flatMap(item => [
                { role: 'user', content: item.user_message },
                { role: 'assistant', content: item.ai_response }
              ])
            }
          }
          
          // Create messages array for OpenAI
          let messages: Message[] = []
          let model = 'gpt-4'
          
          // Log image URL if present
          if (imageUrl) {
            console.log('Processing with image URL:', imageUrl.substring(0, 100) + '...')
            
            try {
              // First, validate that we have a proper URL
              if (!imageUrl) {
                throw new Error('Empty image URL provided')
              }
              
              // Ensure the image URL is properly formatted
              let processedImageUrl = imageUrl
              
              // Debug the URL format
              console.log('URL analysis:', {
                originalUrl: processedImageUrl.substring(0, 100) + '...',
                startsWithHttp: processedImageUrl.startsWith('http'),
                includesSignedUrl: processedImageUrl.includes('token='),
                includesStorage: processedImageUrl.includes('storage'),
                isSignedUrl: processedImageUrl.includes('supabase.co/storage/v1/object/sign')
              })
              
              // All Supabase URLs should start with http/https, so this is likely unnecessary,
              // but kept for safety
              if (!processedImageUrl.startsWith('http')) {
                console.log('Converting relative URL to absolute URL')
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
                processedImageUrl = `${supabaseUrl}${processedImageUrl}`
                console.log('Converted to absolute URL:', processedImageUrl.substring(0, 100) + '...')
              }
              
              // Validate the image URL by making a HEAD request
              console.log('Validating image URL with HEAD request...')
              let imageResponse
              try {
                imageResponse = await fetch(processedImageUrl, { 
                  method: 'HEAD',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                })
              } catch (fetchError) {
                console.error('Network error during image URL validation:', fetchError)
                throw new Error(`Network error accessing image URL: ${fetchError.message || 'unknown fetch error'}`)
              }
              
              console.log('HEAD request response:', {
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                headers: Object.fromEntries([...imageResponse.headers.entries()])
              })
              
              if (!imageResponse.ok) {
                console.error(`Image URL is not accessible: ${imageResponse.status} ${imageResponse.statusText}`)
                throw new Error(`Image URL is not accessible: ${imageResponse.status} ${imageResponse.statusText}`)
              }
              
              // Check content type to ensure it's an image
              const contentType = imageResponse.headers.get('content-type')
              console.log('Content type from HEAD request:', contentType)
              
              if (!contentType || !contentType.startsWith('image/')) {
                console.error(`Invalid content type: ${contentType || 'none'}`)
                
                // Try a GET request instead as some CDNs don't return proper content type on HEAD
                console.log('Trying GET request for better content-type detection...')
                try {
                  const getResponse = await fetch(processedImageUrl, { 
                    method: 'GET',
                    headers: {
                      'Range': 'bytes=0-1024' // Just get the first KB to check the mime type
                    }
                  })
                  
                  const actualContentType = getResponse.headers.get('content-type')
                  console.log('Content type from GET request:', actualContentType)
                  
                  if (actualContentType && actualContentType.startsWith('image/')) {
                    console.log('GET request confirmed this is an image:', actualContentType)
                  } else {
                    throw new Error(`Invalid content type from GET request: ${actualContentType || 'none'}`)
                  }
                } catch (getError) {
                  console.error('Error during GET validation:', getError)
                  throw new Error(`Invalid content type: ${contentType || 'none'}`)
                }
              }
              
              console.log('Image URL validated successfully:', { 
                url: processedImageUrl.substring(0, 100) + '...', 
                contentType 
              })
              
              // For GPT-4 Vision API, we need to use a different format for messages with images
              console.log('Preparing Vision API message format with image URL:', processedImageUrl)
              
              // Use the Vision API format
              messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { 
                  role: 'user', 
                  content: [
                    { type: 'text', text: userMessage },
                    { 
                      type: 'image_url', 
                      image_url: {
                        url: processedImageUrl,
                        detail: 'low' // Use 'low' for faster processing
                      }
                    }
                  ]
                }
              ]
              
              // Use the Vision model
              model = 'gpt-4-vision-preview'
              console.log('Using GPT-4 Vision API for image processing')
            } catch (error) {
              console.error('Error processing image URL:', error)
              // Fall back to standard format if there's an error with the image URL
              messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: `${userMessage} (Note: There was an image attached but it could not be processed: ${error.message})` }
              ]
            }
          } else {
            // Standard messages format without image
            messages = [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userMessage }
            ]
          }
          
          // Log the model being used
          console.log('Using model:', model)
          
          // Create streaming completion with error handling
          let completion
          try {
            // Log the full request being sent to OpenAI
            console.log('Sending request to OpenAI with model:', model)
            console.log('Message format:', JSON.stringify(messages.map(m => {
              // Safely handle image URLs in logs to avoid excessive output
              if (Array.isArray(m.content)) {
                return {
                  ...m,
                  content: m.content.map(item => {
                    if (item.type === 'image_url' && item.image_url?.url) {
                      return { ...item, image_url: { ...item.image_url, url: item.image_url.url.substring(0, 100) + '...' } }
                    }
                    return item
                  })
                }
              }
              return m
            }), null, 2))
            
            // Add request timing logs
            console.log(`OpenAI API request started at: ${new Date().toISOString()}`)
            const requestStartTime = Date.now()
            
            // Make the API request
            completion = await openai.chat.completions.create({
              model: model,
              messages,
              stream: true,
              max_tokens: 1000
            })
            console.log('OpenAI API request successful')
          } catch (error) {
            console.error('Error from OpenAI API:', {
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              } : error,
              model,
              hasImage: !!imageUrl,
              userMessageLength: userMessage.length
            })
            
            // Instead of returning an HTTP error, stream the error to the client
            // This ensures the client can display the error message to the user
            const errorMessage = error instanceof Error ? error.message : 'Unknown OpenAI API error'
            
            // Log error details for debugging
            console.log('Streaming error to client:', errorMessage)
            
            // Stream the error as a special message
            controller.enqueue(`data: ${JSON.stringify({ error: errorMessage })}

`)
            controller.enqueue(`data: ${JSON.stringify({ done: true, error: true })}

`)
            controller.close()
            
            // Log the error to the conversation record since it's more reliable than a separate table
            try {
              await supabase
                .from('ai_coach_conversations')
                .update({
                  ai_response: `Error from OpenAI API: ${errorMessage}`,
                  error_message: errorMessage,
                  error_type: 'openai_api',
                  has_error: true,
                  has_image: !!imageUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentConversationId)
                .select('id')
              console.log('Error information saved to conversation record')
            } catch (dbError) {
              console.error('Failed to update conversation with error details:', dbError)
            }
            
            return // End execution after streaming the error
          }
          
          let fullResponse = ''
          
          // Process the streaming response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              
              // Send the chunk to the client
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
              
              // Update the database with the current response (periodically)
              if (fullResponse.length % 100 === 0) {
                await supabase
                  .from('ai_coach_conversations')
                  .update({ ai_response: fullResponse })
                  .eq('id', currentConversationId)
              }
            }
          }
          
          // Final update to the database with complete response
          console.log('Saving final response to database:', { 
            conversationId: currentConversationId, 
            responseLength: fullResponse.length,
            firstChunk: fullResponse.substring(0, 50) + '...',
            hasImage: !!imageUrl
          })
          
          const { data: updateData, error: updateError } = await supabase
            .from('ai_coach_conversations')
            .update({ 
              ai_response: fullResponse,
              // Generate a title if this is a new conversation
              title: conversationId ? undefined : fullResponse.split('.')[0].substring(0, 50),
              // Add additional metadata to track image processing
              has_image: !!imageUrl,
              updated_at: new Date().toISOString(),
              response_model: model
            })
            .eq('id', currentConversationId)
            .select('id, updated_at')
          
          if (updateError) {
            console.error('Failed to update conversation with final response:', updateError)
          } else {
            console.log('Successfully updated conversation:', updateData)
          }
          
          // Send completion signal
          controller.enqueue(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: currentConversationId 
          })}\n\n`)
        } catch (error) {
          controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        } finally {
          controller.close()
        }
      }
    })
    
    return new Response(stream, { headers })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
