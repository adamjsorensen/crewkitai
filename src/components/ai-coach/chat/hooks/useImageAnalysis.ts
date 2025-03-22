
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';

interface UseImageAnalysisProps {
  user: User | null;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setError: (error: string | null) => void;
  scrollToBottom: () => void;
}

export const useImageAnalysis = ({
  user,
  conversationId,
  onConversationCreated,
  setMessages,
  setError,
  scrollToBottom
}: UseImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debug logging function with stack trace
  const logDebug = (message: string, data?: any) => {
    const stack = new Error().stack;
    console.log(`[ImageAnalysis] ${message}`, {
      data: data || '',
      timestamp: new Date().toISOString(),
      stack: stack?.split('\n').slice(2).join('\n')
    });
  };
  
  // Error logging function
  const logError = (message: string, error: any) => {
    console.error(`[ImageAnalysis:Error] ${message}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
  };

  const analyzeImage = useCallback(async (prompt: string, imageUrl: string) => {
    if (!user?.id) {
      logError('Analysis failed - No user ID', { user });
      setError('Authentication required to analyze images');
      return null;
    }

    try {
      setIsAnalyzing(true);
      logDebug('Starting image analysis', { 
        promptLength: prompt.length,
        imageUrlSample: imageUrl.substring(0, 50) + '...',
        userId: user.id
      });

      // Add user message to UI
      const userMessageId = uuidv4();
      setMessages(prev => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: prompt,
          timestamp: new Date(),
          imageUrl
        }
      ]);

      // Add placeholder AI message
      const aiMessageId = uuidv4();
      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          role: 'assistant',
          content: 'Analyzing your image...',
          timestamp: new Date(),
          isLoading: true
        }
      ]);

      // Scroll to bottom to show loading message
      setTimeout(scrollToBottom, 50);

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Call the vision-analysis edge function
      logDebug('Calling vision-analysis edge function');
      const response = await supabase.functions.invoke('vision-analysis', {
        body: {
          imageUrl,
          prompt,
          userId: user.id,
          conversationId
        }
      });

      if (response.error) {
        throw new Error(`Edge function error: ${response.error}`);
      }

      const { analysis, conversationId: newConversationId } = response.data as { 
        analysis: string;
        conversationId: string;
      };

      // Notify about new conversation if needed
      if (!conversationId && onConversationCreated && newConversationId) {
        logDebug('New conversation created', { newConversationId });
        onConversationCreated(newConversationId);
      }

      // Update AI message with analysis
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: analysis, isLoading: false } 
            : msg
        )
      );

      logDebug('Image analysis completed successfully');
      return newConversationId || conversationId;
    } catch (error) {
      logError('Image analysis failed', error);
      
      // Update error message in UI
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isLoading) {
          return prev.map(msg => 
            msg.id === lastMessage.id 
              ? { 
                  ...msg, 
                  content: `Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                  isLoading: false,
                  error: true
                } 
              : msg
          );
        }
        return prev;
      });
      
      setError(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsAnalyzing(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [user, conversationId, onConversationCreated, setMessages, setError, scrollToBottom]);

  return {
    analyzeImage,
    isAnalyzing
  };
};
