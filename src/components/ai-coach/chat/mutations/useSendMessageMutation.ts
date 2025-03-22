
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../types';
import { User } from '@supabase/supabase-js';

interface SendMessageParams {
  userMessage: string;
  imageUrl: string | null;
  isThinkMode: boolean;
  user: User;
  messages: Message[];
  conversationId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onConversationCreated?: (id: string) => void;
}

export const useSendMessageMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userMessage,
      imageUrl,
      isThinkMode,
      user,
      messages,
      conversationId,
      setMessages,
      setIsThinkMode,
      onConversationCreated
    }: SendMessageParams) => {
      if (!user) throw new Error("No user logged in");

      // Add detailed logging
      console.log("[useSendMessageMutation] Starting message send:", {
        messageLength: userMessage.length,
        hasImage: !!imageUrl,
        conversationId,
        thinkMode: isThinkMode
      });

      // Add placeholder assistant message to UI immediately for better UX
      const placeholderId = `assistant-placeholder-${Date.now()}`;
      const placeholderMessage: Message = {
        id: placeholderId,
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
        isPlaceholder: true
      };
      
      setMessages(prev => [...prev, placeholderMessage]);

      try {
        console.log("[useSendMessageMutation] Calling edge function");
        
        // Simple call to the edge function - minimal parameters for testing
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: {
            message: userMessage
          }
        });

        if (error) {
          console.error("[useSendMessageMutation] Error from edge function:", error);
          throw new Error(error.message);
        }

        console.log("[useSendMessageMutation] Response from edge function:", data);

        // Replace placeholder with actual response
        setMessages(prev => prev.map(msg => {
          if (msg.id === placeholderId) {
            return {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              suggestedFollowUps: data.suggestedFollowUps || []
            };
          }
          return msg;
        }));
        
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || []
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Show error in UI by replacing placeholder
        setMessages(prev => prev.map(msg => {
          if (msg.id === placeholderId) {
            return {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: "I'm sorry, I couldn't process your request. Please try again.",
              timestamp: new Date(),
              isError: true
            };
          }
          return msg;
        }));
        
        throw error;
      }
    },
    onError: (error) => {
      console.error('[useSendMessageMutation] Final error:', error);
      
      toast({
        title: "Error sending message",
        description: "Failed to get a response. Please try again in a few moments.",
        variant: "destructive"
      });
    }
  });
};
