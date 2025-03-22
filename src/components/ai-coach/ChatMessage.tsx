
import React, { memo, useMemo } from 'react';
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

// Function to extract key points - moved outside component to avoid recreating every render
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

// Timestamp component to avoid re-rendering the whole message when only the relative time changes
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

// Avatar component to optimize renders
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
  const { 
    id, 
    role, 
    content, 
    timestamp, 
    imageUrl, 
    isSaved = false
  } = message;
  
  const isAssistant = role === 'assistant';
  
  // Use memoization to avoid recalculating key points on every render
  const keyPoints = useMemo(() => {
    return getKeyPoints(content, isAssistant, isMobile);
  }, [content, isAssistant, isMobile]);
  
  // Memoize the regenerate handler to maintain stable reference
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
    >
      {isAssistant && <MessageAvatar isAssistant={true} />}
      
      <div 
        className={cn(
          "rounded-2xl p-4 max-w-[85%] break-words shadow-sm",
          isAssistant 
            ? "bg-muted/70 text-foreground" 
            : "bg-primary/90 text-primary-foreground ml-auto"
        )}
      >
        <MessageImagePreview imageUrl={imageUrl ?? ''} />
        
        <div className="text-sm">
          <MessageContent 
            content={content} 
            isAssistant={isAssistant} 
          />
        </div>
        
        {/* Key Points Section for assistant messages - not shown on mobile */}
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

// Use React.memo with a custom equality function
const areEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps) => {
  // Compare important properties to determine if re-render is needed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    (prevProps.message.isSaved === nextProps.message.isSaved) &&
    prevProps.isMobile === nextProps.isMobile
  );
};

// Use memo with custom equality function for better performance
const MemoizedChatMessage = memo(ChatMessage, areEqual);
MemoizedChatMessage.displayName = 'ChatMessage';

export default MemoizedChatMessage;
