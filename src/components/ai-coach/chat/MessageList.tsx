
import React, { useState, useEffect, useRef } from 'react';
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
  const renderCountRef = useRef(0);
  const prevMessagesRef = useRef<Message[]>([]);
  
  // Example questions that might appear if no suggested follow-ups are available
  const defaultExampleQuestions = [
    "How can I charge more for my painting services?",
    "What's the best way to handle difficult clients?",
    "How do I estimate a kitchen cabinet painting job?",
    "What marketing strategies work best for painters?"
  ];
  
  // Track the last AI message with suggestions
  const lastAiMessageWithSuggestions = messages
    .filter(m => m.role === 'assistant' && !m.isPlaceholder && m.suggestedFollowUps && m.suggestedFollowUps.length > 0)
    .pop();
  
  // Debug logging for renders
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[MessageList] RENDERED (count: ${renderCountRef.current})`);
    
    // Log message diff to help debug
    if (prevMessagesRef.current.length !== messages.length) {
      console.log('[MessageList] Message count changed:', {
        prev: prevMessagesRef.current.length,
        current: messages.length,
        added: messages.length - prevMessagesRef.current.length
      });
    }
    
    const placeholdersChanged = 
      prevMessagesRef.current.some(m => m.isPlaceholder) !== messages.some(m => m.isPlaceholder);
    
    if (placeholdersChanged) {
      console.log('[MessageList] Placeholder status changed:', {
        prevHadPlaceholders: prevMessagesRef.current.some(m => m.isPlaceholder),
        currentHasPlaceholders: messages.some(m => m.isPlaceholder),
        placeholders: messages.filter(m => m.isPlaceholder).map(m => m.id)
      });
    }
    
    // Update ref
    prevMessagesRef.current = [...messages];
  });
  
  // Debug logging for messages changes
  useEffect(() => {
    console.log('[MessageList] Messages updated, count:', messages.length);
    console.log('[MessageList] Message breakdown:', {
      user: messages.filter(m => m.role === 'user').length,
      assistant: messages.filter(m => m.role === 'assistant' && !m.isPlaceholder).length,
      placeholders: messages.filter(m => m.isPlaceholder).length,
      messageIds: messages.map(m => ({ 
        id: m.id, 
        role: m.role,
        isPlaceholder: !!m.isPlaceholder,
        contentLength: m.content?.length || 0,
        contentPreview: m.content?.substring(0, 20) + "..." || ""
      }))
    });
  }, [messages]);
  
  // Show example questions after receiving responses
  useEffect(() => {
    if (messages.length >= 2) {
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.isPlaceholder && m.id !== 'welcome');
      
      if (userMessages.length > 0 && assistantMessages.length > 0) {
        setShowExamples(true);
      }
    } else {
      setShowExamples(false);
    }
  }, [messages]);

  // Force scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Create separate lists for regular messages and placeholders
  const regularMessages = messages.filter(message => !message.isPlaceholder);
  const placeholderMessages = messages.filter(message => message.isPlaceholder);
  
  // Log when placeholder messages are detected
  useEffect(() => {
    if (placeholderMessages.length > 0) {
      console.log('[MessageList] Found placeholder messages:', 
        placeholderMessages.map(m => ({ 
          id: m.id, 
          content: m.content?.substring(0, 20) + "...",
          timestamp: m.timestamp?.toString()
        })));
    }
  }, [placeholderMessages]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto pb-32 pt-4 px-4 scroll-smooth"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No messages yet. Start a conversation!
          </div>
        )}
        
        {/* Render all regular non-placeholder messages */}
        {regularMessages.map((message) => {
          console.log(`[MessageList] Rendering regular message ${message.id}`, {
            role: message.role,
            isPlaceholder: !!message.isPlaceholder,
            contentLength: message.content?.length || 0,
            key: `${message.id}-${message.content?.length || 0}-${Date.now()}`
          });
          
          return (
            <ChatMessage
              key={`${message.id}-${message.content?.length || 0}-${Date.now()}`} // Force re-render by including length and timestamp
              message={message}
              onRegenerate={() => handleRegenerateMessage(message.id)}
              isMobile={isMobile}
            />
          );
        })}
        
        {/* Render typing indicators for placeholder messages */}
        {placeholderMessages.map((message) => {
          console.log(`[MessageList] Rendering placeholder message ${message.id}`, {
            role: message.role,
            content: message.content
          });
          return (
            <div key={`placeholder-${message.id}-${Date.now()}`} className="flex items-start space-x-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <PaintBucket className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl py-3 px-4 bg-muted max-w-[75%]">
                <TypingIndicator />
              </div>
            </div>
          );
        })}
        
        {/* Show loading indicator if loading but no placeholder exists */}
        {isLoading && !placeholderMessages.length && (
          <div className="flex items-start space-x-3 animate-fade-in">
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
        
        {/* Show suggested follow-ups or default examples */}
        {showExamples && !isLoading && (
          <>
            {lastAiMessageWithSuggestions && lastAiMessageWithSuggestions.suggestedFollowUps?.length > 0 ? (
              <ChatExampleQuestions 
                questions={lastAiMessageWithSuggestions.suggestedFollowUps} 
                onQuestionClick={handleExampleClick}
                isSuggested={true}
              />
            ) : (
              <ChatExampleQuestions 
                questions={defaultExampleQuestions} 
                onQuestionClick={handleExampleClick}
                isSuggested={false}
              />
            )}
          </>
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

export default React.memo(MessageList);
