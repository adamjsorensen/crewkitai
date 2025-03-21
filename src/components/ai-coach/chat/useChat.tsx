
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Message } from './types';
import { fetchConversationHistory } from './api/fetchConversationHistory';
import { useImageHandling } from './hooks/useImageHandling';
import { useMessageOperations } from './hooks/useMessageOperations';
import { useScrollManagement } from './hooks/useScrollManagement';
import { useConversationUtils } from './hooks/useConversationUtils';

export const useChat = (
  conversationId: string | null,
  isNewChat: boolean,
  onConversationCreated?: (id: string) => void
) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  // Custom hooks
  const {
    imageFile,
    imagePreviewUrl,
    isUploading,
    handleImageClick: handleImageClickBase,
    handleImageChange,
    removeImage,
    uploadImage
  } = useImageHandling({ user });
  
  const {
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom
  } = useScrollManagement();
  
  const {
    isCopying,
    copyConversation,
    clearConversation
  } = useConversationUtils(messages, setMessages, onConversationCreated);
  
  const {
    handleSendMessage: sendMessage,
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
    uploadImage,
    removeImage,
    imageFile,
    isThinkMode,
    setIsThinkMode
  });
  
  // Fetch conversation history
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['conversationHistory', conversationId],
    queryFn: () => fetchConversationHistory(conversationId, user?.id),
    enabled: !isNewChat && !!conversationId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Initialize messages based on chat state
  useEffect(() => {
    if (isNewChat) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    } else if (!isLoadingHistory && historyMessages.length > 0) {
      setMessages(historyMessages);
    } else if (!isLoadingHistory && historyMessages.length === 0 && !isNewChat && conversationId) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    }
  }, [isNewChat, historyMessages, isLoadingHistory, conversationId]);

  // Auto-scroll when messages change
  useEffect(() => {
    console.log("[useChat] Messages changed, scrolling to bottom...");
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Additional scroll for when loading completes
  useEffect(() => {
    if (!isLoading) {
      console.log("[useChat] Loading completed, scrolling to bottom...");
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scrollToBottom]);

  // Wrapper functions with optimized handling
  const handleImageClick = useCallback(() => {
    handleImageClickBase(fileInputRef);
  }, [handleImageClickBase]);

  const handleSendMessage = useCallback(() => {
    if (!input.trim() && !imageFile) return;
    
    // Immediately add user message to the UI
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date(),
      imageUrl: imagePreviewUrl || undefined
    };
    
    // Update messages state immediately to show user input
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and start loading state
    setInput('');
    setIsLoading(true);
    
    // Scroll to bottom immediately after adding user message
    setTimeout(() => scrollToBottom(), 50);
    
    // Process the message in the background
    sendMessage(input);
  }, [sendMessage, input, imageFile, imagePreviewUrl, scrollToBottom]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleExampleClick = useCallback((question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Immediately add the question to the UI
    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    
    // Update messages state immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and start loading state
    setInput('');
    setIsLoading(true);
    
    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(), 50);
    
    // Process the message in the background
    sendMessage(question);
  }, [sendMessage, scrollToBottom]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry]);

  return {
    input,
    setInput,
    messages,
    isLoading,
    isLoadingHistory,
    error,
    imageFile,
    imagePreviewUrl,
    isUploading,
    showScrollButton,
    isThinkMode,
    setIsThinkMode,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    handleImageClick,
    handleImageChange,
    removeImage,
    handleSendMessage,
    handleKeyDown,
    handleExampleClick,
    handleRetry,
    copyConversation,
    clearConversation,
    handleRegenerateMessage,
    scrollToBottom,
    isCopying
  };
};
