
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ArrowDown } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import { PaintBucket } from 'lucide-react';

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
  error: string | null;
  handleRetry: () => void;
  handleRegenerateMessage: (messageId: string) => void;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  handleRetry,
  handleRegenerateMessage,
  showScrollButton,
  scrollToBottom,
  messagesEndRef,
  messagesContainerRef
}) => {
  return (
    <div className="relative flex-1">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent h-6 pointer-events-none" />
      
      <ScrollArea 
        ref={messagesContainerRef} 
        className="flex-1 px-4 pt-4"
      >
        <div className="space-y-1 pb-4 max-w-3xl mx-auto">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onRegenerate={handleRegenerateMessage} 
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
        </div>
      </ScrollArea>
      
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-28 right-8 rounded-full shadow-md bg-background z-10 border border-border/50"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default MessageList;
