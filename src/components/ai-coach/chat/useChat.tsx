
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

// Function to fetch conversation history
const fetchConversationHistory = async (conversationId: string | null, userId: string | undefined) => {
  if (!conversationId || !userId) {
    return [];
  }
  
  const { data: rootData, error: rootError } = await supabase
    .from('ai_coach_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
    
  if (rootError) throw rootError;

  const { data: messagesData, error: messagesError } = await supabase
    .from('ai_coach_conversations')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
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
  return chatMessages;
};

export const useChat = (
  conversationId: string | null,
  isNewChat: boolean,
  onConversationCreated?: (id: string) => void
) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isThinkMode, setIsThinkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch conversation history with caching
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['conversationHistory', conversationId],
    queryFn: () => fetchConversationHistory(conversationId, user?.id),
    enabled: !isNewChat && !!conversationId && !!user,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });
  
  // Set up the messages based on new chat status or history
  useEffect(() => {
    if (isNewChat) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    } else if (!isLoadingHistory && historyMessages.length > 0) {
      setMessages(historyMessages);
    } else if (!isLoadingHistory && historyMessages.length === 0 && !isNewChat && conversationId) {
      // Fallback if we couldn't load the history
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
        timestamp: new Date()
      }]);
    }
  }, [isNewChat, historyMessages, isLoadingHistory, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoading && !isLoadingHistory) {
      scrollToBottom();
    }
  }, [messages, isLoading, isLoadingHistory]);

  // Handle scroll for the scroll button
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

  // Image handling functions
  const handleImageClick = () => {
    fileInputRef.current?.click();
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

  // Upload image function
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      userMessage, 
      imageUrl 
    }: { 
      userMessage: string; 
      imageUrl: string | null 
    }) => {
      if (!user) throw new Error("No user logged in");

      const conversationContext = messages
        .filter(msg => msg.id !== 'welcome')
        .slice(-5)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: userMessage,
          imageUrl,
          userId: user.id,
          context: conversationContext,
          conversationId,
          thinkMode: isThinkMode
        }
      });

      if (error) throw new Error(error.message);

      return { 
        response: data.response, 
        userMessage, 
        imageUrl 
      };
    },
    onSuccess: async ({ response, userMessage, imageUrl }) => {
      if (!user) return;

      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsThinkMode(false); // Reset think mode after sending
      
      // Handle conversation management in Supabase
      try {
        if (!conversationId) {
          // Create new conversation
          const title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
          const { data: rootData, error: rootError } = await supabase
            .from('ai_coach_conversations')
            .insert({
              user_id: user.id,
              user_message: userMessage,
              ai_response: response,
              is_root: true,
              title,
              image_url: imageUrl
            })
            .select('id')
            .single();
          
          if (rootError) throw rootError;
          
          // Update the conversations cache
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
          
          if (onConversationCreated && rootData?.id) {
            onConversationCreated(rootData.id);
          }
        } else {
          // Add to existing conversation
          await supabase
            .from('ai_coach_conversations')
            .insert({
              user_id: user.id,
              user_message: userMessage,
              ai_response: response,
              conversation_id: conversationId,
              image_url: imageUrl
            });
          
          // Update the conversation history cache
          queryClient.invalidateQueries({ queryKey: ['conversationHistory', conversationId] });
        }
      } catch (error) {
        console.error('Error managing conversation:', error);
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to get a response');
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  // Handle sending a message
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
    
    sendMessageMutation.mutate({ 
      userMessage: input.trim(), 
      imageUrl 
    });
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
    
    setTimeout(() => {
      handleSendMessage();
    }, 100);
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

  // Copy conversation to clipboard
  const copyConversation = async () => {
    try {
      setIsCopying(true);
      const conversationText = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => `${msg.role === 'user' ? 'You' : 'AI Coach'}: ${msg.content}`)
        .join('\n\n');
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

  // Start a new conversation
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

  // Regenerate a message
  const regenerateMutation = useMutation({
    mutationFn: async ({ 
      messageId, 
      userMessageContent 
    }: { 
      messageId: string; 
      userMessageContent: string 
    }) => {
      if (!user) throw new Error("No user logged in");

      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex <= 0) throw new Error("Invalid message to regenerate");

      // Get context before this message
      const conversationContext = messages
        .filter(msg => msg.id !== 'welcome')
        .slice(0, messageIndex - 1)
        .slice(-5)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: userMessageContent,
          userId: user.id,
          context: conversationContext,
          conversationId
        }
      });

      if (error) throw new Error(error.message);

      return { 
        response: data.response, 
        messageId 
      };
    },
    onSuccess: async ({ response, messageId }) => {
      if (!user) return;

      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Update in Supabase if needed
      if (conversationId) {
        const dbIdMatch = messageId.match(/assistant-(.+)/);
        if (dbIdMatch && dbIdMatch[1]) {
          const dbId = dbIdMatch[1];
          await supabase
            .from('ai_coach_conversations')
            .update({ ai_response: response })
            .eq('id', dbId);
          
          // Update the conversation history cache
          queryClient.invalidateQueries({ 
            queryKey: ['conversationHistory', conversationId] 
          });
        }
      }

      toast({
        title: "Response regenerated",
        description: "Created a new response for you"
      });
    },
    onError: (error) => {
      console.error('Error regenerating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate response');
      toast({
        title: "Error",
        description: "Failed to regenerate the response. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleRegenerateMessage = async (messageId: string) => {
    if (isLoading) return;
    
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0) return;
    
    // Find the corresponding user message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) return;
    
    const userMessage = messages[userMessageIndex];
    
    // Remove the assistant message we're regenerating
    setMessages(prev => prev.filter((_, index) => index !== messageIndex));
    setIsLoading(true);
    setError(null);
    
    regenerateMutation.mutate({ 
      messageId, 
      userMessageContent: userMessage.content 
    });
  };

  return {
    input,
    setInput,
    messages,
    isLoading,
    isLoadingHistory,
    error,
    imageFile,
    imagePreviewUrl,
    isUploading,
    showScrollButton,
    isThinkMode,
    setIsThinkMode,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    handleImageClick,
    handleImageChange,
    removeImage,
    handleSendMessage,
    handleKeyDown,
    handleExampleClick,
    handleRetry,
    copyConversation,
    clearConversation,
    handleRegenerateMessage,
    scrollToBottom
  };
};
