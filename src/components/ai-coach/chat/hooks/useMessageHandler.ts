
import { useCallback } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { useImageAnalysis } from './useImageAnalysis';
import { useStreamingChat } from './useStreamingChat';
import { useSendMessage } from './useSendMessage';
import { useRetryMessage } from './useRetryMessage';
import { useRegenerateMessage } from './useRegenerateMessage';

interface UseMessageHandlerProps {
  user: User | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (input: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  setIsThinkMode: (isThinkMode: boolean) => void;
  scrollToBottom: () => void;
  enableStreaming: boolean;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
}

export const useMessageHandler = ({
  user,
  messages,
  setMessages,
  setInput,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  setIsThinkMode,
  scrollToBottom,
  enableStreaming,
  uploadImage,
  removeImage
}: UseMessageHandlerProps) => {
  const { handleSendMessage: sendMessageTraditional } = useSendMessage({
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
  
  const { handleRetry: baseHandleRetry } = useRetryMessage({
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
  
  const {
    isStreaming,
    sendStreamingMessage
  } = useStreamingChat({
    user,
    messages,
    setMessages,
    setIsLoading,
    setError,
    conversationId,
    onConversationCreated,
    scrollToBottom,
    setIsThinkMode
  });
  
  const {
    analyzeImage,
    isAnalyzing
  } = useImageAnalysis({
    user,
    conversationId,
    onConversationCreated,
    setMessages,
    setError,
    scrollToBottom
  });

  // New function: just fills the input with the example, doesn't send
  const fillInputWithExample = useCallback((question: string) => {
    setInput(question);
  }, [setInput]);

  // Modified: handle actual sending of message after user clicks submit
  const handleSendMessage = useCallback(async (input: string, shouldUseThinkMode: boolean = false) => {
    if (!input.trim()) return;
    
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Only use think mode if explicitly requested
    if (shouldUseThinkMode) {
      setIsThinkMode(true);
    }
    
    setTimeout(() => scrollToBottom(), 50);
    
    if (enableStreaming) {
      await sendStreamingMessage(input);
    } else {
      await sendMessageTraditional(input, null, shouldUseThinkMode);
    }
    
    // Reset think mode after sending
    if (shouldUseThinkMode) {
      setIsThinkMode(false);
    }
  }, [enableStreaming, sendStreamingMessage, sendMessageTraditional, scrollToBottom, setIsThinkMode, setInput, setIsLoading, setMessages]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry, setInput]);

  return {
    fillInputWithExample,
    handleSendMessage,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing,
    isStreaming,
    sendMessageTraditional,
    sendStreamingMessage
  };
};
