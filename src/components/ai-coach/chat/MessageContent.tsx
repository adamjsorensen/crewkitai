
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  isAssistant: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content,
  isAssistant
}) => {
  // If it's a user message, simple text display (no markdown)
  if (!isAssistant) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  // For assistant messages, use markdown with styling
  return (
    <div className={cn(
      "prose prose-sm dark:prose-invert max-w-none",
      "prose-p:my-1.5 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
      "prose-pre:my-2 prose-pre:bg-primary/5 prose-pre:p-2 prose-pre:rounded-md prose-pre:text-xs"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override h1, h2, etc. with properly sized headings
          h1: ({ children }) => <h1 className="text-xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium">{children}</h3>,
          
          // Style links to be clickable and obvious
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>,
          
          // Improve code block styling
          code: ({ className, children, ...props }: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
            const isInline = props.inline;
            
            if (isInline) {
              return <code className="px-1 py-0.5 bg-primary/10 rounded text-sm font-mono" {...props}>{children}</code>;
            }
            return (
              <pre className="overflow-auto p-2 bg-primary/5 rounded-md text-xs">
                <code className="font-mono" {...props}>{children}</code>
              </pre>
            );
          },
          
          // Improve list styling
          ul: ({ children }) => <ul className="pl-5 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="pl-5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MessageContent);
