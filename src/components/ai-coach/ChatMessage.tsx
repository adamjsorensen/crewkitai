
import React, { memo, useMemo, useEffect, useRef } from 'react';
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
  // Reference to track render count
  const renderCountRef = useRef(0);
  
  // Add debug effect to track message changes
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[ChatMessage ${message.id}] RENDERED (count: ${renderCountRef.current})`, {
      id: message.id,
      role: message.role,
      contentLength: message.content?.length || 0,
      contentPreview: message.content?.substring(0, 30) + "...",
      isPlaceholder: !!message.isPlaceholder,
      hasImage: !!message.imageUrl,
      timestamp: message.timestamp?.toString()
    });
    
    return () => {
      console.log(`[ChatMessage ${message.id}] UNMOUNTED`);
    };
  }, [message]);
  
  // Log specific property changes that might affect rendering
  useEffect(() => {
    console.log(`[ChatMessage ${message.id}] Content changed:`, {
      newLength: message.content?.length || 0,
      preview: message.content?.substring(0, 30) + "..."
    });
  }, [message.content, message.id]);
  
  useEffect(() => {
    console.log(`[ChatMessage ${message.id}] Placeholder status changed to: ${!!message.isPlaceholder}`);
  }, [message.isPlaceholder, message.id]);
  
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
  
  console.log(`[ChatMessage] Processing message for render:`, {
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

// Improved equality function to ensure re-renders happen when needed
const areEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps) => {
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;
  
  // First, log what's being compared
  console.log(`[ChatMessage.areEqual] Comparing ${prevMsg.id} with itself or replacement`, {
    contentChanged: prevMsg.content !== nextMsg.content,
    prevContentLength: prevMsg.content?.length || 0,
    nextContentLength: nextMsg.content?.length || 0,
    contentSame: prevMsg.content === nextMsg.content,
    placeholderChanged: !!prevMsg.isPlaceholder !== !!nextMsg.isPlaceholder,
    prevPlaceholder: !!prevMsg.isPlaceholder,
    nextPlaceholder: !!nextMsg.isPlaceholder,
    idChanged: prevMsg.id !== nextMsg.id
  });
  
  // CRITICAL: Force re-render if content or placeholder status changes
  if (prevMsg.content !== nextMsg.content) {
    console.log(`[ChatMessage.areEqual] Content changed for ${prevMsg.id} - forcing re-render`);
    return false;
  }
  
  if (!!prevMsg.isPlaceholder !== !!nextMsg.isPlaceholder) {
    console.log(`[ChatMessage.areEqual] Placeholder status changed for ${prevMsg.id} - forcing re-render`);
    return false;
  }
  
  // Check if error status changed
  if (!!prevMsg.isError !== !!nextMsg.isError) {
    console.log(`[ChatMessage.areEqual] Error status changed for ${prevMsg.id} - forcing re-render`);
    return false;
  }
  
  // Check if saved status changed
  if (!!prevMsg.isSaved !== !!nextMsg.isSaved) {
    console.log(`[ChatMessage.areEqual] Saved status changed for ${prevMsg.id} - forcing re-render`);
    return false;
  }
  
  // Check if ID changed (shouldn't happen, but just in case)
  if (prevMsg.id !== nextMsg.id) {
    console.log(`[ChatMessage.areEqual] ID changed from ${prevMsg.id} to ${nextMsg.id} - forcing re-render`);
    return false;
  }
  
  // Check if mobile status changed
  if (prevProps.isMobile !== nextProps.isMobile) {
    console.log(`[ChatMessage.areEqual] Mobile status changed for ${prevMsg.id} - forcing re-render`);
    return false;
  }
  
  console.log(`[ChatMessage.areEqual] No changes detected for ${prevMsg.id}, preventing re-render`);
  return true;
};

// Memoize the component with our improved equality function
const MemoizedChatMessage = memo(ChatMessage, areEqual);
MemoizedChatMessage.displayName = 'ChatMessage';

export default MemoizedChatMessage;
