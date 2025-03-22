import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';

interface StreamingChatProps {
  user: User | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  scrollToBottom: () => void;
  setIsThinkMode: (isThinking: boolean) => void;
}

export const useStreamingChat = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  scrollToBottom,
  setIsThinkMode
}: StreamingChatProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingMsgIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debug logging function with error stack
  const logDebug = (message: string, data?: any) => {
    const stack = new Error().stack;
    console.log(`[StreamingChat] ${message}`, {
      data: data || '',
      timestamp: new Date().toISOString(),
      stack: stack?.split('\n').slice(2).join('\n')
    });
  };
  
  // Enhanced debug logging for image handling
  const logImageDebug = (message: string, imageUrl?: string) => {
    const stack = new Error().stack;
    console.log(`[StreamingChat:Image] ${message}`, {
      imageUrl: imageUrl ? imageUrl.substring(0, 50) + '...' : '',
      timestamp: new Date().toISOString(),
      stack: stack?.split('\n').slice(2).join('\n')
    });
  };
  
  // Error logging function
  const logError = (message: string, error: any) => {
    console.error(`[StreamingChat:Error] ${message}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
  };

  // Helper to update streaming message content
  const updateStreamingMessage = useCallback((content: string) => {
    if (!streamingMsgIdRef.current) return;
    
    setMessages(prevMessages => {
      return prevMessages.map(msg => 
        msg.id === streamingMsgIdRef.current 
          ? { ...msg, content, isStreaming: true }
          : msg
      );
    });
    
    // Scroll to bottom with each update
    setTimeout(() => scrollToBottom(), 10);
  }, [setMessages, scrollToBottom]);

  // Function to send a message using streaming
  const sendStreamingMessage = useCallback(async (userMessage: string, imageUrl?: string) => {
    try {
      setIsLoading(true);
      setIsStreaming(true);
      setIsThinkMode(true);
      logDebug('Sending streaming message', { userMessage });
      
      // Validate user message
      if (!userMessage.trim() && !imageUrl) {
        throw new Error('Message cannot be empty when no image is provided');
      }
      
      if (imageUrl) {
        logImageDebug('Message includes image', imageUrl);
        try {
          // Validate image URL
          const imageUrlObj = new URL(imageUrl);
          if (!imageUrlObj.protocol.startsWith('http')) {
            throw new Error('Invalid image URL protocol');
          }
        } catch (error) {
          throw new Error(`Invalid image URL: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
      }

      // Abort any ongoing stream
      if (abortControllerRef.current) {
        logDebug('Aborting previous stream');
        abortControllerRef.current.abort();
      }

      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Create or use conversation ID
      const currentConversationId = conversationId || uuidv4();
      if (!conversationId && onConversationCreated) {
        logDebug('Creating new conversation', currentConversationId);
        onConversationCreated(currentConversationId);
      }

      // Create a message ID for the streaming response
      streamingMsgIdRef.current = uuidv4();
      logDebug('Created streaming message ID', streamingMsgIdRef.current);

      // Add initial empty assistant message
      const assistantMessage: Message = {
        id: streamingMsgIdRef.current,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Get Supabase auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication token not available');
      }

      // Validate user ID
      if (!user?.id) {
        throw new Error('User ID not available');
      }

      // Call Supabase Edge Function for streaming
      const requestBody = {
        userMessage: userMessage.trim(),
        conversationId: currentConversationId,
        userId: user.id,
        imageUrl
      };
      
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stream-chat`;
      
      logDebug('Sending request to edge function', { 
        endpoint: edgeFunctionUrl,
        requestBody: { ...requestBody, imageUrl: imageUrl ? 'present' : 'not present' }
      });
      
      const response = await fetch(
        edgeFunctionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
          signal
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        logDebug('Error response from edge function', { 
          status: response.status, 
          statusText: response.statusText, 
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Edge function error (${response.status}): ${errorText}`);
      }
      
      logDebug('Received successful response from edge function');

      // Check if the response is expected to be a stream
      if (!response.body) {
        throw new Error('Response body is null, streaming not supported');
      }

      logDebug('Stream response received, processing chunks');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalContent = '';

      // Process the stream
      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalContent = '';
        let isFirstChunk = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Validate first chunk to ensure it's a proper response
          if (isFirstChunk) {
            isFirstChunk = false;
            if (chunk.includes('error') || chunk.includes('Error')) {
              throw new Error(`Stream error: ${chunk}`);
            }
          }
          
          finalContent += chunk;
          logDebug('Received chunk', { chunkLength: chunk.length });
          
          // Update the UI with the accumulated content
          updateStreamingMessage(finalContent);
        }

        logDebug('Stream completed, finalizing message');

        // Validate final content
        if (!finalContent.trim()) {
          throw new Error('Received empty response from stream');
        }

        // Replace streaming message with final version
        if (streamingMsgIdRef.current) {
          setMessages(prevMessages => {
            return prevMessages.map(msg => 
              msg.id === streamingMsgIdRef.current 
                ? { ...msg, content: finalContent, isStreaming: false }
                : msg
            );
          });
          
          // No need to save to the database manually as the Edge Function does this
          logDebug('Streaming completed', { 
            messageId: streamingMsgIdRef.current,
            contentLength: finalContent.length,
            hasImage: !!imageUrl
          });
        }
      } catch (streamError) {
        logDebug('Error processing stream', streamError);
        throw streamError; // Re-throw to be caught by outer try-catch
      }

    } catch (error) {
      logError('Caught error in sendStreamingMessage', error);
      
      // Enhanced error handling
      let errorMessage = 'Unknown error';
      let errorDetails: any = {};
      
      if (error instanceof Error) {
        errorMessage = error.message || 'Error without message';
        errorDetails = {
          name: error.name || 'UnknownError',
          message: error.message || 'No message available',
          stack: error.stack || 'No stack available',
          // TypeScript in some configurations doesn't recognize Error.cause
          // Use type assertion to access it safely
          cause: (error as any).cause
        };
      } else if (error !== null && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
          errorDetails = error;
        } catch (jsonError) {
          errorMessage = 'Error object could not be stringified';
          errorDetails = { unserializableError: true };
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorDetails = { stringError: error };
      } else {
        errorMessage = 'Unexpected error type';
        errorDetails = { unexpectedType: typeof error };
      }
      
      // Add information about response status if available
      if (typeof window !== 'undefined' && window.navigator && !window.navigator.onLine) {
        errorMessage = 'Your internet connection appears to be offline. Please check your connection and try again.';
        errorDetails.offline = true;
      }
      
      if (errorMessage.includes('AbortError')) {
        logDebug('Stream aborted');
        return; // Don't show error message for aborted requests
      }
      
      logDebug('Error in streaming message', { 
        errorMessage, 
        errorDetails, 
        errorType: typeof error,
        isErrorInstance: error instanceof Error
      });
      
      // Add error message if stream failed
      if (streamingMsgIdRef.current) {
        setMessages(prevMessages => {
          return prevMessages.map(msg => 
            msg.id === streamingMsgIdRef.current 
              ? { 
                  ...msg, 
                  content: `Sorry, there was an error generating a response: ${errorMessage}`, 
                  isStreaming: false,
                  error: true, // Just set a boolean flag for the UI
                  errorInfo: errorDetails // Store full details for debugging
                }
              : msg
          );
        });
        
        // Provide a more user-friendly error message
        setError(`Failed to generate a response: ${errorMessage}`);
        
        // Log the error to console for debugging
        console.error('Error sending message:', errorDetails);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setIsThinkMode(false);
      streamingMsgIdRef.current = null;
      abortControllerRef.current = null;
      logDebug('Streaming request completed');
      // One final scroll to ensure we're at the bottom
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [user, setMessages, conversationId, onConversationCreated, setIsLoading, setError, updateStreamingMessage, setIsThinkMode, scrollToBottom]);

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      logDebug('Manually cancelling stream');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    sendStreamingMessage,
    cancelStreaming,
    isStreaming
  };
};