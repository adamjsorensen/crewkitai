import React from 'react';
import { Send, Image, AlignJustify, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from '@supabase/supabase-js';

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
  user: User | null;
  inputRef: React.RefObject<HTMLTextAreaElement>;
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
  user,
  inputRef
}) => {
  const isDisabled = isLoading || isUploading || !user;
  
  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pricing, client management, crews, or marketing..."
          className="resize-none border rounded-xl p-3 bg-background shadow-sm min-h-[80px] max-h-[200px] pr-12"
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        <div className="absolute right-2 bottom-2 flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleImageClick}
            disabled={isDisabled}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Image className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isThinkMode}
                onPressedChange={setIsThinkMode}
                disabled={isDisabled}
                className={`rounded-xl p-2 ${isThinkMode ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground'}`}
                aria-label="Toggle Think Mode"
              >
                <Brain className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-[300px]">
              <div className="space-y-1.5">
                <p className="font-medium text-xs">Think Mode</p>
                <p className="text-xs text-muted-foreground">Uses a faster AI model for quick responses with less detail. Good for brainstorming or simple questions.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button
          onClick={handleSendMessage}
          disabled={isDisabled || (!input.trim() && !imageFile)}
          size="icon"
          className="rounded-xl"
        >
          {isLoading || isUploading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatMessageInput;
