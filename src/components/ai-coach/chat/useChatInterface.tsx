
import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';

interface UseChatInterfaceProps {
  conversationId?: string | null;
  isNewChat?: boolean;
  onConversationCreated?: (id: string) => void;
  onNewChat?: () => void;
}

export const useChatInterface = ({
  conversationId = null,
  isNewChat = true,
  onConversationCreated,
  onNewChat
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
    } else if (isNewChat) {
      // For a new chat, reset the hasStartedChat flag
      setHasStartedChat(false);
    }
  }, [conversationId, isNewChat, hasStartedChat]);
  
  // Wrap the send message handler with useCallback to prevent unnecessary recreations
  const handleSendMessage = useCallback(() => {
    if (!input.trim() && !imageFile) return;
    
    // Only update if current state is false to avoid unnecessary re-renders
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    
    originalHandleSendMessage();
  }, [originalHandleSendMessage, input, imageFile, hasStartedChat, setHasStartedChat]);

  // Wrap the example click handler with useCallback
  const handleExampleClick = useCallback((question: string) => {
    // Only update if current state is false to avoid unnecessary re-renders
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    
    setInput(question);
    // Small delay to ensure state updates before sending
    setTimeout(() => {
      originalHandleExampleClick(question);
    }, 50);
  }, [originalHandleExampleClick, hasStartedChat, setHasStartedChat, setInput]);

  const handleBackToWelcome = useCallback(() => {
    setHasStartedChat(false);
  }, []);

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
