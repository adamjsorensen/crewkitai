
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

      console.log("[useSendMessageMutation] Starting message send", {
        messageLength: userMessage.length,
        hasImage: !!imageUrl,
        conversationId
      });

      // Generate a unique ID for user message and assistant message
      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;
      
      // Add user message
      const userMessageObj: Message = {
        id: userMessageId,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        imageUrl
      };

      // Add placeholder message for assistant immediately
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: isThinkMode ? '...thinking deeply about your question...' : '...',
        timestamp: new Date(),
        isPlaceholder: true
      };

      console.log("[useSendMessageMutation] Adding user message and placeholder", {
        userMessageId,
        assistantMessageId,
        isPlaceholder: true,
        placeholderMessageState: JSON.stringify(placeholderMessage)
      });
      
      // Update state with both messages
      setMessages(prev => [...prev, userMessageObj, placeholderMessage]);
      
      try {
        console.log("[useSendMessageMutation] Calling edge function");
        
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: {
            message: userMessage,
            conversationId,
            imageUrl,
            isThinkMode
          }
        });
        
        if (error) {
          console.error("[useSendMessageMutation] Edge function error:", error);
          throw new Error(error.message);
        }

        console.log("[useSendMessageMutation] Response received:", {
          responseLength: data?.response?.length || 0,
          suggestedFollowUpsCount: data?.suggestedFollowUps?.length || 0,
          assistantMessageId
        });

        // Create a completely new array to trigger React's state update detection
        console.log("[useSendMessageMutation] Before message replacement:", 
          messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));

        // Now replace the placeholder with the real message in a completely new array
        setMessages(prevMessages => {
          // Important debugging for state transformation
          const placeholderIndex = prevMessages.findIndex(msg => msg.id === assistantMessageId);
          console.log(`[useSendMessageMutation] Replacing placeholder at index ${placeholderIndex}`);
          
          if (placeholderIndex === -1) {
            console.warn("[useSendMessageMutation] Could not find placeholder message to replace!");
          }
          
          const newMessages = prevMessages.map(message => {
            if (message.id === assistantMessageId) {
              console.log("[useSendMessageMutation] Found placeholder message, replacing with:", {
                id: assistantMessageId,
                oldContent: message.content,
                newContent: data.response.substring(0, 30) + "...",
                wasPlaceholder: message.isPlaceholder
              });
              
              // Create a completely new message object with all properties explicitly set
              return {
                id: assistantMessageId, // Keep the same ID for continuity
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: data.suggestedFollowUps || [],
                isPlaceholder: false, // No longer a placeholder
                isError: false,
                isSaved: false
              };
            }
            return message; // Leave other messages unchanged
          });
          
          console.log("[useSendMessageMutation] After replacement, message count:", newMessages.length);
          return newMessages;
        });
        
        console.log("[useSendMessageMutation] Message updated successfully");
        setIsThinkMode(false);
        
        return { 
          response: data.response, 
          suggestedFollowUps: data.suggestedFollowUps || [],
          assistantMessageId
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error:', error);
        
        // Update the placeholder to show an error message
        setMessages(prev => {
          return prev.map(message => {
            if (message.id === assistantMessageId) {
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
      console.error('[useSendMessageMutation] Error in mutation:', error);
      
      toast({
        title: "Error sending message",
        description: "Failed to get a response. Please try again in a few moments.",
        variant: "destructive"
      });
    }
  });
};
