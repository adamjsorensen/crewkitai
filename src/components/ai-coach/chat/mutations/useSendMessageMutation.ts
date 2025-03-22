
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
      
      // Verify the placeholder was added
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
          data
        });

        // Check response structure validity
        if (!data || typeof data.response !== 'string') {
          console.error("[useSendMessageMutation] Invalid response structure:", data);
          throw new Error("Invalid response structure received from server");
        }

        // Generate a consistent, deterministic ID for the assistant message
        const assistantMessageId = `assistant-${Date.now()}`;
        
        // Create the new assistant message
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date(),
          suggestedFollowUps: data.suggestedFollowUps || []
        };
        
        console.log("[useSendMessageMutation] Created new assistant message:", assistantMessageId);
        
        // Use a synchronized state update to replace the placeholder
        setMessages(prev => {
          // Log the current messages state before update
          console.log("[useSendMessageMutation] Current messages before update:", 
            prev.map(m => ({ id: m.id, role: m.role, isPlaceholder: !!m.isPlaceholder })));
          
          // Find if placeholder exists
          const hasPlaceholder = prev.some(m => m.id === currentPlaceholderId);
          
          if (!hasPlaceholder) {
            console.warn("[useSendMessageMutation] Placeholder not found in messages array!");
          }
          
          // Create a new array without the placeholder
          const filteredMessages = prev.filter(m => m.id !== currentPlaceholderId);
          
          // Return the new state with the assistant message added
          const newMessages = [...filteredMessages, assistantMessage];
          
          console.log("[useSendMessageMutation] New messages array:", 
            newMessages.map(m => ({ id: m.id, role: m.role })));
          
          return newMessages;
        });
        
        console.log("[useSendMessageMutation] Updated messages array with new assistant message", {
          assistantMessageId: assistantMessage.id,
          placeholderReplaced: currentPlaceholderId
        });
        
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || [],
          assistantMessageId: assistantMessage.id
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Create an error message to replace the placeholder
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: "I'm sorry, I couldn't process your request. Please try again.",
          timestamp: new Date(),
          isError: true
        };
        
        console.log("[useSendMessageMutation] Replacing placeholder with error message:", errorMessage.id);
        
        // Update messages in a single operation
        setMessages(prev => {
          const filteredMessages = prev.filter(m => m.id !== currentPlaceholderId);
          return [...filteredMessages, errorMessage];
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
