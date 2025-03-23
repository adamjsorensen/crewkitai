
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePgChat, PgMessage } from '@/hooks/usePgChat';

interface UsePgChatInterfaceProps {
  initialConversationId?: string | null;
  onConversationStart?: (id: string) => void;
}

export const usePgChatInterface = ({
  initialConversationId,
  onConversationStart
}: UsePgChatInterfaceProps) => {
  // Track if user has started a chat - this is the key state for UI transitions
  const [hasStartedChat, setHasStartedChat] = useState(() => {
    return !!initialConversationId;
  });
  
  // Use a ref to track state changes without triggering re-renders
  const hasStartedChatRef = useRef(hasStartedChat);
  
  // Update the ref when the state changes
  useEffect(() => {
    hasStartedChatRef.current = hasStartedChat;
  }, [hasStartedChat]);

  // Initialize the chat hook
  const pgChatHook = usePgChat({
    initialConversationId,
    onConversationStart
  });
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage: originalHandleSendMessage,
    handleRetry,
    handleExampleClick: originalHandleExampleClick,
    handleToggleThinkMode,
    handleNewChat: originalHandleNewChat,
    scrollToBottom,
    showScrollButton
  } = pgChatHook;

  // Update hasStartedChat when props change
  useEffect(() => {
    if (initialConversationId && !hasStartedChat) {
      console.log("[usePgChatInterface] Setting hasStartedChat to true due to initialConversationId change");
      setHasStartedChat(true);
    }
  }, [initialConversationId, hasStartedChat]);
  
  // CRITICAL FIX: Completely decouple UI transition from message sending
  const handleSendMessage = useCallback((messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    console.log("[usePgChatInterface] handleSendMessage called, UI state:", 
      hasStartedChatRef.current ? "already in chat UI" : "transitioning to chat UI");
    
    // IMMEDIATELY show the chat UI without any async operations
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
    }
    
    // Then proceed with the actual message sending as a separate operation
    // This ensures the UI updates first before any API calls
    setTimeout(() => {
      originalHandleSendMessage(messageText, imageFile);
    }, 0);
  }, [originalHandleSendMessage]);

  // Handle example click - immediately transition then handle the example
  const handleExampleClick = useCallback((question: string) => {
    console.log("[usePgChatInterface] handleExampleClick called with:", question);
    console.log("[usePgChatInterface] UI state before:", 
      hasStartedChatRef.current ? "already in chat UI" : "transitioning to chat UI");
    
    // First switch to chat UI, no delay or async operations
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
    }
    
    // Then handle the example after the UI has switched
    setTimeout(() => {
      console.log("[usePgChatInterface] Handling example after UI transition");
      originalHandleExampleClick(question);
    }, 10);
  }, [originalHandleExampleClick]);

  const handleNewChat = useCallback(() => {
    setHasStartedChat(false);
    originalHandleNewChat();
  }, [originalHandleNewChat]);

  return {
    hasStartedChat,
    setHasStartedChat,
    handleSendMessage,
    handleExampleClick,
    handleNewChat,
    ...pgChatHook
  };
};
