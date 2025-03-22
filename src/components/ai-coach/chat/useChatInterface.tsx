
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
  // Track if user has started a chat
  const [hasStartedChat, setHasStartedChat] = useState(() => {
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
    prepareUserMessageUI,
    handleKeyDown,
    handleExampleClick: originalHandleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    scrollToBottom
  } = chatHook;

  // Update hasStartedChat when props change
  useEffect(() => {
    if (conversationId && !hasStartedChat) {
      setHasStartedChat(true);
    }
  }, [conversationId, hasStartedChat]);
  
  // CRITICAL FIX: Completely decouple UI transition from message sending
  const handleSendMessage = useCallback(() => {
    if (!input.trim() && !imageFile) return;
    
    // IMMEDIATELY show the chat UI without any async operations
    setHasStartedChat(true);
    
    // First add the user message to the UI immediately for instant feedback
    if (input.trim()) {
      prepareUserMessageUI(input);
    }
    
    // Then proceed with the actual message sending as a separate operation
    // This ensures the UI updates first before any API calls
    requestAnimationFrame(() => {
      originalHandleSendMessage();
    });
  }, [originalHandleSendMessage, input, imageFile, prepareUserMessageUI, setHasStartedChat]);

  // Handle example click - immediately transition then fill input
  const handleExampleClick = useCallback((question: string) => {
    // First switch to chat UI, no delay or async operations
    setHasStartedChat(true);
    
    // Then populate the input after the UI has switched
    requestAnimationFrame(() => {
      originalHandleExampleClick(question);
      // Focus the input after filling it
      if (inputRef.current) {
        inputRef.current.focus();
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
