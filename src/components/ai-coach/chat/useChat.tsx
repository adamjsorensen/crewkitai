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
  
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['conversationHistory', conversationId],
    queryFn: () => fetchConversationHistory(conversationId, user?.id),
    enabled: !isNewChat && !!conversationId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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

  useEffect(() => {
    console.log("[useChat] Messages changed, scrolling to bottom...");
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isLoading) {
      console.log("[useChat] Loading completed, scrolling to bottom...");
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, scrollToBottom]);

  const handleImageClick = useCallback(() => {
    handleImageClickBase(fileInputRef);
  }, [handleImageClickBase]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) {
      console.log('[useChat] No input or image file, ignoring send request');
      return;
    }
    
    try {
      console.log('[useChat] Starting to process message send request', {
        hasTextInput: !!input.trim(),
        hasImageFile: !!imageFile,
        imageFileName: imageFile?.name,
        imageFileSize: imageFile?.size,
        userIsAuthed: !!user
      });
      
      setIsLoading(true);
      setIsThinkMode(true);
      
      if (imageFile) {
        console.log('[useChat] Image file detected, starting upload process');
        const uploadedImageUrl = await uploadImage(imageFile);
        
        if (!uploadedImageUrl) {
          console.error('[useChat] Image upload failed');
          throw new Error('Failed to upload image');
        }
        
        console.log('[useChat] Image uploaded successfully, URL length:', uploadedImageUrl.length);
        console.log('[useChat] Starting dedicated image analysis with prompt:', input);
        
        await analyzeImage(input || 'Please analyze this image.', uploadedImageUrl);
        
        console.log('[useChat] Image analysis complete, clearing input and image');
        setInput('');
        removeImage();
        
        return;
      }
      
      console.log('[useChat] Processing text-only message');
      
      const userMessageId = `user-${uuidv4()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      setInput('');
      
      setTimeout(() => scrollToBottom(), 50);
      
      if (flags.enableStreaming) {
        console.log('[useChat] Using streaming mode for text message');
        await sendStreamingMessage(input);
      } else {
        console.log('[useChat] Using traditional mode for text message');
        await sendMessageTraditional(input);
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setIsThinkMode(false);
    }
  }, [flags.enableStreaming, sendStreamingMessage, sendMessageTraditional, analyzeImage, input, imageFile, uploadImage, removeImage, scrollToBottom, setIsThinkMode, user]);

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
    
    if (flags.enableStreaming) {
      sendStreamingMessage(question);
    } else {
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
