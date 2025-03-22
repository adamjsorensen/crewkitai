
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
        initialMessagesCount: messages.length
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

        // Create a completely new array to trigger React's state update detection
        console.log("[useSendMessageMutation] Before replacing placeholder message. Current messages state:", 
          messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));

        // Now replace the placeholder with the real message in a completely new array
        setMessages(prevMessages => {
          // Important debugging for state transformation
          const placeholderIndex = prevMessages.findIndex(msg => msg.id === assistantMessageId);
          console.log(`[useSendMessageMutation] Attempting to replace placeholder at index ${placeholderIndex}`, {
            totalMessages: prevMessages.length,
            messagesIds: prevMessages.map(m => m.id),
            hasPlaceholder: prevMessages.some(m => m.isPlaceholder && m.id === assistantMessageId)
          });
          
          if (placeholderIndex === -1) {
            console.warn("[useSendMessageMutation] ⚠️ Could not find placeholder message to replace!");
            // Add the message anyway at the end
            return [...prevMessages, {
              id: assistantMessageId,
              role: 'assistant' as const,
              content: data.response,
              timestamp: new Date(),
              suggestedFollowUps: data.suggestedFollowUps || [],
              isPlaceholder: false,
              isError: false,
              isSaved: false
            } as Message];
          }
          
          const newMessages = prevMessages.map(message => {
            if (message.id === assistantMessageId) {
              console.log("[useSendMessageMutation] Found placeholder message, replacing with:", {
                id: assistantMessageId,
                oldContent: message.content?.substring(0, 20) + "...",
                newContent: data.response.substring(0, 20) + "...",
                wasPlaceholder: message.isPlaceholder
              });
              
              // Create a completely new message object with all properties explicitly set
              // and ensure the role is strictly typed as 'assistant'
              return {
                id: assistantMessageId, // Keep the same ID for continuity
                role: 'assistant' as const, // Explicitly type as 'assistant'
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: data.suggestedFollowUps || [],
                isPlaceholder: false, // No longer a placeholder
                isError: false,
                isSaved: false
              } as Message; // Explicitly cast to Message type
            }
            return message; // Leave other messages unchanged
          });
          
          console.log("[useSendMessageMutation] After replacement, message count:", {
            newCount: newMessages.length,
            hasPlaceholder: newMessages.some(m => m.isPlaceholder),
            lastMessage: newMessages[newMessages.length - 1].id,
            placeholderContent: newMessages.find(m => m.id === assistantMessageId)?.content?.substring(0, 20) + "..."
          });
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
        
        // Log all messages before updating
        console.log('[useSendMessageMutation] Messages before error state update:', 
          messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));
        
        // Update the placeholder to show an error message
        setMessages(prev => {
          const hasPlaceholder = prev.some(m => m.id === assistantMessageId && m.isPlaceholder);
          console.log(`[useSendMessageMutation] Updating message to error state. Has placeholder: ${hasPlaceholder}`);
          
          return prev.map(message => {
            if (message.id === assistantMessageId) {
              console.log(`[useSendMessageMutation] Updating message ${message.id} to error state`);
              return {
                ...message,
                content: "I'm sorry, I couldn't process your request. Please try again.",
                isPlaceholder: false,
                isError: true,
                timestamp: new Date()
              } as Message; // Explicitly cast to Message type
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
