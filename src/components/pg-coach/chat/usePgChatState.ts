
import { useState, useEffect } from 'react';
import { useScrollManagement } from '@/hooks/useScrollManagement';
import { usePgChat, PgMessage } from '@/hooks/usePgChat';
import { prepareInitialMessages, prepareFollowUpMessages } from './PgChatActions';

interface UsePgChatStateProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
  onNewChat?: () => void;
}

export const usePgChatState = ({
  conversationId: initialConversationId,
  onConversationStart,
  onNewChat
}: UsePgChatStateProps) => {
  // State for tracking UI transition
  const [hasStartedChat, setHasStartedChat] = useState(() => !!initialConversationId);
  
  // Use custom scroll management hook
  const {
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom
  } = useScrollManagement();
  
  // Initialize chat with API functionality
  const {
    messages,
    setMessages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    handleSendMessage: apiSendMessage,
    handleRetry,
    handleToggleThinkMode,
    handleNewChat: apiNewChat,
  } = usePgChat({
    initialConversationId,
    onConversationStart
  });

  // Update hasStartedChat when initialConversationId changes
  useEffect(() => {
    if (initialConversationId && !hasStartedChat) {
      setHasStartedChat(true);
    }
  }, [initialConversationId, hasStartedChat]);

  // Handles sending a message with proper UI transition
  const handleSendMessage = (messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    // If first message, prepare UI transition
    if (!hasStartedChat) {
      // First update UI to show messages
      setMessages(prepareInitialMessages(messageText));
      // Then transition to chat UI
      setHasStartedChat(true);
      
      // Then handle API call after UI has updated
      setTimeout(() => {
        apiSendMessage(messageText, imageFile);
      }, 150);
    } else {
      // Regular message flow for subsequent messages  
      // Add messages to UI first
      setMessages(prev => prepareFollowUpMessages(prev, messageText));
      
      // Then make API call
      setTimeout(() => {
        apiSendMessage(messageText, imageFile);
      }, 100);
    }
  };

  // Handle example question clicks
  const handleExampleClick = (question: string) => {
    if (!hasStartedChat) {
      // Update UI first
      setMessages(prepareInitialMessages(question));
      setHasStartedChat(true);
      
      // Then handle API call
      setTimeout(() => {
        apiSendMessage(question);
      }, 150);
    } else {
      // For subsequent examples
      // Add to UI first
      setMessages(prev => prepareFollowUpMessages(prev, question));
      
      // Then make API call
      setTimeout(() => {
        apiSendMessage(question);
      }, 100);
    }
  };

  // Handle new chat - now uses the page-level handler if provided
  const handleNewChat = () => {
    console.log("[PgChatInterface] New chat button clicked");
    setHasStartedChat(false);
    apiNewChat();
    
    // Call the parent handler if provided - this is key to reset page-level state
    if (onNewChat) {
      console.log("[PgChatInterface] Calling parent onNewChat handler");
      onNewChat();
    }
  };

  return {
    hasStartedChat,
    messages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleExampleClick,
    handleRetry,
    handleToggleThinkMode,
    scrollToBottom,
    handleNewChat
  };
};
