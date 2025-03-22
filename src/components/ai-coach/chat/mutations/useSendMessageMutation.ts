
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
        conversationId,
        initialMessagesCount: messages.length,
        messagesPreview: messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: !!m.isPlaceholder }))
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
        placeholderContent: placeholderMessage.content,
        messagesCountBefore: messages.length
      });
      
      // Update state with both messages
      setMessages(prev => {
        const newMessages = [...prev, userMessageObj, placeholderMessage];
        console.log("[useSendMessageMutation] Updated messages array after adding user and placeholder:", {
          newCount: newMessages.length,
          placeholderIndex: newMessages.findIndex(m => m.id === assistantMessageId),
          lastMessage: newMessages[newMessages.length - 1].id,
          hasPlaceholder: newMessages.some(m => m.isPlaceholder)
        });
        return newMessages;
      });
      
      try {
        console.log("[useSendMessageMutation] Calling edge function with:", {
          messageLength: userMessage.length,
          hasConversationId: !!conversationId,
          isThinkMode
        });
        
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
          assistantMessageId,
          responseFirstChars: data?.response?.substring(0, 50) + "..."
        });

        // Critical fix: Create a completely new array with the placeholder replaced
        setMessages(prevMessages => {
          console.log("[useSendMessageMutation] Before replacing placeholder. Current state:", 
              prevMessages.map(m => ({ id: m.id, role: m.role, isPlaceholder: !!m.isPlaceholder })));
          
          const placeholderIndex = prevMessages.findIndex(msg => msg.id === assistantMessageId);
          
          if (placeholderIndex === -1) {
            console.error("[useSendMessageMutation] CRITICAL ERROR: Could not find placeholder to replace!");
            // Add as new message since we can't find the placeholder
            return [
              ...prevMessages,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: data.suggestedFollowUps || [],
                isPlaceholder: false
              }
            ];
          }
          
          // Create a completely new array to ensure React detects the change
          const updatedMessages = [
            ...prevMessages.slice(0, placeholderIndex),
            {
              id: assistantMessageId,
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              suggestedFollowUps: data.suggestedFollowUps || [],
              isPlaceholder: false,
              isError: false,
              isSaved: false
            },
            ...prevMessages.slice(placeholderIndex + 1)
          ];
          
          console.log("[useSendMessageMutation] After replacement:", {
            originalLength: prevMessages.length,
            newLength: updatedMessages.length,
            replacedMessageId: assistantMessageId,
            placeholderFound: placeholderIndex !== -1,
            contentPreview: data.response.substring(0, 30) + "...",
            messagesPreview: updatedMessages.map(m => ({ 
              id: m.id, 
              role: m.role, 
              isPlaceholder: !!m.isPlaceholder,
              contentLength: m.content?.length || 0 
            }))
          });
          
          return updatedMessages;
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
        
        // Log all messages before updating
        console.log('[useSendMessageMutation] Messages before error state update:', 
          messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: !!m.isPlaceholder })));
        
        // Update the placeholder to show an error message with a new array reference
        setMessages(prev => {
          const updatedMessages = prev.map(message => {
            if (message.id === assistantMessageId) {
              console.log(`[useSendMessageMutation] Updating message ${message.id} to error state`);
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
          
          return updatedMessages;
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
