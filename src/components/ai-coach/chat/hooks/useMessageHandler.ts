
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

  // Function to fill the input with the example, doesn't send
  const fillInputWithExample = useCallback((question: string) => {
    setInput(question);
  }, [setInput]);

  // Handle actual sending of message after user clicks submit
  const handleSendMessage = useCallback(async (input: string, shouldUseThinkMode: boolean = false) => {
    if (!input.trim()) return;
    
    // Create and add user message immediately
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field
    setInput('');
    
    // Set loading state immediately
    setIsLoading(true);
    
    // Add thinking message if think mode is enabled
    if (shouldUseThinkMode) {
      setIsThinkMode(true);
      
      // Add a temporary "thinking" message that will be replaced
      const thinkingMessageId = `thinking-${Date.now()}`;
      const thinkingMessage: Message = {
        id: thinkingMessageId,
        role: 'thinking',
        content: 'Your AI Coach is thinking...',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, thinkingMessage]);
    }
    
    // Scroll to bottom immediately
    scrollToBottom();
    
    // Small timeout to ensure UI updates before processing
    setTimeout(async () => {
      await sendMessageTraditional(input, null, shouldUseThinkMode);
      
      // Remove thinking message once response is received
      if (shouldUseThinkMode) {
        setMessages(prev => prev.filter(msg => msg.role !== 'thinking'));
        setIsThinkMode(false);
      }
    }, 50);
    
  }, [sendMessageTraditional, scrollToBottom, setIsThinkMode, setInput, setIsLoading, setMessages]);

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
    isAnalyzing
  };
};
