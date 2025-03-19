import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, RefreshCw, HistoryIcon, Sparkles, LightbulbIcon, AlertCircle, Loader2, Trash2, Copy, PaintBucket, PlusCircle, Image as ImageIcon, X, ZoomIn, ChevronDown, ArrowDown, Brain } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Card } from '@/components/ui/card';
import TypingIndicator from './TypingIndicator';
import AnimatedButton from '@/components/ui-components/AnimatedButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toggle } from '@/components/ui/toggle';
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

const EXAMPLE_QUESTIONS = [
  "How do I price a 2,000 sq ft exterior job?", 
  "What's the best way to handle a difficult client?", 
  "How can I improve my crew's efficiency?", 
  "What marketing strategies work during slow seasons?"
];

interface ChatInterfaceProps {
  conversationId?: string | null;
  isNewChat?: boolean;
  onConversationCreated?: (id: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId = null,
  isNewChat = true,
  onConversationCreated
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (isNewChat) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
      return;
    }
    
    if (!conversationId) {
      return;
    }
    
    const fetchConversationHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const {
          data: rootData,
          error: rootError
        } = await supabase.from('ai_coach_conversations').select('*').eq('id', conversationId).single();
        if (rootError) throw rootError;

        const {
          data: messagesData,
          error: messagesError
        } = await supabase.from('ai_coach_conversations').select('*').eq('conversation_id', conversationId).order('created_at', {
          ascending: true
        });
        if (messagesError) throw messagesError;

        const allMessages = [rootData, ...(messagesData || [])];

        const chatMessages: Message[] = [];
        for (const msg of allMessages) {
          chatMessages.push({
            id: `user-${msg.id}`,
            role: 'user',
            content: msg.user_message,
            timestamp: new Date(msg.created_at),
            imageUrl: msg.image_url
          });

          chatMessages.push({
            id: `assistant-${msg.id}`,
            role: 'assistant',
            content: msg.ai_response,
            timestamp: new Date(msg.created_at)
          });
        }

        chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(chatMessages);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation history",
          variant: "destructive"
        });

        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchConversationHistory();
  }, [conversationId, isNewChat, user, toast]);

  useEffect(() => {
    if (!isLoading && !isLoadingHistory) {
      scrollToBottom();
    }
  }, [messages, isLoading, isLoadingHistory]);

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !imageFile) || isLoading || !user) return;
    
    let imageUrl: string | null = null;
    
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl && !input.trim()) {
        return;
      }
    }
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      imageUrl: imageUrl || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const conversationContext = messages.filter(msg => msg.id !== 'welcome')
      .slice(-5).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: input,
          imageUrl: imageUrl,
          userId: user.id,
          context: conversationContext,
          conversationId: conversationId,
          thinkMode: isThinkMode
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsThinkMode(false); // Reset think mode after sending

      if (!conversationId) {
        try {
          const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
          const {
            data: rootData,
            error: rootError
          } = await supabase.from('ai_coach_conversations').insert({
            user_id: user.id,
            user_message: input,
            ai_response: data.response,
            is_root: true,
            title,
            image_url: imageUrl
          }).select('id').single();
          
          if (rootError) throw rootError;
          if (onConversationCreated && rootData?.id) {
            onConversationCreated(rootData.id);
          }
        } catch (insertError) {
          console.error('Error creating conversation:', insertError);
        }
      } else {
        try {
          await supabase.from('ai_coach_conversations').insert({
            user_id: user.id,
            user_message: input,
            ai_response: data.response,
            conversation_id: conversationId,
            image_url: imageUrl
          });
        } catch (insertError) {
          console.error('Error adding to conversation thread:', insertError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to get a response');
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRetry = () => {
    let lastUserMessage: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages.pop();
        }
        if (newMessages[newMessages.length - 1].role === 'user') {
          newMessages.pop();
        }
        return newMessages;
      });
    }
  };

  const copyConversation = async () => {
    try {
      setIsCopying(true);
      const conversationText = messages.filter(msg => msg.id !== 'welcome')
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI Coach'}: ${msg.content}`).join('\n\n');
      await navigator.clipboard.writeText(conversationText);
      toast({
        title: "Copied!",
        description: "Conversation copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
      timestamp: new Date()
    }]);
    if (onConversationCreated) {
      onConversationCreated('');
    }
    toast({
      title: "Started new conversation",
      description: "You can now start a new conversation"
    });
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (isLoading) return;
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0) return;
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    if (userMessageIndex < 0) return;
    const userMessage = messages[userMessageIndex];
    setMessages(prev => prev.filter((_, index) => index !== messageIndex));
    setIsLoading(true);
    setError(null);
    try {
      const conversationContext = messages.filter(msg => msg.id !== 'welcome')
      .slice(0, userMessageIndex).slice(-5).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: userMessage.content,
          userId: user?.id,
          context: conversationContext,
          conversationId: conversationId
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      toast({
        title: "Response regenerated",
        description: "Created a new response for you"
      });

      if (conversationId) {
        const dbIdMatch = messageId.match(/assistant-(.+)/);
        if (dbIdMatch && dbIdMatch[1]) {
          const dbId = dbIdMatch[1];
          await supabase.from('ai_coach_conversations').update({
            ai_response: data.response
          }).eq('id', dbId);
        }
      }
    } catch (error) {
      console.error('Error regenerating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate response');
      toast({
        title: "Error",
        description: "Failed to regenerate the response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    clearConversation();
  };

  if (isLoadingHistory) {
    return <div className="flex flex-col h-[75vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>;
  }

  return (
    <div className="flex flex-col h-[85vh] relative">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent h-6 pointer-events-none" />
      
      <ScrollArea 
        ref={messagesContainerRef} 
        className="flex-1 px-4 pt-4"
      >
        <div className="space-y-1 pb-4 max-w-3xl mx-auto">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onRegenerate={handleRegenerateMessage} 
            />
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in my-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
                <PaintBucket className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl p-4 bg-muted/70 shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 p-3 text-destructive bg-destructive/10 rounded-md animate-fade-in my-4 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                Retry
              </Button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-28 right-8 rounded-full shadow-md bg-background z-10 border border-border/50"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
      
      {messages.length === 1 && messages[0].id === 'welcome' && (
        <div className="px-4 pb-3">
          <p className="text-sm text-muted-foreground mb-2 ml-1">Try asking about:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <Card 
                key={index} 
                className="p-3 hover:bg-accent/50 transition-colors cursor-pointer border-border/30 hover:border-border/70" 
                onClick={() => handleExampleClick(question)}
              >
                <div className="flex items-start">
                  <LightbulbIcon className="h-4 w-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{question}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t px-4 py-3 bg-background/95 backdrop-blur-sm">
        {imagePreviewUrl && (
          <div className="relative mb-2 inline-block">
            <div className="relative group">
              <img 
                src={imagePreviewUrl} 
                alt="Upload preview" 
                className="h-20 w-auto rounded-md object-cover border border-border/40"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full" 
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
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
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {isThinkMode ? (
              <Badge variant="outline" className="px-1.5 h-5 text-xs font-normal bg-secondary/10 text-secondary">
                <Brain className="h-3 w-3 mr-1" /> Think Mode
              </Badge>
            ) : (
              <span className="opacity-0">.</span> /* Invisible placeholder to maintain layout */
            )}
          </p>
          
          <p className="text-xs text-muted-foreground flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-powered advice for painting professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
