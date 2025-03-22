
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../types';

interface UseRegenerateMessageProps {
  user: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  conversationId: string | null;
}

export const useRegenerateMessage = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId
}: UseRegenerateMessageProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const regenerateMutation = useMutation({
    mutationFn: async ({ 
      messageId, 
      userMessageContent 
    }: { 
      messageId: string; 
      userMessageContent: string 
    }) => {
      if (!user) throw new Error("No user logged in");

      const assistantMessageIndex = messages.findIndex(msg => msg.id === messageId);
      if (assistantMessageIndex <= 0) throw new Error("Invalid message to regenerate");

      let userMessageIndex = assistantMessageIndex - 1;
      while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) throw new Error("No user message found to regenerate response");

      const conversationContext = messages
        .filter(msg => msg.id !== 'welcome')
        .slice(0, userMessageIndex)
        .slice(-5)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: userMessageContent,
          userId: user.id,
          context: conversationContext,
          conversationId
        }
      });

      if (error) throw new Error(error.message);

      return { 
        response: data.response, 
        messageId,
        userMessageIndex,
        assistantMessageIndex 
      };
    },
    onSuccess: async ({ response, messageId, assistantMessageIndex }) => {
      if (!user) return;

      const aiResponse: Message = {
        id: `assistant-regenerated-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.splice(assistantMessageIndex, 1);
        newMessages.splice(assistantMessageIndex, 0, aiResponse);
        return newMessages;
      });
      
      if (conversationId) {
        try {
          const dbIdMatch = messageId.match(/assistant-(.+)/);
          if (dbIdMatch && dbIdMatch[1]) {
            const dbId = dbIdMatch[1];
            await supabase
              .from('ai_coach_conversations')
              .update({ ai_response: response })
              .eq('id', dbId);
            
            queryClient.invalidateQueries({ 
              queryKey: ['conversationHistory', conversationId] 
            });
          }
        } catch (error) {
          console.error('Error updating regenerated message in database:', error);
        }
      }

      toast({
        title: "Response regenerated",
        description: "Created a new response for you"
      });
    },
    onError: (error) => {
      console.error('Error regenerating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate response');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate the response. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0 || messages[messageIndex].role !== 'assistant') {
      toast({
        title: "Error",
        description: "Invalid message to regenerate",
        variant: "destructive"
      });
      return;
    }
    
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) {
      toast({
        title: "Error",
        description: "No user message found to regenerate from",
        variant: "destructive"
      });
      return;
    }
    
    const userMessage = messages[userMessageIndex];
    
    setIsLoading(true);
    setError(null);
    
    regenerateMutation.mutate({ 
      messageId, 
      userMessageContent: userMessage.content 
    });
  }, [messages, regenerateMutation, setIsLoading, setError, toast]);

  return {
    handleRegenerateMessage
  };
};
