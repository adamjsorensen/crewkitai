
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  isAssistant: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming, isAssistant }) => {
  // Simple content rendering for user messages
  if (!isAssistant) {
    return <p className="leading-relaxed">{content}</p>;
  }

  // Memoize the markdown components configuration to prevent recreating on each render
  const markdownComponents = useMemo(() => ({
    p: ({ node, ...props }: any) => (
      <p {...props} className="my-1.5 leading-relaxed" />
    ),
    h1: ({ node, ...props }: any) => (
      <h1 {...props} className="text-base font-semibold mt-3 mb-1.5" />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 {...props} className="text-base font-semibold mt-3 mb-1.5" />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 {...props} className="text-sm font-semibold mt-3 mb-1.5" />
    ),
    a: ({ node, ...props }: any) => (
      <a {...props} className="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer" />
    ),
    ul: ({ node, ...props }: any) => (
      <ul {...props} className="list-disc pl-5 my-1.5" />
    ),
    ol: ({ node, ...props }: any) => (
      <ol {...props} className="list-decimal pl-5 my-1.5" />
    ),
    li: ({ node, ...props }: any) => (
      <li {...props} className="my-1" />
    ),
    code: ({ node, className, children, ...props }: any) => {
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
  }), []);

  return (
    <>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        className="prose-compact prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-1.5 prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-md"
        components={markdownComponents}
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

// Use memo with a custom equality function for better performance
const areEqual = (prevProps: MessageContentProps, nextProps: MessageContentProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isAssistant === nextProps.isAssistant
  );
};

const MemoizedMessageContent = React.memo(MessageContent, areEqual);
MemoizedMessageContent.displayName = 'MessageContent';

export default MemoizedMessageContent;
