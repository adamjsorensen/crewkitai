
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
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

  // Create initial chat messages with welcome, user message, and placeholder
  const createInitialChatMessages = (messageText: string, imageUrl: string | null = null) => {
    console.log("[PgChatInterface] Creating initial chat messages");
    
    // Welcome message
    const welcomeMessage: PgMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! I\'m the PainterGrowth Coach, ready to help you grow your painting business. What can I help you with today?',
      timestamp: new Date(),
    };
    
    // User message
    const userMessage: PgMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
    };
    
    // Placeholder for AI response
    const placeholderId = crypto.randomUUID();
    const placeholderMessage: PgMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isPlaceholder: true,
    };
    
    // Update state with all three messages at once
    setMessages([welcomeMessage, userMessage, placeholderMessage]);
    
    return { userMessage, placeholderId };
  };

  // Function to prepare user message UI for subsequent messages
  const prepareUserMessageUI = (messageText: string, imageUrl: string | null = null) => {
    console.log("[PgChatInterface] Preparing UI for user message");
    
    // Create user message
    const userMessage: PgMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl,
    };
    
    // Create placeholder for AI response
    const placeholderId = crypto.randomUUID();
    const placeholderMessage: PgMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isPlaceholder: true,
    };
    
    // Immediately update UI with user message and placeholder
    setMessages((prev) => [...prev, userMessage, placeholderMessage]);
    
    return { userMessage, placeholderId };
  };

  // Handle send message
  const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
    if (!messageText.trim() && !imageFile) return;
    
    try {
      setError(null);
      setIsLoading(true);
      
      // Step 1: Handle the UI updates first (before any async operations)
      const isFirstMessage = !hasStartedChat;
      let userMessage: PgMessage;
      let placeholderId: string;
      
      // First-time chat initialization
      if (isFirstMessage) {
        console.log("[PgChatInterface] Starting first chat - creating welcome message, user message, and placeholder");
        setHasStartedChat(true);
        // For first message, we need to include the welcome message
        const result = createInitialChatMessages(messageText);
        userMessage = result.userMessage;
        placeholderId = result.placeholderId;
      } else {
        // For subsequent messages, just add the user message and placeholder
        console.log("[PgChatInterface] Adding user message and placeholder to existing chat");
        const result = prepareUserMessageUI(messageText);
        userMessage = result.userMessage;
        placeholderId = result.placeholderId;
      }
      
      // Step 2: Handle image upload if needed (after UI is updated)
      let imageUrl = null;
      if (imageFile) {
        console.log("[PgChatInterface] Uploading image file...");
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
          console.log("[PgChatInterface] Image uploaded successfully:", imageUrl);
          
          // Update the user message with the image URL
          setMessages((prev) => 
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, imageUrl }
                : msg
            )
          );
        } catch (imageError) {
          console.error("[PgChatInterface] Image upload error:", imageError);
          // Continue with the message even if image upload fails
          toast({
            title: "Image Upload Failed",
            description: "We couldn't upload your image, but your message will still be sent.",
            variant: "destructive",
          });
        }
      }
      
      // Step 3: Fetch AI response asynchronously
      console.log("[PgChatInterface] Preparing to call edge function:", {
        endpoint: `${SUPABASE_URL}/functions/v1/pg-coach`,
        hasToken: true, // Don't log the actual token
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
      
      const suggestedFollowUps = Array.isArray(data.suggestedFollowUps) 
        ? data.suggestedFollowUps.map(item => String(item)) 
        : [];
      
      // Update placeholder with actual AI response
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
      
      // Make sure hasStartedChat stays true even if there's an error
      // to prevent UI flicker on retries
      setHasStartedChat(true);
      
      // Remove placeholder on error
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
    isLoading,
    isLoadingHistory,
    error,
    isThinkMode,
    hasStartedChat,
    showScrollButton,
    messagesEndRef,
    messagesContainerRef,
    handleSendMessage,
    handleRetry,
    handleExampleClick,
    handleToggleThinkMode,
    handleNewChat,
    scrollToBottom,
  };
};
