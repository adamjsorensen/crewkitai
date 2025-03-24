
import { useCallback, useState } from 'react';
import { Message } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

interface UseImageAnalysisProps {
  user: any;
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
  const { toast } = useToast();

  const analyzeImage = useCallback(async (text: string, imageUrl: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze images.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[useImageAnalysis] Starting image analysis', { 
        hasText: !!text, 
        imageUrlLength: imageUrl.length,
        conversationId
      });
      
      setIsAnalyzing(true);
      
      // Add user message with image
      const userMessageId = `user-${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: text,
        imageUrl,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add assistant placeholder response
      const responseMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: responseMessageId,
        role: 'assistant',
        content: "Analyzing your image...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll to show the loading message
      setTimeout(() => scrollToBottom(), 100);
      
      console.log('[useImageAnalysis] Calling AI function to analyze image');
      
      // Call the Supabase Edge Function to analyze the image
      const { data, error: functionError } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: text,
          imageUrl,
          userId: user.id,
          conversationId
        }
      });
      
      if (functionError) {
        console.error('[useImageAnalysis] Edge function error:', functionError);
        throw new Error(functionError.message);
      }
      
      console.log('[useImageAnalysis] Received analysis response:', {
        responseLength: data?.response?.length || 0,
        imageProcessed: data?.imageProcessed,
        newConversationId: data?.conversationId
      });
      
      // Update the assistant message with the analysis
      setMessages(prev => prev.map(msg => {
        if (msg.id === responseMessageId) {
          return {
            ...msg,
            content: data.response
          };
        }
        return msg;
      }));
      
      // If this is a new conversation, update the conversation ID
      if (!conversationId && data.conversationId && onConversationCreated) {
        console.log('[useImageAnalysis] New conversation created:', data.conversationId);
        onConversationCreated(data.conversationId);
      }
      
      // Scroll to show the complete response
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error) {
      console.error('[useImageAnalysis] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, conversationId, onConversationCreated, setMessages, setError, scrollToBottom, toast]);

  return { analyzeImage, isAnalyzing };
};
