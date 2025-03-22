
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
  
  const sendMessageMutation = useSendMessageMutation();

  const handleSendMessage = useCallback(async (input: string, imageFile: File | null, isThinkMode: boolean) => {
    if ((!input.trim() && !imageFile) || !user) {
      console.error('[useSendMessage] No input, image, or user');
      return null;
    }
    
    console.log('[useSendMessage] Starting send message process', {
      inputLength: input.length,
      hasImage: !!imageFile,
      isThinkMode
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
        console.log('[useSendMessage] Image uploaded successfully:', imageUrl.substring(0, 50) + '...');
      }
      
      console.log('[useSendMessage] Calling sendMessageMutation with:', {
        userMessage: input.trim().substring(0, 30) + '...',
        hasImage: !!imageUrl,
        isThinkMode
      });
      
      // Send the message through the mutation and directly return the result
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
      
      console.log('[useSendMessage] Mutation completed successfully:', {
        responseLength: result.response.length,
        suggestedFollowUps: result.suggestedFollowUps?.length || 0,
        assistantMessageId: result.assistantMessageId
      });
      
      return result;
    } catch (error) {
      console.error('[useSendMessage] Error in handleSendMessage:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false);
      console.log('[useSendMessage] Message sending process finished, loading state cleared');
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
