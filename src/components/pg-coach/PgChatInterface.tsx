import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import PgMessageList from './PgMessageList';
import PgChatInput from './PgChatInput';
import PgWelcomeSection from './PgWelcomeSection';
import { PaintBucket, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PgMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPlaceholder?: boolean;
  imageUrl?: string | null;
  suggestedFollowUps?: string[];
}

interface PgChatInterfaceProps {
  conversationId?: string | null;
  onConversationStart?: (id: string) => void;
}

const PgChatInterface: React.FC<PgChatInterfaceProps> = ({ 
  conversationId: initialConversationId,
  onConversationStart
}) => {
  const [messages, setMessages] = useState<PgMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(!!initialConversationId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const SUPABASE_URL = "https://cicnpivviiqycyudgxxg.supabase.co";

  useEffect(() => {
    if (initialConversationId) {
      loadConversationHistory(initialConversationId);
      setHasStartedChat(true);
    } else if (hasStartedChat) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
          timestamp: new Date(),
        }
      ]);
    }
  }, [initialConversationId, hasStartedChat]);

  const loadConversationHistory = async (convoId: string) => {
    setIsLoadingHistory(true);
    setError(null);
    
    try {
      console.log("[PgChatInterface] Loading conversation history for ID:", convoId);
      const { data: messagesData, error: messagesError } = await supabase
        .from('pg_messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        throw messagesError;
      }
      
      console.log("[PgChatInterface] Received message data:", messagesData);
      
      if (messagesData && messagesData.length > 0) {
        const formattedMessages: PgMessage[] = messagesData.map(msg => {
          let suggestedFollowUps: string[] | undefined = undefined;
          
          if (msg.metadata && typeof msg.metadata === 'object' && 'suggestedFollowUps' in msg.metadata) {
            const followUps = msg.metadata.suggestedFollowUps;
            if (Array.isArray(followUps)) {
              suggestedFollowUps = followUps;
            }
          }
          
          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            imageUrl: msg.image_url,
            suggestedFollowUps: suggestedFollowUps,
          };
        });
        
        console.log("[PgChatInterface] Formatted messages:", formattedMessages);
        setMessages(formattedMessages);
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
            timestamp: new Date(),
          }
        ]);
      }
    } catch (err) {
      console.error("[PgChatInterface] Error loading conversation history:", err);
      setError("Failed to load conversation history");
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
    if (messages.length > 0 && !isLoadingHistory) {
      scrollToBottom();
    }
  }, [messages, isLoadingHistory]);

  const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    if (!hasStartedChat) {
      setHasStartedChat(true);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
          timestamp: new Date(),
        }
      ]);
    }
    
    try {
      setError(null);
      
      const userMessage: PgMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      
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
      
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      console.log("[PgChatInterface] Preparing to call edge function:", {
        endpoint: `${SUPABASE_URL}/functions/v1/pg-coach`,
        hasToken: !!accessToken,
        messageLength: messageText.length,
        hasImage: !!imageUrl,
        isThinkMode,
        existingConversationId: conversationId
      });
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pg-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          imageUrl,
          isThinkMode,
        }),
      });
      
      console.log("[PgChatInterface] Edge function response status:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[PgChatInterface] API error response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error("[PgChatInterface] Parsed API error:", errorJson);
          throw new Error(`API error: ${errorJson.error || errorJson.message || 'Unknown error'}`);
        } catch (parseError) {
          throw new Error(`API error (${response.status}): ${errorText || 'No error details available'}`);
        }
      }
      
      const data = await response.json();
      console.log("[PgChatInterface] Edge function success response:", {
        hasConversationId: !!data.conversationId,
        responseLength: data.response?.length || 0,
        hasSuggestedFollowUps: Array.isArray(data.suggestedFollowUps),
        suggestedFollowUps: data.suggestedFollowUps
      });
      
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
        console.log("[PgChatInterface] New conversation created:", data.conversationId);
        
        if (onConversationStart) {
          onConversationStart(data.conversationId);
        }
      }
      
      const suggestedFollowUps = Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : [];
      
      setMessages((prev) => 
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                id: placeholderId,
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                suggestedFollowUps: suggestedFollowUps,
              }
            : msg
        )
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("[PgChatInterface] Error sending message:", err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
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
    setHasStartedChat(true);
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

  const handleNewChat = () => {
    setHasStartedChat(false);
    setMessages([]);
    setConversationId(null);
    
    if (onConversationStart) {
      onConversationStart('');
    }
  };

  if (!hasStartedChat) {
    return <PgWelcomeSection onExampleClick={handleExampleClick} onNewChat={handleNewChat} />;
  }

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNewChat}
          >
            <ListPlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>
      
      <PgMessageList
        messages={messages}
        isLoading={isLoading || isLoadingHistory}
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
