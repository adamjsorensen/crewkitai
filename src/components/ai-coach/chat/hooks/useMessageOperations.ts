
import { useCallback } from 'react';
import { Message } from '../types';
import { useSendMessage } from './useSendMessage';
import { useRetryMessage } from './useRetryMessage';
import { useRegenerateMessage } from './useRegenerateMessage';

interface UseMessageOperationsProps {
  user: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
  imageFile: File | null;
  isThinkMode: boolean;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useMessageOperations = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  uploadImage,
  removeImage,
  imageFile,
  isThinkMode,
  setIsThinkMode
}: UseMessageOperationsProps) => {
  const { handleSendMessage: sendMessage } = useSendMessage({
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
  });

  const { handleRetry } = useRetryMessage({
    messages,
    setMessages
  });

  const { handleRegenerateMessage } = useRegenerateMessage({
    user,
    messages,
    setMessages,
    setIsLoading,
    setError,
    conversationId
  });

  const handleSendMessage = useCallback(async (input: string) => {
    await sendMessage(input, imageFile, isThinkMode);
  }, [sendMessage, imageFile, isThinkMode]);

  return {
    handleSendMessage,
    handleRetry,
    handleRegenerateMessage
  };
};
