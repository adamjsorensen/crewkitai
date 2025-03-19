import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  RefreshCw, 
  HistoryIcon, 
  Sparkles, 
  LightbulbIcon,
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  PaintBucket
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Card } from '@/components/ui/card';
import TypingIndicator from './TypingIndicator';
import AnimatedButton from '@/components/ui-components/AnimatedButton';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const EXAMPLE_QUESTIONS = [
  "How do I price a 2,000 sq ft exterior job?",
  "What's the best way to handle a difficult client?",
  "How can I improve my crew's efficiency?",
  "What marketing strategies work during slow seasons?",
];

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const conversationContext = messages
        .slice(-5)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          message: input, 
          userId: user?.id,
          context: conversationContext
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to get a response');
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
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
      const conversationText = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI Coach'}: ${msg.content}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(conversationText);
      toast({
        title: "Copied!",
        description: "Conversation copied to clipboard",
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

  const clearConversation = () => {
    setMessages([]);
    toast({
      title: "Conversation cleared",
      description: "Starting a new conversation",
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
      const conversationContext = messages
        .slice(0, userMessageIndex)
        .slice(-5)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          message: userMessage.content, 
          userId: user?.id,
          context: conversationContext
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      toast({
        title: "Response regenerated",
        description: "Created a new response for you",
      });
    } catch (error) {
      console.error('Error regenerating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate response');
      toast({
        title: "Error",
        description: "Failed to regenerate the response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={messages.length <= 1 || isLoading || isCopying}
          onClick={copyConversation}
          className="h-7 px-2"
          title="Copy conversation"
          aria-label="Copy conversation to clipboard"
        >
          {isCopying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy conversation</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          disabled={messages.length <= 1 || isLoading}
          onClick={clearConversation}
          className="text-destructive hover:text-destructive h-7 px-2"
          title="Clear conversation"
          aria-label="Clear conversation and start new"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Clear conversation</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-3 pt-8">
        <div className="space-y-3">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onRegenerate={handleRegenerateMessage}
            />
          ))}
          {isLoading && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <PaintBucket className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-xl p-2 bg-muted">
                <TypingIndicator />
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 p-2 text-destructive bg-destructive/10 rounded-md animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                Retry
              </Button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {messages.length === 1 && (
        <div className="px-3 pb-3">
          <p className="text-sm text-muted-foreground mb-2">Try asking about:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="justify-start text-left h-auto py-1.5 px-2 text-sm hover:bg-muted/50 transition-colors"
                onClick={() => handleExampleClick(question)}
              >
                <LightbulbIcon className="h-4 w-4 mr-2 text-primary" />
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t p-3 bg-background">
        <div className="flex space-x-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Coach anything about your painting business..."
            className="resize-none min-h-[50px] focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            disabled={isLoading}
          />
          <AnimatedButton
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </AnimatedButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-powered advice tailored for painting professionals
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
