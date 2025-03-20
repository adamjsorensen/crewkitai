import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PaintBucket, User, RefreshCw, Copy, Share2, ThumbsUp, ThumbsDown, Loader2, ZoomIn, MoreHorizontal, BookmarkIcon, CheckCircle2, PinIcon, HelpCircle, ArrowRight } from 'lucide-react';
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SuggestedQuestions from './chat/SuggestedQuestions';

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
  onFollowUpQuestion?: (question: string) => void;
  onExplainFurther?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRegenerate,
  onFollowUpQuestion,
  onExplainFurther
}) => {
  const isAssistant = message.role === 'assistant';
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isVoted, setIsVoted] = useState<'up' | 'down' | null>(null);

  const suggestedQuestions = isAssistant ? generateFollowUpQuestions(message.content) : [];

  function generateFollowUpQuestions(content: string): string[] {
    const questions: string[] = [];
    
    if (content.toLowerCase().includes('pricing') || content.toLowerCase().includes('estimate')) {
      questions.push("What factors affect pricing the most?");
      questions.push("How do I explain my pricing to clients?");
    }
    
    if (content.toLowerCase().includes('client') || content.toLowerCase().includes('customer')) {
      questions.push("How to handle client payment issues?");
      questions.push("What's the best way to get client testimonials?");
    }
    
    if (content.toLowerCase().includes('crew') || content.toLowerCase().includes('team') || content.toLowerCase().includes('employee')) {
      questions.push("How to motivate my painting crew?");
      questions.push("What's a fair pay structure for painters?");
    }
    
    if (content.toLowerCase().includes('marketing') || content.toLowerCase().includes('lead')) {
      questions.push("What should be on my painting business website?");
      questions.push("Is door-to-door marketing effective for painters?");
    }
    
    if (questions.length === 0) {
      questions.push("Can you explain that in more detail?");
      questions.push("How can I implement this in my business?");
      questions.push("What are common mistakes to avoid?");
    }
    
    return questions.slice(0, 3);
  }
  
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

  const handleExplainFurther = () => {
    if (onExplainFurther) {
      onExplainFurther(message.id);
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    if (onFollowUpQuestion) {
      onFollowUpQuestion(question);
    }
  };

  const getKeyPoints = (content: string): string[] | null => {
    if (!isAssistant) return null;
    
    const listMatch = content.match(/(\n[0-9]+\.\s.+){2,}/g) || 
                      content.match(/(\n\*\s.+){2,}/g) ||
                      content.match(/(\n-\s.+){2,}/g);
    
    if (listMatch) {
      return listMatch[0]
        .split('\n')
        .filter(item => item.trim())
        .map(item => item.replace(/^[0-9]+\.\s|\*\s|-\s/, '').trim())
        .slice(0, 3);
    }
    
    return null;
  };

  const keyPoints = getKeyPoints(message.content);
  
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
        
        {isAssistant && keyPoints && (
          <Card className="mt-3 p-3 bg-primary/5 border-primary/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Key Points</span>
            </div>
            <ul className="space-y-1">
              {keyPoints.map((point, index) => (
                <li key={index} className="flex gap-1.5 items-start">
                  <Badge variant="outline" className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                    {index + 1}
                  </Badge>
                  <span className="text-xs">{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        
        {isAssistant && suggestedQuestions.length > 0 && (
          <SuggestedQuestions 
            questions={suggestedQuestions} 
            onQuestionClick={handleFollowUpQuestion}
          />
        )}
        
        {isAssistant && onExplainFurther && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExplainFurther}
            className="mt-3 bg-background/80 text-xs h-8 border-primary/20 text-primary hover:bg-primary/10"
          >
            <HelpCircle className="h-3 w-3 mr-1.5" />
            Explain this further
          </Button>
        )}
        
        <div 
          className={cn(
            "text-xs mt-2 flex items-center justify-between",
            isAssistant ? "text-muted-foreground/70" : "text-primary-foreground/70"
          )}
        >
          <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
          
          {isSaved && isAssistant && (
            <Badge variant="outline" className="ml-2 h-5 text-[10px] bg-primary/5 text-primary border-primary/20">
              <BookmarkIcon className="h-2.5 w-2.5 mr-0.5" />
              Saved
            </Badge>
          )}
        </div>
        
        {isAssistant && (
          <div className="flex items-center justify-between mt-2.5 border-t border-border/20 pt-2">
            <div className="flex items-center gap-1">
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
            </div>
            
            <div className="flex items-center gap-1">
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
            </div>
          </div>
        )}
      </div>
      
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}

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
