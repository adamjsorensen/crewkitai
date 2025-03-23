
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
  
  // Create welcome message for new chats
  const createWelcomeMessage = useCallback(() => {
    return {
      id: 'welcome',
      role: 'assistant' as const,
      content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
      timestamp: new Date(),
    };
  }, []);
  
  // Handle send message - decouple UI and API operations
  const handleSendMessage = useCallback((messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    console.log("[usePgChatInterface] handleSendMessage called, hasStartedChat:", hasStartedChatRef.current);
    
    // CRITICAL FIX: Handle both the UI transition and message creation synchronously
    if (!hasStartedChatRef.current) {
      console.log("[usePgChatInterface] First message - transitioning to chat UI with complete initial state");
      
      // Step 1: Prepare all initial UI elements in one update
      const welcomeMessage = createWelcomeMessage();
      const userMessageId = crypto.randomUUID();
      const userMessage = {
        id: userMessageId,
        role: 'user' as const,
        content: messageText,
        timestamp: new Date(),
        imageUrl: null, // Will be updated after upload if needed
      };
      
      const placeholderId = crypto.randomUUID();
      const placeholderMessage = {
        id: placeholderId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Step 2: Update UI state with ALL messages in a single operation
      setMessages([welcomeMessage, userMessage, placeholderMessage]);
      setHasStartedChat(true);
      
      // Step 3: Process the API call separately after UI update
      setTimeout(() => {
        originalHandleSendMessage(messageText, imageFile);
      }, 10);
      
    } else {
      // For subsequent messages, add to existing UI immediately
      const userMessageId = crypto.randomUUID();
      const userMessage = {
        id: userMessageId,
        role: 'user' as const,
        content: messageText,
        timestamp: new Date(),
        imageUrl: null, // Will be updated after upload if needed
      };
      
      const placeholderId = crypto.randomUUID();
      const placeholderMessage = {
        id: placeholderId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Update state with both messages in one operation
      setMessages(prev => [...prev, userMessage, placeholderMessage]);
      
      // Process the API call separately
      setTimeout(() => {
        originalHandleSendMessage(messageText, imageFile);
      }, 10);
    }
  }, [originalHandleSendMessage, hasStartedChatRef, createWelcomeMessage, setMessages]);

  // Handle example click with improved UI transition
  const handleExampleClick = useCallback((question: string) => {
    console.log("[usePgChatInterface] handleExampleClick called with:", question);
    
    if (!hasStartedChatRef.current) {
      console.log("[usePgChatInterface] First example - transitioning to chat UI with complete initial state");
      
      // Prepare all initial UI elements in one update
      const welcomeMessage = createWelcomeMessage();
      const userMessageId = crypto.randomUUID();
      const userMessage = {
        id: userMessageId,
        role: 'user' as const,
        content: question,
        timestamp: new Date(),
      };
      
      const placeholderId = crypto.randomUUID();
      const placeholderMessage = {
        id: placeholderId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Update UI state with ALL messages in a single operation
      setMessages([welcomeMessage, userMessage, placeholderMessage]);
      setHasStartedChat(true);
    } else {
      // For subsequent examples, add to existing UI immediately
      const userMessageId = crypto.randomUUID();
      const userMessage = {
        id: userMessageId,
        role: 'user' as const,
        content: question,
        timestamp: new Date(),
      };
      
      const placeholderId = crypto.randomUUID();
      const placeholderMessage = {
        id: placeholderId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Update state with both messages in one operation
      setMessages(prev => [...prev, userMessage, placeholderMessage]);
    }
    
    // Process the API call separately
    setTimeout(() => {
      originalHandleExampleClick(question);
    }, 10);
  }, [originalHandleExampleClick, hasStartedChatRef, createWelcomeMessage, setMessages]);

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
