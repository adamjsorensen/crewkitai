
import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
    <div className="border-t px-4 py-3 bg-background/95 backdrop-blur-sm">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Textarea 
            ref={inputRef} 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="Ask your AI Coach anything about your painting business..." 
            className="resize-none min-h-[56px] pr-16 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors rounded-xl" 
            disabled={isLoading || isUploading} 
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                    onClick={handleImageClick}
                    disabled={isLoading || isUploading}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Attach image</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isThinkMode ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setIsThinkMode(!isThinkMode)}
                    className="h-8 w-8 rounded-md mr-1"
                    disabled={isLoading || isUploading}
                  >
                    <Brain className={`h-4 w-4 ${isThinkMode ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Let your coach take their time to think</p>
                </TooltipContent>
              </Tooltip>
              
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
      
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          {isThinkMode ? (
            <Badge variant="outline" className="px-1.5 h-5 text-xs font-normal bg-secondary/10 text-secondary">
              <Brain className="h-3 w-3 mr-1" /> Think Mode
            </Badge>
          ) : (
            <span className="opacity-0">.</span> 
          )}
        </p>
        
        <p className="text-xs text-muted-foreground flex items-center">
          <span className="mr-1">✨</span>
          AI-powered advice for painting professionals
        </p>
      </div>
    </div>
  );
};

export default ChatMessageInput;
