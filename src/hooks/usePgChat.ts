import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PgMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPlaceholder?: boolean;
  imageUrl?: string | null;
  suggestedFollowUps?: string[];
}

interface UsePgChatProps {
  initialConversationId?: string | null;
  onConversationStart?: (id: string) => void;
}

export const usePgChat = ({ initialConversationId, onConversationStart }: UsePgChatProps) => {
  const [messages, setMessages] = useState<PgMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(!!initialConversationId);
  
  const { user } = useAuth();
  const { toast } = useToast();

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
              suggestedFollowUps = followUps.map(item => String(item));
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

  const createInitialChatMessages = (messageText: string, imageUrl: string | null = null) => {
    console.log("[usePgChat] Creating initial chat messages");
    
    const welcomeMessage: PgMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
      timestamp: new Date(),
    };
    
    const userMessage: PgMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
    };
    
    const placeholderId = crypto.randomUUID();
    const placeholderMessage: PgMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isPlaceholder: true,
    };
    
    setMessages([welcomeMessage, userMessage, placeholderMessage]);
    
    return { userMessage, placeholderId };
  };

  const prepareUserMessageUI = (messageText: string, imageUrl: string | null = null) => {
    console.log("[usePgChat] Preparing UI for user message");
    
    const userMessage: PgMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
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
    
    return { userMessage, placeholderId };
  };

  const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    try {
      setError(null);
      setIsLoading(true);
      
      const isFirstMessage = !conversationId;
      
      let imageUrl = null;
      if (imageFile) {
        console.log("[usePgChat] Uploading image file...");
        try {
          const filePath = `chat_images/${user!.id}/${crypto.randomUUID()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat_images')
            .upload(filePath, imageFile);
          
          if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('chat_images')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrl;
          console.log("[usePgChat] Image uploaded successfully:", imageUrl);
        } catch (imageError) {
          console.error("[usePgChat] Image upload error:", imageError);
          toast({
            title: "Image Upload Failed",
            description: "We couldn't upload your image, but your message will still be sent.",
            variant: "destructive",
          });
        }
      }
      
      console.log("[usePgChat] Preparing to call edge function:", {
        endpoint: `${SUPABASE_URL}/functions/v1/pg-coach`,
        hasToken: true,
        messageLength: messageText.length,
        hasImage: !!imageUrl,
        isThinkMode,
        existingConversationId: conversationId
      });
      
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
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
      
      console.log("[usePgChat] Edge function response status:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[usePgChat] API error response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error("[usePgChat] Parsed API error:", errorJson);
          throw new Error(`API error: ${errorJson.error || errorJson.message || 'Unknown error'}`);
        } catch (parseError) {
          throw new Error(`API error (${response.status}): ${errorText || 'No error details available'}`);
        }
      }
      
      const data = await response.json();
      console.log("[usePgChat] Edge function success response:", {
        hasConversationId: !!data.conversationId,
        responseLength: data.response?.length || 0,
        hasSuggestedFollowUps: Array.isArray(data.suggestedFollowUps),
      });
      
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
        console.log("[usePgChat] New conversation created:", data.conversationId);
        
        if (onConversationStart) {
          onConversationStart(data.conversationId);
        }
      }
      
      const suggestedFollowUps = Array.isArray(data.suggestedFollowUps) 
        ? data.suggestedFollowUps.map(item => String(item)) 
        : [];
      
      setMessages((prev) => 
        prev.map((msg) =>
          msg.isPlaceholder
            ? {
                id: msg.id,
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
      console.error("[usePgChat] Error sending message:", err);
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

  return {
    messages,
    setMessages,
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    hasStartedChat,
    handleSendMessage,
    handleRetry,
    handleExampleClick,
    handleToggleThinkMode,
    handleNewChat,
  };
};
