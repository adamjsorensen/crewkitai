
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
      className="flex-1 overflow-y-auto pb-28 pt-2 px-4 scroll-smooth relative"
      onScroll={() => console.log('[PgMessageList] Container scrolled')}
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {messages.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
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
          <div key={`placeholder-${message.id}`} className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <PaintBucket className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl py-3 px-4 bg-muted max-w-[75%]">
              <TypingIndicator withIcon={false} />
            </div>
          </div>
        ))}
        
        {/* Fallback loading indicator when needed */}
        {shouldShowFallbackIndicator && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <PaintBucket className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl py-3 px-4 bg-muted max-w-[75%]">
              <TypingIndicator withIcon={false} />
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Show suggested follow-ups */}
        {messages.length > 0 && !isLoading && (
          <div className="pt-1">
            {messages[messages.length - 1].role === 'assistant' && 
             messages[messages.length - 1].suggestedFollowUps && 
             messages[messages.length - 1].suggestedFollowUps.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="w-full text-sm font-medium text-muted-foreground mb-1">
                  Suggested questions:
                </div>
                {messages[messages.length - 1].suggestedFollowUps!.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
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
        <div ref={messagesEndRef} />
      </div>
      
      {/* Adjusted scroll button to be just above the chatbox */}
      {showScrollButton && (
        <div className="fixed bottom-[72px] left-0 right-0 w-full flex justify-center items-center z-10">
          <Button
            variant="default"
            size="sm"
            className={cn(
              "shadow-md border border-primary/20",
              "bg-primary text-white px-4 rounded-full transition-all",
              "flex items-center gap-1.5 hover:bg-primary/90 animate-bounce-light"
            )}
            onClick={handleScrollClick}
          >
            <span className="text-xs font-medium">New messages</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PgMessageList;
