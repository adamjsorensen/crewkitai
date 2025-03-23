
import React, { useState, useRef, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import PgMessageList from './PgMessageList';
import PgChatInput from './PgChatInput';
import { PaintBucket, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types for our messages
export interface PgMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPlaceholder?: boolean;
  imageUrl?: string | null;
  suggestedFollowUps?: string[];
}

const PgChatInterface = () => {
  const [messages, setMessages] = useState<PgMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Add welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
        timestamp: new Date(),
      }
    ]);
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollButton(!isBottom);
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    try {
      setError(null);
      
      // Add user message to the UI
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      
      // Add placeholder for assistant response
      const placeholderId = crypto.randomUUID();
      const placeholderMessage: PgMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlaceholder: true,
      };
      
      setMessages((prev) => [...prev, userMessage, placeholderMessage]);
      setIsLoading(true);
      
      // Process image if provided
      let imageUrl = null;
      if (imageFile) {
        const filePath = `pg-coach/${user!.id}/${crypto.randomUUID()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, imageFile);
        
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      // Call the edge function to get the AI response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pg-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          imageUrl,
          isThinkMode,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${errorData}`);
      }
      
      const data = await response.json();
      
      // Update the conversation ID if this is a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Replace the placeholder with the actual response
      setMessages((prev) => 
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                id: placeholderId,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: data.suggestedFollowUps || [],
              }
            : msg
        )
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Remove the placeholder message
      setMessages((prev) => prev.filter(msg => !msg.isPlaceholder));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(message => message.role === 'user');
      
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleExampleClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleToggleThinkMode = () => {
    setIsThinkMode(!isThinkMode);
    toast({
      title: isThinkMode ? "Think Mode Disabled" : "Think Mode Enabled",
      description: isThinkMode 
        ? "The AI will now provide normal responses" 
        : "The AI will now provide more thorough analysis",
      variant: "default",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <PaintBucket className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-medium">PainterGrowth Coach</h1>
            <p className="text-xs text-muted-foreground">Your painting business advisor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleThinkMode}
            className={isThinkMode ? 'bg-primary/20' : ''}
          >
            {isThinkMode ? 'Thinking...' : 'Think Mode'}
          </Button>
          {!isMobile && (
            <Button variant="outline" size="sm" onClick={() => {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
                  timestamp: new Date(),
                }
              ]);
              setConversationId(null);
            }}>
              <ListPlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
      </div>
      
      <PgMessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        handleRetry={handleRetry}
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        handleExampleClick={handleExampleClick}
        isMobile={isMobile}
      />
      
      <PgChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        isMobile={isMobile}
      />
    </div>
  );
};

export default PgChatInterface;
