
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import PgMessageList from './PgMessageList';
import PgChatInput from './PgChatInput';
import PgWelcomeSection from './PgWelcomeSection';
import PgChatHeader from './PgChatHeader';
import { usePgChat } from '@/hooks/usePgChat';

interface PgChatInterfaceProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
}

const PgChatInterface: React.FC<PgChatInterfaceProps> = ({ 
  conversationId: initialConversationId,
  onConversationStart
}) => {
  const isMobile = useIsMobile();
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    hasStartedChat,
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleRetry,
    handleExampleClick,
    handleToggleThinkMode,
    handleNewChat,
    scrollToBottom,
  } = usePgChat({
    initialConversationId,
    onConversationStart
  });

  if (!hasStartedChat) {
    return <PgWelcomeSection onExampleClick={handleExampleClick} onNewChat={handleNewChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <PgChatHeader 
        isThinkMode={isThinkMode}
        onToggleThinkMode={handleToggleThinkMode}
        onNewChat={handleNewChat}
      />
      
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
      
      <PgChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        isMobile={isMobile}
      />
    </div>
  );
};

export default PgChatInterface;
