
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
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
  onNewChat?: () => void;
  onHistoryClick?: () => void;
  onBackToWelcome?: () => void;
}

// Keep a render counter outside the component to track re-renders
let renderCount = 0;

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId = null,
  isNewChat = true,
  onConversationCreated,
  onNewChat,
  onHistoryClick,
  onBackToWelcome
}) => {
  renderCount++;
  console.log(`[ChatInterface] Render #${renderCount} - conversationId:`, conversationId, "isNewChat:", isNewChat, "props:", { conversationId, isNewChat, onConversationCreated });
  
  const { user } = useAuth();
  const isMobile = useIsMobile();
  // Track if user has started a chat (replaces complex showWelcome logic)
  const [hasStartedChat, setHasStartedChat] = useState(() => {
    // Calculate initial state only once during component initialization
    const initialValue = !isNewChat || !!conversationId;
    console.log("[ChatInterface] Initial hasStartedChat:", initialValue);
    return initialValue;
  });
  
  // Update hasStartedChat ONLY when props change, with proper dependency tracking
  useEffect(() => {
    // This effect should only run when conversationId or isNewChat actually change
    console.log("[ChatInterface] Props changed - updating state accordingly");
    
    if (conversationId) {
      // If we have a conversation ID, we're in an existing chat
      if (!hasStartedChat) {
        console.log("[ChatInterface] Setting hasStartedChat to true because conversationId exists");
        setHasStartedChat(true);
      }
    } else if (isNewChat) {
      // For a new chat, reset the hasStartedChat flag
      console.log("[ChatInterface] Setting hasStartedChat to false for new chat");
      setHasStartedChat(false);
    }
    // The check against current state value prevents unnecessary state updates
    
    return () => {
      console.log("[ChatInterface] Effect cleanup");
    };
  }, [conversationId, isNewChat]); // ONLY depend on the props, not on internal state
  
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

  // Wrap the send message handler
  const handleSendMessage = () => {
    if (!input.trim() && !imageFile) return;
    console.log("[ChatInterface] Message send initiated");
    
    // Only update if current state is false to avoid unnecessary re-renders
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    
    originalHandleSendMessage();
  };

  // Wrap the example click handler
  const handleExampleClick = (question: string) => {
    console.log("[ChatInterface] Example clicked");
    
    // Only update if current state is false to avoid unnecessary re-renders
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    
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
          <WelcomeSection 
            onCategorySelect={handleExampleClick} 
            onNewChat={onNewChat}
            onHistoryClick={onHistoryClick}
          />
        </Suspense>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* Top navigation bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-2 bg-background/95 backdrop-blur-sm border-b">
            <button
              onClick={() => setHasStartedChat(false)}
              className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="ml-1">Back to AI Coach</span>
            </button>
            <button
              onClick={() => {
                setInput("");
                removeImage();
                setHasStartedChat(false);
                if (onNewChat) onNewChat();
              }}
              className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="mr-1">New Chat</span>
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
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
      
      <div className="fixed bottom-0 md:left-[4.5rem] left-0 right-0 border-t px-3 sm:px-4 py-2 sm:py-3 bg-background/95 backdrop-blur-sm z-20">
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
