
import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';

interface UseChatInterfaceProps {
  conversationId?: string | null;
  isNewChat?: boolean;
  onConversationCreated?: (id: string) => void;
  onNewChat?: () => void;
  onBackToWelcome?: () => void;
}

export const useChatInterface = ({
  conversationId = null,
  isNewChat = true,
  onConversationCreated,
  onNewChat,
  onBackToWelcome
}: UseChatInterfaceProps) => {
  // Track if user has started a chat (replaces complex showWelcome logic)
  const [hasStartedChat, setHasStartedChat] = useState(() => {
    // Calculate initial state only once during component initialization
    return !isNewChat || !!conversationId;
  });

  const chatHook = useChat(conversationId, isNewChat, onConversationCreated);
  
  const {
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
    handleSendMessage: originalHandleSendMessage,
    handleKeyDown,
    handleExampleClick: originalHandleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    scrollToBottom
  } = chatHook;

  // Update hasStartedChat only when props change
  useEffect(() => {
    if (conversationId) {
      // If we have a conversation ID, we're in an existing chat
      if (!hasStartedChat) {
        setHasStartedChat(true);
      }
    }
  }, [conversationId, hasStartedChat]);
  
  // Wrap the send message handler with useCallback to prevent unnecessary recreations
  const handleSendMessage = useCallback(() => {
    if (!input.trim() && !imageFile) return;
    
    // Ensure we force the render immediately by setting state first
    // and guaranteeing it takes effect before anything else happens
    setHasStartedChat(true);
    
    // Use requestAnimationFrame to ensure the UI update completes
    // before we start any potentially blocking operations
    requestAnimationFrame(() => {
      // Then proceed with sending the message
      originalHandleSendMessage();
    });
  }, [originalHandleSendMessage, input, imageFile, setHasStartedChat]);

  // Wrap the example click handler with useCallback 
  const handleExampleClick = useCallback((question: string) => {
    // Set hasStartedChat immediately when an example is clicked
    setHasStartedChat(true);
    
    // Then fill the input field with the example question
    requestAnimationFrame(() => {
      originalHandleExampleClick(question);
      
      // Focus the input after filling it
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    });
  }, [originalHandleExampleClick, inputRef, setHasStartedChat]);

  const handleBackToWelcome = useCallback(() => {
    // Reset input and clear any ongoing operations
    setInput("");
    removeImage();
    setHasStartedChat(false);
    
    // If external handler provided, call it
    if (onBackToWelcome) {
      onBackToWelcome();
    }
  }, [removeImage, onBackToWelcome, setInput]);

  const handleNewChatClick = useCallback(() => {
    setInput("");
    removeImage();
    setHasStartedChat(false);
    if (onNewChat) onNewChat();
  }, [removeImage, onNewChat, setInput]);

  return {
    hasStartedChat,
    setHasStartedChat,
    handleBackToWelcome,
    handleNewChatClick,
    handleSendMessage,
    handleExampleClick,
    ...chatHook
  };
};
