
import React from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-full",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <PaintBucket className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div 
        className={cn(
          "rounded-xl p-3 max-w-[85%] break-words",
          isAssistant 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground ml-auto"
        )}
      >
        <div className="whitespace-pre-line text-sm">{message.content}</div>
        <div 
          className={cn(
            "text-xs mt-1",
            isAssistant ? "text-muted-foreground" : "text-primary-foreground/80"
          )}
        >
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
