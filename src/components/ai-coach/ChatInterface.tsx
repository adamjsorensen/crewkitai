
import React, { Suspense, memo, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import WelcomeSection from './chat/WelcomeSection';
import MessageSkeleton from './chat/MessageSkeleton';
import ChatHeader from './chat/ChatHeader';
import ChatContent from './chat/ChatContent';
import ChatInputArea from './chat/ChatInputArea';
import { useChatInterface } from './chat/useChatInterface';

interface ChatInterfaceProps {
  conversationId?: string | null;
  isNewChat?: boolean;
  onConversationCreated?: (id: string) => void;
  onNewChat?: () => void;
  onHistoryClick?: () => void;
  onBackToWelcome?: () => void;
}

// Memoize the entire ChatInterface component to prevent unnecessary re-renders
const ChatInterface: React.FC<ChatInterfaceProps> = memo(({
  conversationId = null,
  isNewChat = true,
  onConversationCreated,
  onNewChat,
  onHistoryClick,
  onBackToWelcome
}) => {
  console.log(`[ChatInterface] Render - conversationId:`, conversationId, "isNewChat:", isNewChat);
  
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    hasStartedChat,
    setHasStartedChat,
    handleBackToWelcome,
    handleNewChatClick,
    handleSendMessage,
    handleExampleClick,
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
    handleKeyDown,
    handleRetry,
    handleRegenerateMessage,
    scrollToBottom
  } = useChatInterface({
    conversationId,
    isNewChat,
    onConversationCreated,
    onNewChat,
    onBackToWelcome
  });

  // Preload both UI states on initial render to prevent delays
  const welcomeUI = (
    <Suspense fallback={<MessageSkeleton />}>
      <WelcomeSection 
        onCategorySelect={(question) => {
          console.log("[ChatInterface] Example clicked, transitioning to chat UI immediately");
          // First transition to chat UI
          setHasStartedChat(true);
          // Then handle the example after UI transition
          setTimeout(() => handleExampleClick(question), 0);
        }} 
        onNewChat={onNewChat}
        onHistoryClick={onHistoryClick}
      />
    </Suspense>
  );

  const chatUI = (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <ChatHeader 
        onBackClick={handleBackToWelcome}
        onNewChatClick={handleNewChatClick}
      />
      
      <ChatContent 
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
        handleExampleClick={(question) => {
          // Handle example clicks within chat view
          handleExampleClick(question);
        }}
        isMobile={isMobile}
      />
    </div>
  );

  // Custom send message handler that guarantees UI transition before API call
  const handleSendWithUITransition = () => {
    if (!input.trim() && !imageFile) return;
    
    console.log("[ChatInterface] Message send initiated, transitioning to chat UI immediately");
    // First, ensure we're in chat UI mode
    setHasStartedChat(true);
    
    // Then handle the message sending in the next event loop tick
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] relative">
      {/* Simply switch between the two UI states */}
      {hasStartedChat ? chatUI : welcomeUI}
      
      <ChatInputArea 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isUploading={isUploading}
        imageFile={imageFile}
        imagePreviewUrl={imagePreviewUrl}
        removeImage={removeImage}
        handleSendMessage={handleSendWithUITransition}
        handleImageClick={handleImageClick}
        isThinkMode={isThinkMode}
        setIsThinkMode={setIsThinkMode}
        handleKeyDown={(e) => {
          // Ensure Enter key also triggers the UI transition
          if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isUploading) {
            e.preventDefault();
            handleSendWithUITransition();
          } else {
            handleKeyDown(e);
          }
        }}
        user={user}
        inputRef={inputRef}
        isMobile={isMobile}
      />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
});

// Add display name for debugging
ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
