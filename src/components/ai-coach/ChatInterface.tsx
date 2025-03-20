
import React, { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useChat } from './chat/useChat';
import MessageList from './chat/MessageList';
import ChatMessageInput from './chat/ChatMessageInput';
import ImagePreview from './chat/ImagePreview';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageSkeleton from './chat/MessageSkeleton';

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
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
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
    handleSendMessage,
    handleKeyDown,
    handleExampleClick,
    handleRetry,
    handleRegenerateMessage,
    scrollToBottom
  } = useChat(conversationId, isNewChat, onConversationCreated);

  if (isLoadingHistory) {
    return <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>;
  }

  return (
    <div className={`flex flex-col h-full max-h-[85vh] relative overflow-hidden ${isMobile ? 'pt-2' : ''}`}>
      <div className="flex-1 overflow-hidden">
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
