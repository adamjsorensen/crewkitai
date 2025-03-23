
import React from 'react';
import { PgMessage as PgMessageType } from './PgChatInterface';
import { User, PaintBucket } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PgMessageProps {
  message: PgMessageType;
  isMobile: boolean;
}

const PgMessage: React.FC<PgMessageProps> = ({ message, isMobile }) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={cn("flex items-start gap-3", 
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary/80" : "bg-primary/20"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <PaintBucket className="h-4 w-4 text-primary" />
        )}
      </div>
      
      <div className={cn(
        "rounded-2xl py-3 px-4",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        isMobile ? "max-w-[85%]" : "max-w-[75%]"
      )}>
        {message.imageUrl && (
          <div className="mb-3 max-w-xs">
            <img 
              src={message.imageUrl} 
              alt="Uploaded" 
              className="rounded-md object-contain max-h-[300px]" 
            />
          </div>
        )}
        
        <div className="prose prose-sm max-w-none break-words dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PgMessage;
