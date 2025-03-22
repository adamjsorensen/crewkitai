
import React, { useState, useEffect } from 'react';
import { ArrowDown, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from '../ChatMessage';
import ChatExampleQuestions from './ChatExampleQuestions';
import { Message } from './types';
import TypingIndicator from '../TypingIndicator';

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
  isMobile: boolean;
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
  isMobile
}) => {
  const [showExamples, setShowExamples] = useState(false);
  
  // Example questions that might appear after a user sends a message
  const exampleQuestions = [
    "How can I charge more for my painting services?",
    "What's the best way to handle difficult clients?",
    "How do I estimate a kitchen cabinet painting job?",
    "What marketing strategies work best for painters?"
  ];
  
  useEffect(() => {
    if (messages.length >= 2) {
      // Only show examples after the AI has responded
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant' && m.id !== 'welcome');
      
      if (userMessages.length > 0 && assistantMessages.length > 0) {
        setShowExamples(true);
      }
    } else {
      setShowExamples(false);
    }
  }, [messages]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto pb-32 pt-4 px-4 scroll-smooth"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            message={message}
            onRegenerate={() => handleRegenerateMessage(message.id)}
            isMobile={isMobile}
          />
        ))}
        
        {/* AI Typing indicator when loading */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <PaintBucket className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl py-3 px-4 bg-muted max-w-[75%]">
              <TypingIndicator />
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
        
        {showExamples && (
          <ChatExampleQuestions 
            questions={exampleQuestions} 
            onQuestionClick={handleExampleClick} 
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-24 right-8 h-10 w-10 rounded-full shadow-md border border-border/60 bg-background/80 backdrop-blur-sm z-10"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default MessageList;
