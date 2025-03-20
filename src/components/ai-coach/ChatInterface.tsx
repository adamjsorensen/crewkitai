
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useChat } from './chat/useChat';
import MessageList from './chat/MessageList';
import ChatMessageInput from './chat/ChatMessageInput';
import ImagePreview from './chat/ImagePreview';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageSkeleton from './chat/MessageSkeleton';

// Lazy load WelcomeSection for better initial load performance
const WelcomeSection = lazy(() => import('./chat/WelcomeSection'));

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

interface ChatInterfaceProps {
  conversationId?: string | null;
  isNewChat?: boolean;
  onConversationCreated?: (id: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId = null,
  isNewChat = true,
  onConversationCreated
}) => {
  console.log("[ChatInterface] Render - conversationId:", conversationId, "isNewChat:", isNewChat);
  
  const { user } = useAuth();
  const isMobile = useIsMobile();
  // Track if a message has been sent
  const [hasInteracted, setHasInteracted] = useState(false);
  // Track if we're showing loading state while immediately transitioning
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    console.log("[ChatInterface] Component mounted, isMobile:", isMobile);
    
    return () => {
      console.log("[ChatInterface] Component unmounting");
    };
  }, [isMobile]);
  
  const {
    input,
    setInput,
    messages,
    isLoading,
    isLoadingHistory,
    error,
    imageFile,
    imagePreviewUrl,
    isUploading,
    showScrollButton,
    isThinkMode,
    setIsThinkMode,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    handleImageClick,
    handleImageChange,
    removeImage,
    handleSendMessage: originalHandleSendMessage,
    handleKeyDown,
    handleExampleClick: originalHandleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    scrollToBottom
  } = useChat(conversationId, isNewChat, onConversationCreated);

  // Wrap the send message handler to track interaction and show immediate loading
  const handleSendMessage = () => {
    if (!input.trim() && !imageFile) return;
    console.log("[ChatInterface] Message send initiated");
    setHasInteracted(true);
    setIsTransitioning(true);
    originalHandleSendMessage();
  };

  // Wrap the example click handler to track interaction and show immediate loading
  const handleExampleClick = (question: string) => {
    console.log("[ChatInterface] Example clicked:", question);
    setHasInteracted(true);
    setIsTransitioning(true);
    setInput(question);
    // Small delay to ensure state updates before sending
    setTimeout(() => {
      originalHandleExampleClick(question);
    }, 50);
  };

  // Reset interaction state when starting a new chat
  useEffect(() => {
    if (isNewChat && !conversationId && messages.length <= 1) {
      console.log("[ChatInterface] Resetting interaction state");
      setHasInteracted(false);
      setIsTransitioning(false);
    }
  }, [isNewChat, conversationId, messages.length]);

  // Reset transitioning state once loading is complete
  useEffect(() => {
    if (!isLoading && isTransitioning) {
      console.log("[ChatInterface] Resetting transitioning state");
      setIsTransitioning(false);
    }
  }, [isLoading, isTransitioning]);

  // Log when welcome section should be shown
  useEffect(() => {
    const showWelcome = isNewChat && !conversationId && !hasInteracted && messages.length <= 1;
    console.log("[ChatInterface] Welcome section visibility:", showWelcome, "hasInteracted:", hasInteracted);
  }, [isNewChat, conversationId, messages.length, hasInteracted]);

  if (isLoadingHistory) {
    console.log("[ChatInterface] Loading history...");
    return <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>;
  }

  // Determine whether to show welcome or conversation view
  // Show welcome section only when it's a new chat with no messages and user hasn't interacted
  const showWelcome = isNewChat && !conversationId && !hasInteracted && messages.length <= 1;

  return (
    <div className={`flex flex-col h-full max-h-[85vh] relative overflow-hidden ${isMobile ? 'pt-2' : ''}`}>
      {showWelcome ? (
        <Suspense fallback={<MessageSkeleton />}>
          <WelcomeSection onCategorySelect={handleExampleClick} />
        </Suspense>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<MessageSkeleton />}>
            <MessageList 
              messages={messages}
              isLoading={isLoading || isTransitioning}
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
              isTransitioning={isTransitioning}
            />
          </Suspense>
        </div>
      )}
      
      <div className={`sticky bottom-0 left-0 right-0 border-t px-3 sm:px-4 py-2 sm:py-3 bg-background/95 backdrop-blur-sm ${isMobile ? 'pb-safe' : ''}`}>
        <ImagePreview 
          imagePreviewUrl={imagePreviewUrl} 
          removeImage={removeImage} 
        />
        
        <ChatMessageInput 
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isUploading={isUploading}
          imageFile={imageFile}
          handleSendMessage={handleSendMessage}
          handleImageClick={handleImageClick}
          isThinkMode={isThinkMode}
          setIsThinkMode={setIsThinkMode}
          handleKeyDown={handleKeyDown}
          user={user}
          inputRef={inputRef}
          isMobile={isMobile}
        />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ChatInterface;
