
import React, { Suspense, memo } from 'react';
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
    onNewChat
  });

  return (
    <div className="flex flex-col h-full max-h-[85vh] relative">
      {!hasStartedChat ? (
        <Suspense fallback={<MessageSkeleton />}>
          <WelcomeSection 
            onCategorySelect={handleExampleClick} 
            onNewChat={onNewChat}
            onHistoryClick={onHistoryClick}
          />
        </Suspense>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* Top navigation bar */}
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
            handleExampleClick={handleExampleClick}
            isMobile={isMobile}
          />
        </div>
      )}
      
      <ChatInputArea 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isUploading={isUploading}
        imageFile={imageFile}
        imagePreviewUrl={imagePreviewUrl}
        removeImage={removeImage}
        handleSendMessage={handleSendMessage}
        handleImageClick={handleImageClick}
        isThinkMode={isThinkMode}
        setIsThinkMode={setIsThinkMode}
        handleKeyDown={handleKeyDown}
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
