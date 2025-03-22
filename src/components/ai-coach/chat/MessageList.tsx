
import React, { useEffect, memo, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ArrowDown } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import { PaintBucket } from 'lucide-react';
import MessageSkeleton from './MessageSkeleton';
import { useInView } from 'react-intersection-observer';
import { Message } from './types';

interface MessageListProps {
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
  isMobile?: boolean;
}

// Calculate visible messages for better performance
const useVisibleMessages = (messages: Message[], isMobile: boolean) => {
  return useMemo(() => {
    const isWelcomeMessage = messages.length === 1 && messages[0].id === 'welcome';
    
    // Show empty state if we're just starting
    if (messages.length === 0 || (isWelcomeMessage && messages.length <= 1)) {
      return [];
    }
    
    // Limit visible messages on mobile for better performance
    if (isMobile && messages.length > 15) {
      return messages.slice(Math.max(0, messages.length - 15));
    }
    
    return messages;
  }, [messages, isMobile]);
};

// Extract EmptyState into a separate component
const EmptyState = memo(() => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">
        Starting conversation...
      </p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

// Extract LoadingState into a separate component
const LoadingState = memo(() => (
  <div className="h-full px-3 sm:px-4 pt-4">
    <MessageSkeleton />
    <MessageSkeleton />
  </div>
));
LoadingState.displayName = 'LoadingState';

// Extract ErrorMessage into a separate component
const ErrorMessage = memo(({ error, handleRetry }: { error: string, handleRetry: () => void }) => (
  <div className="flex items-center space-x-2 p-3 text-destructive bg-destructive/10 rounded-md animate-fade-in my-4 max-w-md mx-auto">
    <AlertCircle className="h-4 w-4" />
    <span className="text-sm">{error}</span>
    <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
      Retry
    </Button>
  </div>
));
ErrorMessage.displayName = 'ErrorMessage';

// Typing indicator component
const TypingMessage = memo(() => (
  <div className="flex items-start gap-3 animate-fade-in my-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
      <PaintBucket className="h-4 w-4 text-white" />
    </div>
    <div className="rounded-2xl p-4 bg-muted/70 shadow-sm">
      <TypingIndicator />
    </div>
  </div>
));
TypingMessage.displayName = 'TypingMessage';

// ScrollToBottomButton component
const ScrollToBottomButton = memo(({ onClick, isMobile }: { onClick: () => void, isMobile?: boolean }) => (
  <Button
    variant="outline"
    size="icon"
    className={`fixed bottom-28 right-4 sm:right-8 rounded-full shadow-md bg-background z-20 border border-border/50 ${isMobile ? 'h-10 w-10' : ''}`}
    onClick={onClick}
  >
    <ArrowDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
  </Button>
));
ScrollToBottomButton.displayName = 'ScrollToBottomButton';

// Main MessageList component
const MessageList: React.FC<MessageListProps> = memo(({
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
  isMobile = false
}) => {
  const { ref: bottomInViewRef, inView: isBottomInView } = useInView({
    threshold: 0.1,
  });

  // Use memoized visible messages
  const visibleMessages = useVisibleMessages(messages, isMobile);

  // Determine if we should show the empty state - moved outside component body
  const showEmptyState = useMemo(() => {
    const isWelcomeMessage = messages.length === 1 && messages[0].id === 'welcome';
    return messages.length === 0 || (isWelcomeMessage && messages.length <= 1);
  }, [messages]);

  useEffect(() => {
    // Ensure scroll to bottom on initial render and when messages change
    if (messages.length > 0 && !isLoadingHistory) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, scrollToBottom, isLoadingHistory]);

  // IMPORTANT: Always create messageComponents regardless of conditional rendering
  // This ensures hooks are always called in the same order
  const messageComponents = useMemo(() => (
    visibleMessages.map(message => (
      <ChatMessage 
        key={message.id} 
        message={message} 
        onRegenerate={handleRegenerateMessage}
        isMobile={isMobile}
      />
    ))
  ), [visibleMessages, handleRegenerateMessage, isMobile]);

  // Conditional rendering with early returns for better performance
  if (isLoadingHistory) {
    return <LoadingState />;
  }

  if (showEmptyState) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex-1 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent h-6 pointer-events-none" />
      
      <ScrollArea 
        ref={messagesContainerRef} 
        className="h-full px-3 sm:px-4 pt-4 pb-24 overflow-y-auto flex-1"
      >
        <div className="space-y-1 pb-24 max-w-3xl mx-auto"> 
          {messageComponents}
          
          {isLoading && <TypingMessage />}
          
          {error && <ErrorMessage error={error} handleRetry={handleRetry} />}
          
          <div ref={messagesEndRef} />
          <div ref={bottomInViewRef} className="h-1" />
        </div>
      </ScrollArea>
      
      {showScrollButton && !isBottomInView && (
        <ScrollToBottomButton onClick={scrollToBottom} isMobile={isMobile} />
      )}
    </div>
  );
});

// Add display name for debugging
MessageList.displayName = 'MessageList';

export default MessageList;
