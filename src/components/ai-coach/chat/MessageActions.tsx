
import React, { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PinIcon, BookmarkIcon, Share2, RefreshCw, Copy, Loader2, MoreHorizontal, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
  isAssistant: boolean;
  messageContent: string;
  isMobile: boolean;
  onRegenerate?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  isAssistant, 
  messageContent, 
  isMobile, 
  onRegenerate 
}) => {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVoted, setIsVoted] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(messageContent);
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
          text: messageContent,
        });
      } else {
        await navigator.clipboard.writeText(messageContent);
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
    if (onRegenerate && isAssistant) {
      setIsRegenerating(true);
      onRegenerate();
      
      // Reset regenerating state after a short delay
      setTimeout(() => {
        setIsRegenerating(false);
      }, 500); // Short delay to show the regenerating state
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from saved" : "Saved!",
      description: isSaved ? "Item removed from your saved messages" : "Message saved for future reference",
    });
  };

  const handleVote = (vote: 'up' | 'down') => {
    setIsVoted(isVoted === vote ? null : vote);
    if (vote === 'up' && isVoted !== 'up') {
      toast({
        title: "Marked as helpful",
        description: "Thanks for your feedback!",
      });
    }
  };

  if (!isAssistant) return null;

  return (
    <div className="flex items-center justify-between mt-2.5 border-t border-border/20 pt-2">
      <div className="flex items-center gap-1">
        {isMobile ? (
          // Simplified mobile controls
          <>
            <Toggle 
              size="sm" 
              variant="outline" 
              className={`h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background ${isVoted === 'up' ? 'text-primary bg-primary/10' : ''}`}
              pressed={isVoted === 'up'}
              onPressedChange={() => handleVote('up')}
              aria-label="Mark as helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle 
              size="sm" 
              variant="outline" 
              className={`h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background ${isSaved ? 'text-primary bg-primary/10' : ''}`}
              pressed={isSaved}
              onPressedChange={handleSave}
              aria-label="Save message"
            >
              <BookmarkIcon className="h-3.5 w-3.5" />
            </Toggle>
          </>
        ) : (
          // Desktop controls with tooltips
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  size="sm" 
                  variant="outline" 
                  className={`h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background ${isVoted === 'up' ? 'text-primary bg-primary/10' : 'hover:text-primary'} transition-colors`}
                  pressed={isVoted === 'up'}
                  onPressedChange={() => handleVote('up')}
                  aria-label="Mark as helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Mark as helpful</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  size="sm" 
                  variant="outline" 
                  className={`h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background ${isVoted === 'down' ? 'text-destructive bg-destructive/10' : 'hover:text-destructive'} transition-colors`}
                  pressed={isVoted === 'down'}
                  onPressedChange={() => handleVote('down')}
                  aria-label="Mark as not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Not helpful</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  size="sm" 
                  variant="outline" 
                  className={`h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background ${isSaved ? 'text-primary bg-primary/10' : 'hover:text-primary'} transition-colors`}
                  pressed={isSaved}
                  onPressedChange={handleSave}
                  aria-label="Save message"
                >
                  <BookmarkIcon className="h-3.5 w-3.5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{isSaved ? 'Remove from saved' : 'Save message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {isMobile ? (
          // Simplified mobile actions
          <>
            <Toggle 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background transition-colors"
              aria-label="Regenerate response"
              onClick={handleRegenerate}
              disabled={isRegenerating || !isAssistant}
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Toggle>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Toggle 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Toggle>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleCopy} disabled={isCopying} className="flex items-center gap-2 text-xs cursor-pointer">
                  {isCopying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} disabled={isSharing} className="flex items-center gap-2 text-xs cursor-pointer">
                  {isSharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                  Share message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          // Desktop controls with tooltips
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0 rounded-full border-none bg-background/50 hover:bg-background hover:text-primary transition-colors"
                  aria-label="Regenerate response"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !isAssistant}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleShare} disabled={isSharing} className="flex items-center gap-2 text-xs cursor-pointer">
                  {isSharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                  Share message
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 text-xs cursor-pointer">
                  <PinIcon className="h-3.5 w-3.5" />
                  Pin to conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageActions);
