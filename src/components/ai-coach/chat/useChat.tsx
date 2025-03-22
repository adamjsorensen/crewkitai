import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Message } from './types';
import { v4 as uuidv4 } from 'uuid';
import { fetchConversationHistory } from './api/fetchConversationHistory';
import { useImageHandling } from './hooks/useImageHandling';
import { useMessageOperations } from './hooks/useMessageOperations';
import { useScrollManagement } from './hooks/useScrollManagement';
import { useConversationUtils } from './hooks/useConversationUtils';
import { useStreamingChat } from './hooks/useStreamingChat';
import { useImageAnalysis } from './hooks/useImageAnalysis';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

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
  const { flags } = useFeatureFlags();
  
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
  
  // Traditional message operations (non-streaming)
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
    uploadImage,
    removeImage,
    imageFile,
    isThinkMode,
    setIsThinkMode
  });
  
  // Streaming chat functionality
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
  
  // New Image Analysis functionality
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

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) return;
    
    try {
      setIsLoading(true);
      setIsThinkMode(true);
      
      // Handle image upload if there's an image file
      if (imageFile) {
        console.log('[useChat] Uploading image before sending message');
        const uploadedImageUrl = await uploadImage(imageFile);
        if (!uploadedImageUrl) {
          throw new Error('Failed to upload image');
        }
        
        console.log('[useChat] Image uploaded successfully, using dedicated image analysis');
        
        // Use the dedicated image analysis functionality instead of streaming with image
        await analyzeImage(input, uploadedImageUrl);
        
        // Clear input and image after sending
        setInput('');
        removeImage();
        
        return; // Early return since image analysis handles everything
      }
      
      // For text-only messages, proceed with regular handling
      // Immediately add user message to the UI
      const userMessageId = `user-${uuidv4()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      
      // Update messages state immediately to show user input
      setMessages(prev => [...prev, userMessage]);
      
      // Clear input
      setInput('');
      
      // Scroll to bottom immediately after adding user message
      setTimeout(() => scrollToBottom(), 50);
      
      // Choose between streaming and traditional based on feature flag
      if (flags.enableStreaming) {
        console.log('[useChat] Using streaming mode for text message');
        // Process the message with streaming (text only)
        await sendStreamingMessage(input);
      } else {
        // Process the message traditionally
        await sendMessageTraditional(input);
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setIsThinkMode(false);
    }
  }, [flags.enableStreaming, sendStreamingMessage, sendMessageTraditional, analyzeImage, input, imageFile, uploadImage, removeImage, scrollToBottom, setIsThinkMode]);

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
    setIsThinkMode(true);
    
    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(), 50);
    
    // Choose between streaming and traditional based on feature flag
    if (flags.enableStreaming) {
      // Process the message with streaming
      sendStreamingMessage(question);
    } else {
      // Process the message traditionally
      sendMessageTraditional(question);
    }
  }, [flags.enableStreaming, sendStreamingMessage, sendMessageTraditional, scrollToBottom, setIsThinkMode]);

  const handleRetry = useCallback(() => {
    const lastContent = baseHandleRetry();
    setInput(lastContent);
  }, [baseHandleRetry]);

  return {
    input,
    setInput,
    messages,
    isLoading: isLoading || isAnalyzing,
    isLoadingHistory,
    error,
    imageFile,
    imagePreviewUrl,
    isUploading,
    showScrollButton,
    isThinkMode,
    setIsThinkMode,
    isStreaming: (flags.enableStreaming && !imageFile) ? isStreaming : false,
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
    isCopying,
    isAnalyzing
  };
};
