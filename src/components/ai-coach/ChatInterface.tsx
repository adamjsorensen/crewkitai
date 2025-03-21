
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
  // Track if user has started a chat (replaces complex showWelcome logic)
  const [hasStartedChat, setHasStartedChat] = useState(!isNewChat || !!conversationId);
  
  useEffect(() => {
    console.log("[ChatInterface] Component mounted, isMobile:", isMobile, "hasStartedChat:", hasStartedChat);
    
    // Reset hasStartedChat when starting a new conversation
    if (isNewChat && !conversationId) {
      setHasStartedChat(false);
    } else {
      setHasStartedChat(true);
    }
    
    return () => {
      console.log("[ChatInterface] Component unmounting");
    };
  }, [isMobile, isNewChat, conversationId]);
  
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

  // Wrap the send message handler to also set hasStartedChat
  const handleSendMessage = () => {
    if (!input.trim() && !imageFile) return;
    console.log("[ChatInterface] Message send initiated, setting hasStartedChat to true");
    setHasStartedChat(true);
    originalHandleSendMessage();
  };

  // Wrap the example click handler to also set hasStartedChat
  const handleExampleClick = (question: string) => {
    console.log("[ChatInterface] Example clicked, setting hasStartedChat to true");
    setHasStartedChat(true);
    setInput(question);
    // Small delay to ensure state updates before sending
    setTimeout(() => {
      originalHandleExampleClick(question);
    }, 50);
  };

  if (isLoadingHistory) {
    console.log("[ChatInterface] Loading history...");
    return <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>;
  }

  console.log("[ChatInterface] Rendering with hasStartedChat:", hasStartedChat, "messages.length:", messages.length);

  return (
    <div className="flex flex-col h-full max-h-[85vh] relative">
      {!hasStartedChat ? (
        <Suspense fallback={<MessageSkeleton />}>
          <WelcomeSection onCategorySelect={handleExampleClick} />
        </Suspense>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
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
      )}
      
      <div className={`sticky bottom-0 left-0 right-0 border-t px-3 sm:px-4 py-2 sm:py-3 bg-background/95 backdrop-blur-sm mt-auto ${isMobile ? 'pb-safe' : ''}`}>
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
