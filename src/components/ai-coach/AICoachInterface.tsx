
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const AICoachInterface = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! I'm your AI painting business coach. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (messageText: string = inputValue) => {
    if (!messageText.trim()) return;

    // Add user message to chat
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: messageText
    };

    // Add temporary assistant message (for loading state)
    const assistantMessageId = (Date.now() + 1).toString();
    const pendingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      pending: true
    };

    setMessages(prev => [...prev, userMessage, pendingMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create a new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Prepare the messages to send to the API
      const messagesToSend = [
        ...messages.filter(m => !m.pending).map(m => ({
          role: m.role,
          content: m.content
        })), 
        {
          role: "user" as const,
          content: messageText
        }
      ];

      // Update the pending message to empty content, not pending
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, pending: false, content: "" }
            : msg
        )
      );

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          messages: messagesToSend,
          userProfile: profile
        }
      });

      if (error) throw new Error(error.message);

      // Check if the response was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Simple approach: directly get the response as a ReadableStream
      if (data) {
        let accumulatedContent = '';
        const reader = new TextDecoder();

        // Process the stream
        const processStream = async () => {
          const reader = (data as ReadableStream<Uint8Array>).getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            accumulatedContent += chunk;
            
            // Update the message content with each chunk
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          }
        };

        try {
          await processStream();
        } catch (streamError) {
          console.error("Error processing stream:", streamError);
          // If there's an error in stream processing, we still have the accumulated content
          if (accumulatedContent) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent + "\n\n[Stream interrupted]" }
                  : msg
              )
            );
          } else {
            throw streamError; // Re-throw if we have no content
          }
        }
      } else {
        throw new Error("No data received from AI Coach");
      }
    } catch (error) {
      console.error("Error calling AI Coach:", error);
      
      // Only show error if it's not an AbortError (which happens when we cancel)
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast({
          title: "Error",
          description: "Failed to get a response from the AI coach. Please try again.",
          variant: "destructive"
        });
        
        // Remove the pending message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground">
          Get expert advice for your painting business
        </p>
      </div>

      <Card className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden bg-card border border-border">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
            />
          ))}
        </div>

        {messages.length === 1 && (
          <div className="p-4 border-t border-border">
            <SuggestedPrompts onSelectPrompt={handleSendMessage} />
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AICoachInterface;
