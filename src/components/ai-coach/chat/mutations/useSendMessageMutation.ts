
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
        thinkMode: isThinkMode,
        messagesCount: messages.length
      });

      // Add placeholder assistant message to UI immediately for better UX
      const placeholderId = `assistant-placeholder-${Date.now()}`;
      const placeholderMessage: Message = {
        id: placeholderId,
        role: 'assistant',
        content: isThinkMode ? '...thinking deeply about your question...' : '...',
        timestamp: new Date(),
        isPlaceholder: true
      };
      
      console.log("[useSendMessageMutation] Adding placeholder message:", placeholderId);
      setMessages(prev => [...prev, placeholderMessage]);

      try {
        console.log("[useSendMessageMutation] Calling edge function with payload:", {
          messageLength: userMessage.length,
          conversationId,
          hasImage: !!imageUrl,
          isThinkMode
        });
        
        const startTime = performance.now();
        // Call the edge function with all necessary data
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: {
            message: userMessage,
            conversationId,
            imageUrl,
            isThinkMode
          }
        });
        const endTime = performance.now();
        const apiTime = endTime - startTime;

        if (error) {
          console.error("[useSendMessageMutation] Error from edge function:", error);
          throw new Error(error.message);
        }

        console.log("[useSendMessageMutation] Response from edge function:", {
          responseTime: `${apiTime.toFixed(0)}ms`,
          responseLength: data?.response?.length || 0,
          suggestedFollowUps: data?.suggestedFollowUps?.length || 0,
          data: data // Log the full response structure
        });

        // Check response structure validity
        if (!data || typeof data.response !== 'string') {
          console.error("[useSendMessageMutation] Invalid response structure:", data);
          throw new Error("Invalid response structure received from server");
        }

        console.log("[useSendMessageMutation] Replacing placeholder with actual response for:", placeholderId);
        
        // Replace placeholder with actual response
        setMessages(prev => {
          const updatedMessages = prev.map(msg => {
            if (msg.id === placeholderId) {
              return {
                id: `assistant-${Date.now()}`,
                role: 'assistant' as const, // Explicit type assertion
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: data.suggestedFollowUps || []
              };
            }
            return msg;
          });
          
          console.log("[useSendMessageMutation] Messages after update:", {
            previousCount: prev.length,
            newCount: updatedMessages.length,
            placeholderReplaced: prev.length === updatedMessages.length,
            lastMessage: updatedMessages[updatedMessages.length - 1]
          });
          
          return updatedMessages;
        });
        
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || []
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Show error in UI by replacing placeholder
        console.log("[useSendMessageMutation] Replacing placeholder with error message");
        setMessages(prev => prev.map(msg => {
          if (msg.id === placeholderId) {
            return {
              id: `error-${Date.now()}`,
              role: 'assistant' as const, // Explicit type assertion
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
