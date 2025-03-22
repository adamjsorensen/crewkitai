
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
    
    // CRITICAL: Immediately set hasStartedChat to true before sending the message
    // This ensures we switch to the chat view right away, before waiting for response
    setHasStartedChat(true);
    
    // Then proceed with sending the message
    originalHandleSendMessage();
  }, [originalHandleSendMessage, input, imageFile, setHasStartedChat]);

  // Wrap the example click handler with useCallback 
  const handleExampleClick = useCallback((question: string) => {
    // Fill the input field with the example question
    originalHandleExampleClick(question);
    
    // Focus the input after filling it
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [originalHandleExampleClick, inputRef]);

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
