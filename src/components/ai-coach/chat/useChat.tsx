
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
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);
  
  const handleImageClick = useCallback(() => {
    handleImageClickBase(fileInputRef);
  }, [handleImageClickBase, fileInputRef]);
  
  // Modified: Handle message sending with image processing if needed
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) {
      return;
    }
    
    try {
      // Set loading state immediately so the UI can show loading indicators
      setIsLoading(true);
      
      if (imageFile) {
        const uploadedImageUrl = await uploadImage(imageFile);
        
        if (!uploadedImageUrl) {
          throw new Error('Failed to upload image');
        }
        
        await analyzeImage(input || 'Please analyze this image.', uploadedImageUrl);
        
        setInput('');
        removeImage();
        
        return;
      }
      
      // Use the current think mode setting from the UI when sending the message
      await handleSendMessageBase(input, isThinkMode);
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
