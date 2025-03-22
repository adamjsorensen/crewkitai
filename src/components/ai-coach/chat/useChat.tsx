
import { useCallback, useEffect } from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
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
  const { flags } = useFeatureFlags();
  
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
    handleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    analyzeImage,
    isAnalyzing,
    isStreaming,
    sendMessageTraditional,
    sendStreamingMessage
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
    enableStreaming: flags.enableStreaming
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    console.log("[useChat] Messages changed, scrolling to bottom...");
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom after loading completes
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
  }, [handleImageClickBase, fileInputRef]);
  
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
  }, [
    flags.enableStreaming, 
    sendStreamingMessage, 
    sendMessageTraditional, 
    analyzeImage, 
    input, 
    imageFile, 
    uploadImage, 
    removeImage, 
    scrollToBottom, 
    setIsThinkMode, 
    user,
    setInput,
    setIsLoading,
    setMessages,
    setError
  ]);
  
  const { handleKeyDown } = useKeyboardHandling({ handleSendMessage });

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
