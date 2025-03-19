
import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, ImageIcon, Loader2, Brain } from 'lucide-react';
import AnimatedButton from '@/components/ui-components/AnimatedButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ChatMessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isUploading: boolean;
  imageFile: File | null;
  handleSendMessage: () => void;
  handleImageClick: () => void;
  isThinkMode: boolean;
  setIsThinkMode: (value: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  user: any;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  input,
  setInput,
  isLoading,
  isUploading,
  imageFile,
  handleSendMessage,
  handleImageClick,
  isThinkMode,
  setIsThinkMode,
  handleKeyDown,
  user
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Button
            variant={isThinkMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsThinkMode(!isThinkMode)}
            className={`h-8 rounded-md flex items-center gap-1.5 ${isThinkMode ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
            disabled={isLoading || isUploading}
          >
            <Brain className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Think Mode</span>
          </Button>
          
          {isThinkMode && (
            <p className="text-xs text-muted-foreground ml-2 hidden md:block">
              Your coach will take their time to provide a deeper, more thoughtful response
            </p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageClick}
          className="h-8 rounded-md mr-1 flex items-center gap-1.5"
          disabled={isLoading || isUploading}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="text-xs">Add Image</span>
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Textarea 
            ref={inputRef} 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder={isThinkMode ? "Ask a complex question for your coach to think about..." : "Ask your AI Coach anything about your painting business..."} 
            className="resize-none min-h-[56px] pr-12 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors rounded-xl" 
            disabled={isLoading || isUploading} 
          />
          
          <div className="absolute right-2 bottom-2 flex items-center">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <AnimatedButton 
                      onClick={handleSendMessage} 
                      disabled={(!input.trim() && !imageFile) || isLoading || isUploading || !user}
                      className="h-8 w-8 rounded-md"
                    >
                      {isLoading || isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="sr-only">Send message</span>
                    </AnimatedButton>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Send message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end mt-2">
        <p className="text-xs text-muted-foreground flex items-center">
          <span className="mr-1">✨</span>
          AI-powered advice for painting professionals
        </p>
      </div>
    </>
  );
};

export default ChatMessageInput;
