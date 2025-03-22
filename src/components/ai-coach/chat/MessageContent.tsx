
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  isAssistant: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming, isAssistant }) => {
  if (!isAssistant) {
    return <p className="leading-relaxed">{content}</p>;
  }

  return (
    <>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        className="prose-compact prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-1.5 prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-md"
        components={{
          p: ({ node, ...props }) => (
            <p {...props} className="my-1.5 leading-relaxed" />
          ),
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-base font-semibold mt-3 mb-1.5" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-base font-semibold mt-3 mb-1.5" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-sm font-semibold mt-3 mb-1.5" />
          ),
          a: ({ node, ...props }) => (
            <a {...props} className="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-5 my-1.5" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-5 my-1.5" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="my-1" />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !className ? (
              <code className="bg-muted/70 px-1.5 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-muted/60 p-2.5 rounded text-xs overflow-x-auto" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-flex items-center mt-1">
          <span className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        </span>
      )}
    </>
  );
};

export default React.memo(MessageContent);
