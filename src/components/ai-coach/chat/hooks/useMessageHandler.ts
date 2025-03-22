
import { useCallback } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { useImageAnalysis } from './useImageAnalysis';
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

  const fillInputWithExample = useCallback((question: string) => {
    setInput(question);
  }, [setInput]);

  // Modified: Split the functionality to prepare UI immediately
  const prepareUserMessageUI = useCallback((input: string) => {
    if (!input.trim()) return null;
    
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    scrollToBottom();
    
    return userMessage;
  }, [setMessages, setInput, scrollToBottom]);

  // Modified to use the UI preparation separately from the API call
  const handleSendMessage = useCallback(async (input: string, shouldUseThinkMode: boolean = false) => {
    if (!input.trim()) return;
    
    // Create and display user message immediately for UI responsiveness
    const userMessage = prepareUserMessageUI(input);
    if (!userMessage) return;
    
    // Set loading state for response - this doesn't block the UI transition
    setIsLoading(true);
    
    try {
      // Proceed with API call after UI is ready
      await sendMessageTraditional(input, null, shouldUseThinkMode);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [prepareUserMessageUI, sendMessageTraditional, setIsLoading, setError]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry, setInput]);

  return {
    fillInputWithExample,
    handleSendMessage,
    prepareUserMessageUI,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing
  };
};
