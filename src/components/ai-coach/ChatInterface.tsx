import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, RefreshCw, HistoryIcon, Sparkles, LightbulbIcon, AlertCircle, Loader2, Trash2, Copy, PaintBucket, PlusCircle } from 'lucide-react';
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

const EXAMPLE_QUESTIONS = ["How do I price a 2,000 sq ft exterior job?", "What's the best way to handle a difficult client?", "How can I improve my crew's efficiency?", "What marketing strategies work during slow seasons?"];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
            timestamp: new Date(msg.created_at)
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
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
          userId: user.id,
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
            title
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
            conversation_id: conversationId
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

  return <div className="flex flex-col h-[75vh] relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        
        
        
        
        
      </div>
      
      <ScrollArea className="flex-1 p-3 pt-8">
        <div className="space-y-3">
          {messages.map(message => <ChatMessage key={message.id} message={message} onRegenerate={handleRegenerateMessage} />)}
          {isLoading && <div className="flex items-start gap-2 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <PaintBucket className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-xl p-2 bg-muted">
                <TypingIndicator />
              </div>
            </div>}
          {error && <div className="flex items-center space-x-2 p-2 text-destructive bg-destructive/10 rounded-md animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                Retry
              </Button>
            </div>}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {messages.length === 1 && messages[0].id === 'welcome' && <div className="px-3 pb-3">
          <p className="text-sm text-muted-foreground mb-2">Try asking about:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((question, index) => <Button key={index} variant="outline" className="justify-start text-left h-auto py-1.5 px-2 text-sm hover:bg-muted/50 transition-colors" onClick={() => handleExampleClick(question)}>
                <LightbulbIcon className="h-4 w-4 mr-2 text-primary" />
                {question}
              </Button>)}
          </div>
        </div>}
      
      <div className="border-t p-3 bg-background">
        <div className="flex space-x-2">
          <Textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask your AI Coach anything about your painting business..." className="resize-none min-h-[50px] focus:border-primary focus:ring-1 focus:ring-primary transition-colors" disabled={isLoading} />
          <AnimatedButton onClick={handleSendMessage} disabled={!input.trim() || isLoading || !user} className="self-end">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </AnimatedButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-powered advice tailored for painting professionals
        </p>
      </div>
    </div>;
};

export default ChatInterface;
