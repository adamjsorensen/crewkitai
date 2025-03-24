
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MessageList from './MessageList';
import MessageSkeleton from './MessageSkeleton';
import { Message } from './types';

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  handleRetry: () => void;
  handleRegenerateMessage: (messageId: string) => void;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  handleExampleClick: (question: string) => void;
  isMobile: boolean;
}

const ChatContent = ({
  messages,
  isLoading,
  isLoadingHistory,
  error,
  handleRetry,
  handleRegenerateMessage,
  showScrollButton,
  scrollToBottom,
  messagesEndRef,
  messagesContainerRef,
  handleExampleClick,
  isMobile
}: ChatContentProps) => {
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <Suspense fallback={<MessageSkeleton />}>
        <MessageList
          messages={messages}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          error={error}
          handleRetry={handleRetry}
          handleRegenerateMessage={handleRegenerateMessage}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          handleExampleClick={handleExampleClick}
          isMobile={isMobile}
        />
      </Suspense>
    </div>
  );
};

export default React.memo(ChatContent);
