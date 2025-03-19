
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User, RefreshCw, Copy, Share2, ThumbsUp, ThumbsDown, Loader2, ZoomIn, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
  const isAssistant = message.role === 'assistant';
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share({
          title: 'AI Coach Advice',
          text: message.content,
        });
      } else {
        await navigator.clipboard.writeText(message.content);
        toast({
          title: "Copied!",
          description: "Message copied to clipboard for sharing",
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Could not share the message",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };
  
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-full animate-fade-in my-6 first:mt-2",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
          <PaintBucket className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div 
        className={cn(
          "rounded-2xl p-4 max-w-[85%] break-words shadow-sm",
          isAssistant 
            ? "bg-muted/70 text-foreground" 
            : "bg-primary/90 text-primary-foreground ml-auto"
        )}
      >
        {message.imageUrl && (
          <div className="mb-3 group relative cursor-pointer" onClick={() => setImageDialogOpen(true)}>
            <img 
              src={message.imageUrl} 
              alt="Uploaded image" 
              className="max-h-48 w-auto rounded-lg object-cover border border-border/10" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-8 w-8 text-white drop-shadow-md" />
            </div>
          </div>
        )}
        
        <div className="text-sm">
          {isAssistant ? (
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
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="leading-relaxed">{message.content}</p>
          )}
        </div>
        
        <div 
          className={cn(
            "text-xs mt-2",
            isAssistant ? "text-muted-foreground/70" : "text-primary-foreground/70"
          )}
        >
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>
        
        {isAssistant && (
          <div className="flex items-center gap-1 mt-2.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background hover:text-primary transition-colors" 
                    aria-label="Regenerate response"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Regenerate response</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background hover:text-primary transition-colors" 
                    aria-label="Copy to clipboard"
                    onClick={handleCopy}
                    disabled={isCopying}
                  >
                    {isCopying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Toggle 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background hover:text-primary transition-colors" 
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Toggle>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem onClick={handleShare} disabled={isSharing} className="flex items-center gap-2 text-xs cursor-pointer">
                    {isSharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                    Share message
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-xs cursor-pointer">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Mark as helpful
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-xs cursor-pointer">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Not helpful
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}

      {/* Image Dialog for fullscreen viewing */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
          <div className="relative">
            <img 
              src={message.imageUrl} 
              alt="Fullscreen view" 
              className="w-full h-auto object-contain max-h-[80vh] rounded-lg" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatMessage;
