
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useChat } from './chat/useChat';
import MessageList from './chat/MessageList';
import ChatMessageInput from './chat/ChatMessageInput';
import ImagePreview from './chat/ImagePreview';
import ProgressBar from './chat/ProgressBar';
import ThinkModeIndicator from './chat/ThinkModeIndicator';
import TypingFeedback from './chat/TypingFeedback';

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
    handleFollowUpQuestion,
    handleExplainFurther,
    scrollToBottom
  } = useChat(conversationId, isNewChat, onConversationCreated);

  if (isLoadingHistory) {
    return <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>;
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh] relative overflow-hidden">
      {/* Progress Bar */}
      <ProgressBar isActive={isLoading} />
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          error={error}
          handleRetry={handleRetry}
          handleRegenerateMessage={handleRegenerateMessage}
          handleFollowUpQuestion={handleFollowUpQuestion}
          handleExplainFurther={handleExplainFurther}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          handleExampleClick={handleExampleClick}
        />
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 border-t px-4 py-3 bg-background/95 backdrop-blur-sm relative">
        <ThinkModeIndicator isActive={isThinkMode} />
        
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
        />
        
        {input.length > 0 && (
          <div className="px-1">
            <TypingFeedback 
              currentLength={input.length} 
              maxLength={4000}
            />
          </div>
        )}
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
