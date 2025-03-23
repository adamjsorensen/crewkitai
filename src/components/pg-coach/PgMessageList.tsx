
import React from 'react';
import { ChevronDown, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PgMessage from './PgMessage';
import { PgMessage as PgMessageType } from '@/hooks/usePgChat';
import TypingIndicator from '@/components/ai-coach/TypingIndicator';
import { cn } from '@/lib/utils';

interface PgMessageListProps {
  messages: PgMessageType[];
  isLoading: boolean;
  error: string | null;
  handleRetry: () => void;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  handleExampleClick: (question: string) => void;
  isMobile: boolean;
}

const PgMessageList: React.FC<PgMessageListProps> = ({
  messages,
  isLoading,
  error,
  handleRetry,
  showScrollButton,
  scrollToBottom,
  messagesEndRef,
  messagesContainerRef,
  handleExampleClick,
  isMobile
}) => {
  // Split messages into regular and placeholder messages
  const regularMessages = messages.filter(message => !message.isPlaceholder);
  const placeholderMessages = messages.filter(message => message.isPlaceholder);
  
  // Create a fallback loading indicator if no placeholder exists but isLoading is true
  const shouldShowFallbackIndicator = isLoading && placeholderMessages.length === 0 && regularMessages.length > 0;
  
  // Handle the scroll button click with logging
  const handleScrollClick = () => {
    console.log('[PgMessageList] Scroll button clicked');
    scrollToBottom();
  };
  
  return (
    <div
      ref={messagesContainerRef}
      className="h-full overflow-y-auto pb-1 px-2.5 scroll-smooth"
      onScroll={() => console.log('[PgMessageList] Container scrolled')}
    >
      <div className="max-w-3xl mx-auto space-y-1.5 mt-1">
        {messages.length === 0 && (
          <div className="p-1.5 text-center text-muted-foreground text-sm">
            No messages yet. Start a conversation!
          </div>
        )}
        
        {/* Render all regular non-placeholder messages */}
        {regularMessages.map((message) => (
          <PgMessage 
            key={`msg-${message.id}`}
            message={message}
            isMobile={isMobile}
          />
        ))}
        
        {/* Render typing indicators for placeholder messages */}
        {placeholderMessages.map((message) => (
          <div key={`placeholder-${message.id}`} className="flex items-start space-x-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <PaintBucket className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl py-2.5 px-3.5 bg-muted max-w-[75%] border border-border/30 shadow-sm">
              <TypingIndicator withIcon={false} />
            </div>
          </div>
        ))}
        
        {/* Fallback loading indicator when needed */}
        {shouldShowFallbackIndicator && (
          <div className="flex items-start space-x-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <PaintBucket className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-2xl py-2.5 px-3.5 bg-muted max-w-[75%] border border-border/30 shadow-sm">
              <TypingIndicator withIcon={false} />
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-2 bg-red-50 text-red-800 rounded-md text-sm border border-red-200 shadow-sm">
            <p className="font-medium">Error</p>
            <p className="text-xs">{error}</p>
            <Button 
              variant="outline" 
              className="mt-1 h-7 text-xs py-0 border-red-300 hover:bg-red-50" 
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Show suggested follow-ups */}
        {messages.length > 0 && !isLoading && (
          <div className="pt-0.5">
            {messages[messages.length - 1].role === 'assistant' && 
             messages[messages.length - 1].suggestedFollowUps && 
             messages[messages.length - 1].suggestedFollowUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                <div className="w-full text-xs font-medium text-muted-foreground mb-0.5">
                  Suggested questions:
                </div>
                {messages[messages.length - 1].suggestedFollowUps!.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 py-0 px-2 border-border/50 bg-muted/50 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                    onClick={() => handleExampleClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* This is the invisible element that we scroll to */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
      
      {/* Scroll button */}
      {showScrollButton && (
        <div className="fixed bottom-[70px] left-0 right-0 w-full flex justify-center items-center z-10">
          <Button
            variant="default"
            size="sm"
            className={cn(
              "shadow-md border border-primary/20",
              "bg-primary text-white px-3 py-0.5 h-6 rounded-full transition-all",
              "flex items-center gap-1 hover:bg-primary/90 animate-bounce-light"
            )}
            onClick={handleScrollClick}
          >
            <span className="text-xs font-medium">New messages</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PgMessageList;
