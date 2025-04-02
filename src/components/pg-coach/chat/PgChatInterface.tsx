
import React, { useState, useRef } from 'react';
import { usePgChatState } from './usePgChatState';
import PgChatHeader from './PgChatHeader';
import PgChatWindow from './PgChatWindow';
import PgChatInput from './PgChatInput';
import PgChatWelcome from './PgChatWelcome';
import WelcomeSkeleton from './WelcomeSkeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PgChatInterfaceProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
  onNewChat?: () => void;
  onOpenHistory: () => void;
}

const PgChatInterface: React.FC<PgChatInterfaceProps> = ({
  conversationId,
  onConversationStart,
  onNewChat,
  onOpenHistory
}) => {
  const {
    hasStartedChat,
    messages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    businessProfileUsed,
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleExampleClick,
    handleRetry,
    handleToggleThinkMode,
    scrollToBottom,
    handleNewChat
  } = usePgChatState({
    conversationId,
    onConversationStart,
    onNewChat
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Function to handle file selection
  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PgChatHeader 
        isThinkMode={isThinkMode} 
        onToggleThinkMode={handleToggleThinkMode}
        onNewChat={handleNewChat}
        onOpenHistory={onOpenHistory}
      />
      
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-auto"
            >
              Retry
            </Button>
          )}
        </Alert>
      )}
      
      {/* Business profile info alert */}
      {businessProfileUsed && (
        <Alert variant="default" className="mx-4 mt-2 bg-muted/50 border-muted">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground">
            Your business information is being used to personalize responses. 
            Update your profile in settings for more tailored advice.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden relative">
        {isLoadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <WelcomeSkeleton />
          </div>
        ) : !hasStartedChat ? (
          <PgChatWelcome onExampleClick={handleExampleClick} />
        ) : (
          <ScrollArea ref={messagesContainerRef} className="h-full pb-4">
            <PgChatWindow 
              messages={messages} 
              isLoading={isLoading} 
              onFollowUpClick={handleExampleClick} 
            />
            <div ref={messagesEndRef} />
          </ScrollArea>
        )}

        {showScrollButton && hasStartedChat && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        )}
      </div>

      <PgChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        selectedImage={selectedImage}
        onImageSelect={handleImageSelect}
      />
    </div>
  );
};

export default PgChatInterface;
