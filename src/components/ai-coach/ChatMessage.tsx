
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User, RefreshCw, Copy, Share2, ThumbsUp, ThumbsDown, Loader2, ZoomIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // Add support for image URLs
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
        "flex gap-2 max-w-full animate-fade-in",
        isAssistant ? "items-start" : "items-start justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <PaintBucket className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div 
        className={cn(
          "rounded-xl p-2.5 max-w-[88%] break-words shadow-sm",
          isAssistant 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground ml-auto"
        )}
      >
        {message.imageUrl && (
          <div className="mb-2 group relative cursor-pointer" onClick={() => setImageDialogOpen(true)}>
            <img 
              src={message.imageUrl} 
              alt="Uploaded image" 
              className="max-h-40 w-auto rounded-md object-cover" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
        
        <div className="text-sm">
          {isAssistant ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="prose-compact prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-1 prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded"
              components={{
                p: ({ node, ...props }) => (
                  <p {...props} className="my-1 leading-normal" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-base font-semibold mt-2.5 mb-1" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-base font-semibold mt-2.5 mb-1" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-sm font-semibold mt-2.5 mb-1" />
                ),
                a: ({ node, ...props }) => (
                  <a {...props} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc pl-5 my-1" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal pl-5 my-1" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="my-0.5" />
                ),
                code: ({ node, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !className ? (
                    <code className="bg-muted/70 px-1 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
        
        <div 
          className={cn(
            "text-xs mt-1",
            isAssistant ? "text-muted-foreground" : "text-primary-foreground/80"
          )}
        >
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>
        
        {isAssistant && (
          <div className="flex items-center gap-1 mt-1.5 -ml-1">
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0 rounded-md border-0 bg-background/50 hover:bg-background" 
              aria-label="Regenerate response"
              onClick={handleRegenerate}
              title="Regenerate response"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Toggle>
            
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0 rounded-md border-0 bg-background/50 hover:bg-background" 
              aria-label="Copy to clipboard"
              onClick={handleCopy}
              title="Copy to clipboard"
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Toggle>
            
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0 rounded-md border-0 bg-background/50 hover:bg-background" 
              aria-label="Share message"
              onClick={handleShare}
              title="Share message"
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
            </Toggle>
            
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0 rounded-md border-0 bg-background/50 hover:bg-background" 
              aria-label="Helpful"
              title="Mark as helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Toggle>
            
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0 rounded-md border-0 bg-background/50 hover:bg-background" 
              aria-label="Not helpful"
              title="Mark as not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Toggle>
          </div>
        )}
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
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
              className="w-full h-auto object-contain max-h-[80vh]" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatMessage;
