
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ArrowDown } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import { PaintBucket } from 'lucide-react';
import WelcomeSection from './WelcomeSection';
import MessageSkeleton from './MessageSkeleton';
import { useInView } from 'react-intersection-observer';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

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
  isTransitioning?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
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
  isMobile = false,
  isTransitioning = false
}) => {
  const isWelcomeScreen = messages.length === 1 && messages[0].id === 'welcome';
  const { ref: bottomInViewRef, inView: isBottomInView } = useInView({
    threshold: 0.1,
  });

  // Limit visible messages to improve performance on mobile
  const visibleMessages = isMobile && messages.length > 15
    ? messages.slice(Math.max(0, messages.length - 15))
    : messages;

  if (isLoadingHistory) {
    return (
      <div className="h-full px-3 sm:px-4 pt-4">
        <MessageSkeleton />
        <MessageSkeleton />
      </div>
    );
  }

  // Show an empty state with loading indicator if we're transitioning from welcome to chat
  // or if there are no messages yet
  const isEmptyOrTransitioning = (messages.length === 0 || (isTransitioning && messages.length <= 1)) && !isWelcomeScreen;
  
  if (isEmptyOrTransitioning) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isTransitioning ? "Processing your message..." : "Starting conversation..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent h-6 pointer-events-none" />
      
      <ScrollArea 
        ref={messagesContainerRef} 
        className={`h-full px-3 sm:px-4 pt-4 overflow-y-auto`}
      >
        {isWelcomeScreen ? (
          <WelcomeSection onCategorySelect={handleExampleClick} />
        ) : (
          <div className="space-y-1 pb-4 max-w-3xl mx-auto">
            {visibleMessages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onRegenerate={handleRegenerateMessage}
                isMobile={isMobile}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in my-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
                  <PaintBucket className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl p-4 bg-muted/70 shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center space-x-2 p-3 text-destructive bg-destructive/10 rounded-md animate-fade-in my-4 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                  Retry
                </Button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            <div ref={bottomInViewRef} className="h-1" />
          </div>
        )}
      </ScrollArea>
      
      {showScrollButton && !isWelcomeScreen && !isBottomInView && (
        <Button
          variant="outline"
          size="icon"
          className={`absolute bottom-28 right-4 sm:right-8 rounded-full shadow-md bg-background z-10 border border-border/50 ${isMobile ? 'h-10 w-10' : ''}`}
          onClick={scrollToBottom}
        >
          <ArrowDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
        </Button>
      )}
    </div>
  );
};

export default MessageList;
