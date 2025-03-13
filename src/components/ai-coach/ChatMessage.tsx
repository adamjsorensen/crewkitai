
import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Streaming effect for assistant messages
  useEffect(() => {
    if (message.role === "assistant" && !message.pending) {
      if (message.content !== displayedContent) {
        setIsStreaming(true);
        let index = 0;
        const content = message.content;
        
        // Clear any existing interval
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
        }
        
        // Set up new interval for streaming effect
        streamTimerRef.current = setInterval(() => {
          setDisplayedContent(content.substring(0, index));
          index++;
          
          // Once we've displayed all content, clear interval
          if (index > content.length) {
            if (streamTimerRef.current) {
              clearInterval(streamTimerRef.current);
              streamTimerRef.current = null;
            }
            setIsStreaming(false);
          }
        }, 15); // Adjust timing for more or less human-like typing
      }
    } else {
      setDisplayedContent(message.content);
    }
    
    // Cleanup interval on unmount
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, [message, displayedContent]);

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div 
          ref={contentRef}
          className="whitespace-pre-wrap"
        >
          {message.pending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <>
              {displayedContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1">
                  &nbsp;
                </span>
              )}
            </>
          )}
        </div>
      </div>
      
      {message.role === "user" && (
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
