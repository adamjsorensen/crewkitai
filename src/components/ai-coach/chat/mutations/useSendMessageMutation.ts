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

interface SendMessageResult {
  response: string;
  suggestedFollowUps: string[];
  assistantMessageId: string;
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
    }: SendMessageParams): Promise<SendMessageResult> => {
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
      
      // Using a separate variable to track the placeholder ID
      let currentPlaceholderId = placeholderId;
      
      // Add the placeholder in a synchronous update
      setMessages(prev => [...prev, placeholderMessage]);
      
      // Debug: Verify the placeholder was added
      console.log("[useSendMessageMutation] Placeholder added, now calling edge function");

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
          data: JSON.stringify(data).substring(0, 200) + "..."
        });

        // Check response structure validity
        if (!data || typeof data.response !== 'string') {
          console.error("[useSendMessageMutation] Invalid response structure:", data);
          throw new Error("Invalid response format received from server");
        }

        // CRITICAL SECTION: Update the placeholder message to real message
        console.log("[useSendMessageMutation] Before transformation, placeholder ID:", currentPlaceholderId);
        
        // Debug: Check current messages before update
        console.log("[useSendMessageMutation] Current messages before update:", 
          messages.map(m => ({ 
            id: m.id, 
            role: m.role, 
            isPlaceholder: m.isPlaceholder,
            contentLength: m.content.length 
          }))
        );
        
        // Instead of removing placeholder and adding new message,
        // we'll update the placeholder in-place
        setMessages(prev => {
          const updatedMessages = prev.map(message => {
            // If this is our placeholder message, transform it into the real message
            if (message.id === currentPlaceholderId) {
              console.log(`[useSendMessageMutation] Transforming placeholder ${currentPlaceholderId} into real message:`, {
                before: {
                  isPlaceholder: message.isPlaceholder,
                  contentLength: message.content.length,
                  hasProps: {
                    suggestedFollowUps: !!message.suggestedFollowUps,
                  }
                },
                after: {
                  isPlaceholder: false,
                  contentLength: data.response.length,
                  hasProps: {
                    suggestedFollowUps: !!(data.suggestedFollowUps || []).length,
                  }
                }
              });
              
              return {
                ...message,
                content: data.response,
                isPlaceholder: false, // Remove placeholder flag
                suggestedFollowUps: data.suggestedFollowUps || [],
                timestamp: new Date() // Update timestamp to current time
              };
            }
            // Return all other messages unchanged
            return message;
          });
          
          // Debug: Verify message transformation
          console.log("[useSendMessageMutation] After transformation, messages:", 
            updatedMessages.map(m => ({ 
              id: m.id, 
              role: m.role, 
              isPlaceholder: m.isPlaceholder,
              contentLength: m.content.length,
              hasSuggestions: !!(m.suggestedFollowUps && m.suggestedFollowUps.length > 0)
            }))
          );
          
          return updatedMessages;
        });
        
        console.log("[useSendMessageMutation] Transformed placeholder into real message", {
          placeholderId: currentPlaceholderId
        });
        
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || [],
          assistantMessageId: currentPlaceholderId // Return the same ID since we kept it
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Update the placeholder to show an error instead of replacing it
        setMessages(prev => {
          return prev.map(message => {
            if (message.id === currentPlaceholderId) {
              console.log(`[useSendMessageMutation] Transforming placeholder ${currentPlaceholderId} into error message`);
              return {
                ...message,
                content: "I'm sorry, I couldn't process your request. Please try again.",
                isPlaceholder: false,
                isError: true,
                timestamp: new Date()
              };
            }
            return message;
          });
        });
        
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
