
import React from "react";
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
        <div className="whitespace-pre-wrap">
          {message.pending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <>
              {message.content}
              {message.role === "assistant" && message.content === "" && (
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
