
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
    setMessages,
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
  
  // Create initial chat messages (welcome + user message + placeholder) in a single update
  const createInitialMessages = useCallback((messageText: string, imageUrl: string | null = null) => {
    console.log("[usePgChatInterface] Creating initial messages for UI transition");
    
    // Welcome message
    const welcomeMessage: PgMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
      timestamp: new Date(),
    };
    
    // User message
    const userMessageId = crypto.randomUUID();
    const userMessage: PgMessage = {
      id: userMessageId,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
    };
    
    // Placeholder for AI response
    const placeholderId = crypto.randomUUID();
    const placeholderMessage: PgMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isPlaceholder: true,
    };
    
    // Update state with all three messages at once for immediate UI feedback
    setMessages([welcomeMessage, userMessage, placeholderMessage]);
    
    return { userMessageId, placeholderId };
  }, [setMessages]);
  
  // Add user message and placeholder to existing conversation
  const addMessagesToExistingChat = useCallback((messageText: string, imageUrl: string | null = null) => {
    console.log("[usePgChatInterface] Adding messages to existing chat");
    
    // User message
    const userMessageId = crypto.randomUUID();
    const userMessage: PgMessage = {
      id: userMessageId,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
    };
    
    // Placeholder for AI response
    const placeholderId = crypto.randomUUID();
    const placeholderMessage: PgMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isPlaceholder: true,
    };
    
    // Add to existing messages
    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    
    return { userMessageId, placeholderId };
  }, [setMessages]);
  
  // CRITICAL FIX: Completely decouple UI transition from message sending
  const handleSendMessage = useCallback((messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    console.log("[usePgChatInterface] handleSendMessage called, UI state:", 
      hasStartedChatRef.current ? "already in chat UI" : "transitioning to chat UI");
    
    // Step 1: Update UI immediately
    let messageIds;
    
    // If this is the first message, we need to transition to chat UI and show welcome + user message + placeholder
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
      messageIds = createInitialMessages(messageText);
    } else {
      // For subsequent messages, just add the user message and placeholder to existing chat
      messageIds = addMessagesToExistingChat(messageText);
    }
    
    // Step 2: Then proceed with the actual API call as a separate operation
    // This ensures the UI updates first before any API calls
    setTimeout(() => {
      originalHandleSendMessage(messageText, imageFile);
    }, 10);
  }, [originalHandleSendMessage, hasStartedChatRef, createInitialMessages, addMessagesToExistingChat]);

  // Handle example click - immediately transition then handle the example
  const handleExampleClick = useCallback((question: string) => {
    console.log("[usePgChatInterface] handleExampleClick called with:", question);
    
    // Step 1: Update UI immediately
    if (!hasStartedChatRef.current) {
      setHasStartedChat(true);
      createInitialMessages(question);
    } else {
      addMessagesToExistingChat(question);
    }
    
    // Step 2: Then handle the API call after the UI has updated
    setTimeout(() => {
      originalHandleExampleClick(question);
    }, 10);
  }, [originalHandleExampleClick, hasStartedChatRef, createInitialMessages, addMessagesToExistingChat]);

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
