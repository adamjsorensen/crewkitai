
import React from 'react';
import PgChatInput from '../PgChatInput';
import PgMessageList from '../PgMessageList';
import PgChatHeader from '../PgChatHeader';
import { PgMessage } from '@/hooks/usePgChat';

interface PgChatActiveStateProps {
  messages: PgMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  handleRetry: () => void;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  handleExampleClick: (question: string) => void;
  handleSendMessage: (messageText: string, imageFile?: File | null) => void;
  handleNewChat: () => void;
  onOpenHistory: () => void;
  isMobile: boolean;
  isThinkMode: boolean;
  onToggleThinkMode: () => void;
}

export const PgChatActiveState: React.FC<PgChatActiveStateProps> = ({
  messages,
  isLoading,
  isLoadingHistory,
  error,
  handleRetry,
  showScrollButton,
  scrollToBottom,
  messagesEndRef,
  messagesContainerRef,
  handleExampleClick,
  handleSendMessage,
  handleNewChat,
  onOpenHistory,
  isMobile,
  isThinkMode,
  onToggleThinkMode
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background">
        <PgChatHeader 
          onNewChat={handleNewChat}
          onOpenHistory={onOpenHistory}
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
          onToggleThinkMode={onToggleThinkMode}
        />
      </div>
    </div>
  );
};
