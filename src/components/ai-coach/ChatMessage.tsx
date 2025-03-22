
import React, { memo, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User, BookmarkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Message } from './chat/types';
import MessageContent from './chat/MessageContent';
import MessageActions from './chat/MessageActions';
import MessageImagePreview from './chat/MessageImagePreview';
import KeyPoints from './chat/KeyPoints';
import '@/styles/streaming.css';
import { Badge } from '@/components/ui/badge';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  isMobile?: boolean;
}

// Function to extract key points
const getKeyPoints = (content: string, isAssistant: boolean, isMobile: boolean): string[] | null => {
  if (!isAssistant || isMobile) return null;
  
  // Look for lists in the content
  const listMatch = content.match(/(\n[0-9]+\.\s.+){2,}/g) || 
                    content.match(/(\n\*\s.+){2,}/g) ||
                    content.match(/(\n-\s.+){2,}/g);
  
  if (listMatch) {
    return listMatch[0]
      .split('\n')
      .filter(item => item.trim())
      .map(item => item.replace(/^[0-9]+\.\s|\*\s|-\s/, '').trim())
      .slice(0, 3); // Limit to 3 points
  }
  
  return null;
};

// Timestamp component
const MessageTimestamp = memo(({ timestamp, isAssistant, isSaved }: { 
  timestamp: Date, 
  isAssistant: boolean,
  isSaved?: boolean
}) => (
  <div 
    className={cn(
      "text-xs mt-2 flex items-center justify-between",
      isAssistant ? "text-muted-foreground/70" : "text-primary-foreground/70"
    )}
  >
    <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
    
    {isSaved && isAssistant && (
      <Badge variant="outline" className="ml-2 h-5 text-[10px] bg-primary/5 text-primary border-primary/20">
        <BookmarkIcon className="h-2.5 w-2.5 mr-0.5" />
        Saved
      </Badge>
    )}
  </div>
));
MessageTimestamp.displayName = 'MessageTimestamp';

// Avatar component
const MessageAvatar = memo(({ isAssistant }: { isAssistant: boolean }) => (
  isAssistant ? (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
      <PaintBucket className="h-4 w-4 text-white" />
    </div>
  ) : (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
      <User className="h-4 w-4 text-secondary-foreground" />
    </div>
  )
));
MessageAvatar.displayName = 'MessageAvatar';

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isMobile = false }) => {
  // Add debug effect to track message changes
  useEffect(() => {
    console.log(`[ChatMessage] Message object changed:`, {
      id: message.id,
      role: message.role,
      contentLength: message.content.length,
      isPlaceholder: message.isPlaceholder,
      hasImage: !!message.imageUrl
    });
  }, [message]);
  
  // Validate message
  if (!message || !message.content) {
    console.error("[ChatMessage] Invalid message:", message);
    return null;
  }
  
  const { 
    id, 
    role, 
    content, 
    timestamp, 
    imageUrl, 
    isSaved = false,
    isError = false,
    isPlaceholder = false
  } = message;
  
  console.log(`[ChatMessage] Rendering message:`, {
    id,
    role,
    contentLength: content.length,
    isPlaceholder,
    hasImage: !!imageUrl
  });
  
  // Skip rendering placeholder messages - these are handled separately in MessageList
  if (isPlaceholder) {
    console.log(`[ChatMessage] Skipping placeholder message:`, { id, role });
    return null;
  }
  
  const isAssistant = role === 'assistant';
  
  // Calculate key points
  const keyPoints = useMemo(() => {
    return getKeyPoints(content, isAssistant, isMobile);
  }, [content, isAssistant, isMobile]);
  
  // Regenerate handler
  const handleRegenerateMessage = useMemo(() => {
    if (!onRegenerate || !isAssistant) return undefined;
    return () => onRegenerate(id);
  }, [id, onRegenerate, isAssistant]);

  return (
    <div 
      className={cn(
        "flex gap-3 max-w-full animate-fade-in my-6 first:mt-2",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
      data-message-id={id}
      data-message-role={role}
    >
      {isAssistant && <MessageAvatar isAssistant={true} />}
      
      <div 
        className={cn(
          "rounded-2xl p-4 max-w-[85%] break-words shadow-sm",
          isAssistant 
            ? isError 
              ? "bg-red-50 text-red-800" 
              : "bg-muted/70 text-foreground" 
            : "bg-primary/90 text-primary-foreground ml-auto"
        )}
      >
        {imageUrl && <MessageImagePreview imageUrl={imageUrl} />}
        
        <div className="text-sm">
          <MessageContent 
            content={content} 
            isAssistant={isAssistant} 
          />
        </div>
        
        {keyPoints && <KeyPoints points={keyPoints} />}
        
        <MessageTimestamp 
          timestamp={timestamp} 
          isAssistant={isAssistant} 
          isSaved={isSaved} 
        />
        
        <MessageActions 
          isAssistant={isAssistant}
          messageContent={content}
          isMobile={isMobile}
          onRegenerate={handleRegenerateMessage}
        />
      </div>
      
      {!isAssistant && <MessageAvatar isAssistant={false} />}
    </div>
  );
};

// Use a simpler equality check to ensure re-renders happen when needed
const areEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps) => {
  // Check if the message content has changed (most important)
  if (prevProps.message.content !== nextProps.message.content) {
    return false;
  }
  
  // Check if placeholder status changed
  if (prevProps.message.isPlaceholder !== nextProps.message.isPlaceholder) {
    return false;
  }
  
  // Check if error status changed
  if (prevProps.message.isError !== nextProps.message.isError) {
    return false;
  }
  
  // Check if saved status changed
  if (prevProps.message.isSaved !== nextProps.message.isSaved) {
    return false;
  }
  
  // Check if ID changed (shouldn't happen, but just in case)
  if (prevProps.message.id !== nextProps.message.id) {
    return false;
  }
  
  // Check if mobile status changed
  if (prevProps.isMobile !== nextProps.isMobile) {
    return false;
  }
  
  return true;
};

// Memoize the component with our improved equality function
const MemoizedChatMessage = memo(ChatMessage, areEqual);
MemoizedChatMessage.displayName = 'ChatMessage';

export default MemoizedChatMessage;
