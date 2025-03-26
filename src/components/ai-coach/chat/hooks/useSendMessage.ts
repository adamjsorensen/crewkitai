
import { useCallback } from 'react';
import { Message } from '../types';
import { User } from '@supabase/supabase-js';
import { useSendMessageMutation } from '../mutations/useSendMessageMutation';
import { useImageUpload } from './useImageUpload';
import { useLogActivity } from '@/hooks/useLogActivity';

interface UseSendMessageProps {
  user: User | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSendMessage = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  uploadImage,
  removeImage,
  setIsThinkMode
}: UseSendMessageProps) => {
  const { handleImageUpload } = useImageUpload({
    user,
    setMessages,
    uploadImage,
    removeImage
  });
  
  // Use the message mutation
  const sendMessageMutation = useSendMessageMutation();
  // Use the activity logging hook
  const { logChatMessage, logChatResponse } = useLogActivity();

  const handleSendMessage = useCallback(async (input: string, imageFile: File | null, isThinkMode: boolean) => {
    if ((!input.trim() && !imageFile) || !user) {
      console.error('[useSendMessage] No input, image, or user');
      return null;
    }
    
    console.log('[useSendMessage] Starting send message process', {
      inputLength: input.length,
      hasImage: !!imageFile,
      isThinkMode,
      currentMessageCount: messages.length,
      messagesContentPreview: messages.map(m => ({ 
        id: m.id, 
        role: m.role, 
        isPlaceholder: !!m.isPlaceholder,
        contentLength: m.content?.length || 0
      }))
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle image upload if present
      let imageUrl: string | null = null;
      
      if (imageFile) {
        console.log('[useSendMessage] Uploading image');
        imageUrl = await handleImageUpload(imageFile);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
        console.log('[useSendMessage] Image uploaded successfully');
      }
      
      console.log('[useSendMessage] Calling sendMessageMutation');
      
      // We need to capture the message state before mutation to track changes
      console.log('[useSendMessage] Message state before mutation:', 
        messages.map(m => ({ 
          id: m.id, 
          role: m.role, 
          isPlaceholder: !!m.isPlaceholder,
          contentLength: m.content?.length || 0
        })));
      
      // Log the user's message to activity logs
      await logChatMessage(input.trim(), conversationId || undefined);
      
      // We've simplified the approach here - we don't add the user message to UI
      // in this hook anymore, that's now done in the mutation
      const startTime = performance.now();
      const result = await sendMessageMutation.mutateAsync({
        userMessage: input.trim(),
        imageUrl,
        isThinkMode,
        user,
        messages,
        conversationId,
        setMessages,
        setIsThinkMode,
        onConversationCreated
      });
      const endTime = performance.now();
      
      // Log the AI response to activity logs
      if (result?.response) {
        await logChatResponse(input.trim(), result.response, conversationId || undefined);
      }
      
      // Check the message state after mutation
      console.log('[useSendMessage] Message state after mutation:', {
        messageCount: messages.length,
        duration: `${(endTime - startTime).toFixed(0)}ms`,
        messages: messages.map(m => ({ 
          id: m.id, 
          role: m.role, 
          isPlaceholder: !!m.isPlaceholder,
          contentLength: m.content?.length || 0 
        }))
      });
      
      console.log('[useSendMessage] Mutation completed successfully', {
        responseId: result.assistantMessageId,
        responseLength: result.response.length,
        suggestedFollowUps: result.suggestedFollowUps.length,
        responsePreview: result.response.substring(0, 50) + "..."
      });
      
      // Force state update to make sure the message list refreshes
      // This is a safety measure to ensure the UI catches the changes
      setTimeout(() => {
        setMessages(currentMessages => {
          console.log('[useSendMessage] Forcing message state refresh', {
            messageCount: currentMessages.length,
            hasPlaceholders: currentMessages.some(m => m.isPlaceholder),
          });
          // Return a new array reference to force React to update
          return [...currentMessages];
        });
      }, 50);
      
      return result;
    } catch (error) {
      console.error('[useSendMessage] Error in handleSendMessage:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[useSendMessage] Message sending process finished, final message count:', {
        count: messages.length,
        messagesState: messages.map(m => ({ 
          id: m.id, 
          role: m.role, 
          isPlaceholder: !!m.isPlaceholder,
          contentLength: m.content?.length || 0
        }))
      });
    }
  }, [
    user,
    messages,
    conversationId,
    setIsLoading,
    setError,
    handleImageUpload,
    sendMessageMutation,
    setMessages,
    setIsThinkMode,
    onConversationCreated,
    logChatMessage,
    logChatResponse
  ]);

  return {
    handleSendMessage
  };
};
