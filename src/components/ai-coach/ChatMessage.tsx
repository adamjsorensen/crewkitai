
import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User, Badge } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Message } from './chat/types';
import MessageContent from './chat/MessageContent';
import MessageActions from './chat/MessageActions';
import MessageImagePreview from './chat/MessageImagePreview';
import KeyPoints from './chat/KeyPoints';
import '@/styles/streaming.css';
import { BookmarkIcon } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  isMobile?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate, isMobile = false }) => {
  const { 
    id, 
    role, 
    content, 
    timestamp, 
    imageUrl, 
    isStreaming,
    isSaved
  } = message;
  
  const isAssistant = role === 'assistant';
  
  // Don't extract key points on mobile to improve performance
  const getKeyPoints = (content: string): string[] | null => {
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

  const keyPoints = !isStreaming ? getKeyPoints(content) : null;
  
  const handleRegenerateMessage = () => {
    if (onRegenerate && isAssistant) {
      onRegenerate(id);
    }
  };

  return (
    <div 
      className={cn(
        "flex gap-3 max-w-full animate-fade-in my-6 first:mt-2",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
          <PaintBucket className="h-4 w-4 text-white" />
        </div>
      )}
      
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
            isStreaming={isStreaming} 
            isAssistant={isAssistant} 
          />
        </div>
        
        {/* Key Points Section for assistant messages - not shown on mobile */}
        {isAssistant && keyPoints && !isMobile && (
          <KeyPoints points={keyPoints} />
        )}
        
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
        
        <MessageActions 
          isAssistant={isAssistant}
          messageContent={content}
          isMobile={isMobile}
          onRegenerate={handleRegenerateMessage}
        />
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(ChatMessage);
