
import { useCallback, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import { useMessageHandler } from './hooks/useMessageHandler';
import { useImageHandling } from './hooks/useImageHandling';
import { useScrollManagement } from './hooks/useScrollManagement';
import { useConversationUtils } from './hooks/useConversationUtils';
import { useKeyboardHandling } from './hooks/useKeyboardHandling';
import { Message } from './types';

export const useChat = (
  conversationId: string | null,
  isNewChat: boolean,
  onConversationCreated?: (id: string) => void
) => {
  const {
    input, 
    setInput,
    messages, 
    setMessages,
    isLoading, 
    setIsLoading,
    error, 
    setError,
    isThinkMode, 
    setIsThinkMode,
    isLoadingHistory,
    fileInputRef,
    inputRef,
    user
  } = useChatCore(conversationId, isNewChat, onConversationCreated);
  
  // Track previous message count to detect changes
  const prevMessageCountRef = useRef(messages.length);
  
  // Debug message state changes
  useEffect(() => {
    if (prevMessageCountRef.current !== messages.length) {
      console.log('[useChat] Messages count changed from', prevMessageCountRef.current, 'to', messages.length);
      prevMessageCountRef.current = messages.length;
    }
    
    console.log('[useChat] Messages updated:', {
      count: messages.length,
      lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : 'none',
      hasPlaceholder: messages.some(m => m.isPlaceholder),
      messageIds: messages.map(m => m.id)
    });
  }, [messages]);
  
  // Log initial state
  useEffect(() => {
    console.log('[useChat] Initialized with:', {
      conversationId,
      isNewChat,
      messagesCount: messages.length,
      isLoading,
      isThinkMode
    });
  }, [conversationId, isNewChat, messages.length, isLoading, isThinkMode]);
  
  const {
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom
  } = useScrollManagement();
  
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
    isCopying,
    copyConversation,
    clearConversation
  } = useConversationUtils(messages, setMessages, onConversationCreated);
  
  const {
    fillInputWithExample,
    handleSendMessage: handleSendMessageBase,
    prepareUserMessageUI,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing
  } = useMessageHandler({
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
  });
  
  // Force scroll to bottom when messages change or loading state changes
  useEffect(() => {
    // Only scroll if we have actual messages
    if (messages.length > 0) {
      console.log('[useChat] Scrolling to bottom due to messages change');
      scrollToBottom();
    }
  }, [messages, isLoading, scrollToBottom]);
  
  const handleImageClick = useCallback(() => {
    console.log('[useChat] Image click handler triggered');
    handleImageClickBase(fileInputRef);
  }, [handleImageClickBase, fileInputRef]);
  
  // Enhanced message sending with debugging
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) {
      console.log('[useChat] No input or image to send');
      return;
    }
    
    console.log('[useChat] handleSendMessage triggered:', {
      hasInput: !!input.trim(),
      hasImage: !!imageFile,
      thinkMode: isThinkMode,
      currentMessagesCount: messages.length
    });
    
    try {
      // First add user message to UI for immediate feedback
      if (input.trim()) {
        const userMessage = prepareUserMessageUI(input);
        console.log('[useChat] User message added to UI:', userMessage?.id);
      }
      
      // Set loading state after UI has been updated
      setIsLoading(true);
      
      if (imageFile) {
        console.log('[useChat] Processing image upload');
        const uploadedImageUrl = await uploadImage(imageFile);
        
        if (!uploadedImageUrl) {
          console.error('[useChat] Image upload failed');
          throw new Error('Failed to upload image');
        }
        
        console.log('[useChat] Image uploaded, now analyzing');
        await analyzeImage(input || 'Please analyze this image.', uploadedImageUrl);
        
        setInput('');
        removeImage();
        
        return;
      }
      
      console.log('[useChat] Sending text message with thinkMode:', isThinkMode);
      // Use the current think mode setting from the UI when sending the message
      const startTime = performance.now();
      await handleSendMessageBase(input, isThinkMode);
      const endTime = performance.now();
      console.log(`[useChat] Message sent and processed in ${(endTime - startTime).toFixed(0)}ms`);
      
      // Clear input after successful send
      setInput('');
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      // Ensure we always scroll to bottom
      setTimeout(() => {
        scrollToBottom();
        console.log('[useChat] Scrolled to bottom after send operation');
      }, 100);
    }
  }, [
    handleSendMessageBase,
    analyzeImage, 
    input, 
    imageFile, 
    uploadImage, 
    removeImage, 
    setInput,
    setIsLoading,
    setError,
    isThinkMode,
    messages.length,
    prepareUserMessageUI,
    scrollToBottom
  ]);
  
  // Handle example click
  const handleExampleClick = useCallback((question: string) => {
    console.log('[useChat] Example click handler with:', question);
    fillInputWithExample(question);
    
    // Focus the input field after filling it
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [fillInputWithExample, inputRef]);
  
  // Use our keyboard handling hook
  const { handleKeyDown } = useKeyboardHandling({ 
    handleSendMessage,
    isLoading,
    input
  });

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
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    handleImageClick,
    handleImageChange,
    removeImage,
    handleSendMessage,
    prepareUserMessageUI,
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
