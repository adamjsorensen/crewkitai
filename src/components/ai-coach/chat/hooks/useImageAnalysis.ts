
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

  // More concise debug logging function
  const logDebug = (message: string, data?: any) => {
    console.log(`[ImageAnalysis] ${message}`, data || '');
  };
  
  const logError = (message: string, error: any) => {
    console.error(`[ImageAnalysis:Error] ${message}`, error);
  };

  const analyzeImage = useCallback(async (prompt: string, imageUrl: string) => {
    if (!user?.id) {
      logError('Analysis failed - No user ID', { user });
      setError('Authentication required to analyze images');
      return null;
    }

    logDebug('Starting image analysis', { prompt, imageUrl: imageUrl.substring(0, 30) + '...' });

    try {
      setIsAnalyzing(true);

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
      
      logDebug('Calling ai-coach edge function with image', {
        promptLength: prompt.length,
        imageUrlLength: imageUrl.length
      });
      
      // Use the main ai-coach edge function with image URL
      const response = await supabase.functions.invoke('ai-coach', {
        body: {
          message: prompt || 'Please analyze this image.',
          imageUrl,
          userId: user.id,
          context: [],
          conversationId
        }
      });

      if (response.error) {
        throw new Error(`Edge function error: ${response.error.message || JSON.stringify(response.error)}`);
      }

      const { response: analysis, conversationId: newConversationId } = response.data as { 
        response: string;
        conversationId: string;
      };

      logDebug('Successfully processed image analysis', {
        analysisLength: analysis.length,
        newConversationId
      });

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
