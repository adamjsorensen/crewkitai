
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

  const analyzeImage = useCallback(async (prompt: string, imageUrl: string) => {
    if (!user?.id) {
      setError('Authentication required to analyze images');
      return null;
    }

    try {
      setIsAnalyzing(true);

      // Generate IDs once to avoid multiple calls to uuidv4()
      const userMessageId = uuidv4();
      const aiMessageId = uuidv4();
      
      // Batch state updates for better performance
      setMessages(prev => [
        ...prev,
        // Add user message with image
        {
          id: userMessageId,
          role: 'user',
          content: prompt,
          timestamp: new Date(),
          imageUrl
        },
        // Add placeholder AI message
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

      // Notify about new conversation if needed
      if (!conversationId && onConversationCreated && newConversationId) {
        onConversationCreated(newConversationId);
      }

      // Update AI message with analysis - use functional state update
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: analysis, isLoading: false } 
            : msg
        )
      );

      return newConversationId || conversationId;
    } catch (error) {
      // Update error message in UI with a single state update
      setMessages(prev => {
        // Find the loading message
        const lastIndex = prev.findIndex(msg => msg.isLoading);
        if (lastIndex >= 0) {
          const newMessages = [...prev];
          newMessages[lastIndex] = { 
            ...newMessages[lastIndex], 
            content: `Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            isLoading: false,
            error: true
          };
          return newMessages;
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
