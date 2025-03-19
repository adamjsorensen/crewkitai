
import React from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        "flex gap-3 max-w-full animate-fade-in",
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
          "rounded-xl p-3 max-w-[85%] break-words shadow-sm",
          isAssistant 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground ml-auto"
        )}
      >
        <div className="whitespace-pre-line text-sm">
          {isAssistant ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded"
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc pl-6 my-2" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal pl-6 my-2" />
                ),
                code: ({ node, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !className ? (
                    <code className="bg-muted/70 px-1 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
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
