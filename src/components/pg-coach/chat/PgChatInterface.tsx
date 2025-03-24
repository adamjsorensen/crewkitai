
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePgChatState } from './usePgChatState';
import PgWelcomeSection from '../PgWelcomeSection';
import { PgChatActiveState } from './PgChatStates';

interface PgChatInterfaceProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
  onNewChat?: () => void;
  onOpenHistory: () => void;
}

const PgChatInterface: React.FC<PgChatInterfaceProps> = ({ 
  conversationId: initialConversationId,
  onConversationStart,
  onNewChat,
  onOpenHistory
}) => {
  const isMobile = useIsMobile();
  
  // Use our custom hook for chat state management
  const {
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
  } = usePgChatState({
    conversationId: initialConversationId,
    onConversationStart,
    onNewChat
  });

  // Render welcome UI if chat hasn't started
  if (!hasStartedChat) {
    return (
      <PgWelcomeSection 
        onExampleClick={handleExampleClick} 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onNewChat={handleNewChat}
        onOpenHistory={onOpenHistory}
        isThinkMode={isThinkMode}
        onToggleThinkMode={handleToggleThinkMode}
      />
    );
  }

  return (
    <PgChatActiveState
      messages={messages}
      isLoading={isLoading}
      isLoadingHistory={isLoadingHistory}
      error={error}
      handleRetry={handleRetry}
      showScrollButton={showScrollButton}
      scrollToBottom={scrollToBottom}
      messagesEndRef={messagesEndRef}
      messagesContainerRef={messagesContainerRef}
      handleExampleClick={handleExampleClick}
      handleSendMessage={handleSendMessage}
      handleNewChat={handleNewChat}
      onOpenHistory={onOpenHistory}
      isMobile={isMobile}
      isThinkMode={isThinkMode}
      onToggleThinkMode={handleToggleThinkMode}
    />
  );
};

export default PgChatInterface;
