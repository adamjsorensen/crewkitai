
import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  
  // Monitor messages state changes
  useEffect(() => {
    console.log('[useChat] Messages updated:', {
      count: messages.length,
      lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : 'none',
      hasPlaceholder: messages.some(m => m.isPlaceholder)
    });
  }, [messages]);
  
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
  
  // Scroll to bottom when messages change, but avoid scrolling on initial render
  useEffect(() => {
    // Only scroll if we have actual messages (beyond the welcome message)
    const hasRealMessages = messages.some(m => m.id !== 'welcome');
    if (hasRealMessages) {
      console.log('[useChat] Scrolling to bottom due to messages change');
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);
  
  const handleImageClick = useCallback(() => {
    console.log('[useChat] Image click handler triggered');
    handleImageClickBase(fileInputRef);
  }, [handleImageClickBase, fileInputRef]);
  
  // Modified: Handle message sending with image processing if needed
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) {
      console.log('[useChat] No input or image to send');
      return;
    }
    
    console.log('[useChat] handleSendMessage triggered:', {
      hasInput: !!input.trim(),
      hasImage: !!imageFile,
      thinkMode: isThinkMode
    });
    
    try {
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
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [
    handleSendMessageBase,
    analyzeImage, 
    input, 
    imageFile, 
    uploadImage, 
    removeImage, 
    user,
    setInput,
    setIsLoading,
    setError,
    isThinkMode
  ]);
  
  // Handle example click - only populates the input
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
