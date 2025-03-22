
import { useCallback } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { useImageAnalysis } from './useImageAnalysis';
import { useStreamingChat } from './useStreamingChat';
import { useMessageOperations } from './useMessageOperations';

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
  enableStreaming
}: UseMessageHandlerProps) => {
  const {
    handleSendMessage: sendMessageTraditional,
    handleRetry: baseHandleRetry,
    handleRegenerateMessage
  } = useMessageOperations({
    user,
    messages,
    setMessages,
    setIsLoading,
    setError,
    conversationId,
    onConversationCreated,
    uploadImage: async () => "", // Will be overridden in useChat
    removeImage: () => {}, // Will be overridden in useChat
    imageFile: null, // Will be overridden in useChat
    isThinkMode: false, // Will be overridden in useChat
    setIsThinkMode
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

  const handleExampleClick = useCallback((question: string) => {
    setInput(question);
    
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    setInput('');
    setIsLoading(true);
    setIsThinkMode(true);
    
    setTimeout(() => scrollToBottom(), 50);
    
    if (enableStreaming) {
      sendStreamingMessage(question);
    } else {
      sendMessageTraditional(question);
    }
  }, [enableStreaming, sendStreamingMessage, sendMessageTraditional, scrollToBottom, setIsThinkMode, setInput, setIsLoading, setMessages]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry, setInput]);

  return {
    handleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing,
    isStreaming,
    sendMessageTraditional,
    sendStreamingMessage
  };
};
