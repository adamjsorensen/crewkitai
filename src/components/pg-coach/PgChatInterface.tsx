import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollManagement } from '@/hooks/useScrollManagement';
import PgMessageList from './PgMessageList';
import PgChatInput from './PgChatInput';
import PgWelcomeSection from './PgWelcomeSection';
import PgChatHeader from './PgChatHeader';
import { usePgChat, PgMessage } from '@/hooks/usePgChat';

interface PgChatInterfaceProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
  onNewChat?: () => void;
}

const PgChatInterface: React.FC<PgChatInterfaceProps> = ({ 
  conversationId: initialConversationId,
  onConversationStart,
  onNewChat
}) => {
  const isMobile = useIsMobile();
  
  // State for tracking UI transition
  const [hasStartedChat, setHasStartedChat] = useState(() => !!initialConversationId);
  
  // Use our custom scroll management hook
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
      // Create welcome message
      const welcomeMessage: PgMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
        timestamp: new Date(),
      };
      
      // Create user message
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        imageUrl: null, // Will be updated after upload if needed
      };
      
      // Create placeholder for loading
      const placeholderMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // First update UI to show messages
      setMessages([welcomeMessage, userMessage, placeholderMessage]);
      // Then transition to chat UI
      setHasStartedChat(true);
      
      // Then handle API call after UI has updated
      setTimeout(() => {
        apiSendMessage(messageText, imageFile);
      }, 150);
    } else {
      // Regular message flow for subsequent messages
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        imageUrl: null,
      };
      
      const placeholderMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Add messages to UI first
      setMessages(prev => [...prev, userMessage, placeholderMessage]);
      
      // Then make API call
      setTimeout(() => {
        apiSendMessage(messageText, imageFile);
      }, 100);
    }
  };

  // Handle example question clicks
  const handleExampleClick = (question: string) => {
    if (!hasStartedChat) {
      // Create welcome message
      const welcomeMessage: PgMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
        timestamp: new Date(),
      };
      
      // Create user message
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      
      // Create placeholder for loading
      const placeholderMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Update UI first
      setMessages([welcomeMessage, userMessage, placeholderMessage]);
      setHasStartedChat(true);
      
      // Then handle API call
      setTimeout(() => {
        apiSendMessage(question);
      }, 150);
    } else {
      // For subsequent examples
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      
      const placeholderMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      // Add to UI first
      setMessages(prev => [...prev, userMessage, placeholderMessage]);
      
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

  // Render welcome UI if chat hasn't started
  if (!hasStartedChat) {
    return (
      <PgWelcomeSection 
        onExampleClick={handleExampleClick} 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onNewChat={handleNewChat}
        isThinkMode={isThinkMode}
        onToggleThinkMode={handleToggleThinkMode}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background">
        <PgChatHeader 
          onNewChat={handleNewChat}
        />
      </div>
      
      {/* Scrollable message area with flex-1 to take available space */}
      <div className="flex-1 overflow-hidden relative">
        <PgMessageList
          messages={messages}
          isLoading={isLoading || isLoadingHistory}
          error={error}
          handleRetry={handleRetry}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          handleExampleClick={handleExampleClick}
          isMobile={isMobile}
        />
      </div>
      
      {/* Input at the bottom */}
      <div className="bg-background z-10">
        <PgChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          isMobile={isMobile}
          isThinkMode={isThinkMode}
          onToggleThinkMode={handleToggleThinkMode}
        />
      </div>
    </div>
  );
};

export default PgChatInterface;
