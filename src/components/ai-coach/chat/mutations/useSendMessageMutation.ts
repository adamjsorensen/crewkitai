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

      // Generate a unique ID for the assistant message placeholder
      const placeholderId = `assistant-placeholder-${Date.now()}`;
      
      // Create the placeholder message
      const placeholderMessage: Message = {
        id: placeholderId,
        role: 'assistant',
        content: isThinkMode ? '...thinking deeply about your question...' : '...',
        timestamp: new Date(),
        isPlaceholder: true 
      };
      
      console.log("[useSendMessageMutation] Creating placeholder message:", {
        id: placeholderId,
        isPlaceholder: true,
        content: placeholderMessage.content
      });
      
      // Add the placeholder in a synchronous update
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
          data: data ? JSON.stringify(data).substring(0, 200) + "..." : "no data"
        });

        // Check response structure validity
        if (!data || typeof data.response !== 'string') {
          console.error("[useSendMessageMutation] Invalid response structure:", data);
          throw new Error("Invalid response format received from server");
        }

        // Update the placeholder message to real message
        console.log("[useSendMessageMutation] Updating placeholder message to real message:", {
          placeholderId,
          responseLength: data.response.length,
          suggestedFollowUpsCount: (data.suggestedFollowUps || []).length
        });
        
        // First, verify the placeholder exists
        let placeholderExists = false;
        setMessages(prev => {
          placeholderExists = prev.some(m => m.id === placeholderId);
          console.log("[useSendMessageMutation] Placeholder exists:", placeholderExists);
          return prev;
        });
        
        // If placeholder doesn't exist, create a new message
        if (!placeholderExists) {
          console.log("[useSendMessageMutation] Placeholder not found, creating new message");
          const newMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            suggestedFollowUps: data.suggestedFollowUps || [],
            isPlaceholder: false
          };
          
          setMessages(prev => [...prev, newMessage]);
          setIsThinkMode(false);
          
          return {
            response: data.response,
            suggestedFollowUps: data.suggestedFollowUps || [],
            assistantMessageId: newMessage.id
          };
        }
        
        // Update the placeholder in-place with the real message content
        setMessages(prev => {
          const updatedMessages = prev.map(message => {
            // If this is our placeholder message, replace its content
            if (message.id === placeholderId) {
              console.log(`[useSendMessageMutation] Transforming placeholder ${placeholderId} into real message`);
              
              // Create the updated message with all properties
              const updatedMessage: Message = {
                ...message,
                content: data.response,
                isPlaceholder: false, // Remove the placeholder flag
                suggestedFollowUps: data.suggestedFollowUps || [],
                timestamp: new Date() // Update timestamp to current time
              };

              console.log("[useSendMessageMutation] Updated message:", {
                id: updatedMessage.id,
                isPlaceholder: updatedMessage.isPlaceholder,
                contentLength: updatedMessage.content.length,
                hasSuggestions: !!(updatedMessage.suggestedFollowUps && updatedMessage.suggestedFollowUps.length > 0)
              });
              
              return updatedMessage;
            }
            
            // Return other messages unchanged
            return message;
          });
          
          return updatedMessages;
        });
        
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || [],
          assistantMessageId: placeholderId // Return the placeholder ID as it was kept
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Update the placeholder to show an error instead of removing it
        setMessages(prev => {
          return prev.map(message => {
            if (message.id === placeholderId) {
              console.log(`[useSendMessageMutation] Transforming placeholder ${placeholderId} into error message`);
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
