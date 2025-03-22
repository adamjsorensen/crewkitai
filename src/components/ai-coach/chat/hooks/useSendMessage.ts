
import { useCallback } from 'react';
import { Message } from '../types';
import { User } from '@supabase/supabase-js';
import { useSendMessageMutation } from '../mutations/useSendMessageMutation';
import { useImageUpload } from './useImageUpload';

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

  const handleSendMessage = useCallback(async (input: string, imageFile: File | null, isThinkMode: boolean) => {
    if ((!input.trim() && !imageFile) || !user) {
      console.error('[useSendMessage] No input, image, or user');
      return null;
    }
    
    console.log('[useSendMessage] Starting send message process', {
      inputLength: input.length,
      hasImage: !!imageFile,
      isThinkMode,
      currentMessageCount: messages.length
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
        messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));
      
      // We've simplified the approach here - we don't add the user message to UI
      // in this hook anymore, that's now done in the mutation
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
      
      // Check the message state after mutation
      console.log('[useSendMessage] Message state after mutation:', 
        messages.map(m => ({ id: m.id, role: m.role, isPlaceholder: m.isPlaceholder })));
      
      console.log('[useSendMessage] Mutation completed successfully', {
        responseId: result.assistantMessageId,
        responseLength: result.response.length,
        suggestedFollowUps: result.suggestedFollowUps.length
      });
      
      return result;
    } catch (error) {
      console.error('[useSendMessage] Error in handleSendMessage:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[useSendMessage] Message sending process finished, final message count:', messages.length);
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
    onConversationCreated
  ]);

  return {
    handleSendMessage
  };
};
