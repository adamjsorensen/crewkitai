
import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Track if user has started a chat - this is the key state for UI transitions
  const [hasStartedChat, setHasStartedChat] = useState(() => {
    return !isNewChat || !!conversationId;
  });
  
  // Use a ref to track state changes without triggering re-renders
  const hasStartedChatRef = useRef(hasStartedChat);
  
  // Update the ref when the state changes
  useEffect(() => {
    hasStartedChatRef.current = hasStartedChat;
  }, [hasStartedChat]);

  // Initialize the chat hook
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
      console.log("[useChatInterface] Setting hasStartedChat to true due to conversationId change");
      setHasStartedChat(true);
    }
  }, [conversationId, hasStartedChat]);
  
  // CRITICAL FIX: Completely decouple UI transition from message sending
  const handleSendMessage = useCallback(() => {
    if (!input.trim() && !imageFile) return;
    
    console.log("[useChatInterface] handleSendMessage called, UI state:", 
      hasStartedChatRef.current ? "already in chat UI" : "transitioning to chat UI");
    
    // IMMEDIATELY show the chat UI without any async operations
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
    }
    
    // First add the user message to the UI immediately for instant feedback
    if (input.trim()) {
      prepareUserMessageUI(input);
    }
    
    // Then proceed with the actual message sending as a separate operation
    // This ensures the UI updates first before any API calls
    setTimeout(() => {
      originalHandleSendMessage();
    }, 0);
  }, [originalHandleSendMessage, input, imageFile, prepareUserMessageUI]);

  // Handle example click - immediately transition then fill input
  const handleExampleClick = useCallback((question: string) => {
    console.log("[useChatInterface] handleExampleClick called with:", question);
    console.log("[useChatInterface] UI state before:", 
      hasStartedChatRef.current ? "already in chat UI" : "transitioning to chat UI");
    
    // First switch to chat UI, no delay or async operations
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
    }
    
    // Then populate the input after the UI has switched
    setTimeout(() => {
      console.log("[useChatInterface] Setting input and focusing after UI transition");
      originalHandleExampleClick(question);
      // Focus the input after filling it
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
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
