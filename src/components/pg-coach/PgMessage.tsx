
import React from 'react';
import { PgMessage as PgMessageType } from '@/hooks/usePgChat';
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
      className={cn("flex items-start gap-2.5", 
        isUser ? "flex-row-reverse" : "flex-row",
        "animate-fade-in"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center",
        isUser ? "bg-primary/80" : "bg-primary/20"
      )}>
        {isUser ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <PaintBucket className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      
      <div className={cn(
        "rounded-2xl py-2.5 px-3.5",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        isMobile ? "max-w-[85%]" : "max-w-[75%]",
        "shadow-sm border",
        isUser ? "border-primary/20" : "border-border/30"
      )}>
        {message.imageUrl && (
          <div className="mb-2.5 max-w-xs">
            <img 
              src={message.imageUrl} 
              alt="Uploaded" 
              className="rounded-md object-contain max-h-[300px] border border-border/30 shadow-sm" 
            />
          </div>
        )}
        
        <div className="prose prose-sm prose-compact max-w-none break-words dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PgMessage;
