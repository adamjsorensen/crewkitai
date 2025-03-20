import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

export const useChat = (
  conversationId: string | null,
  isNewChat: boolean,
  onConversationCreated?: (id: string) => void
) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
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

  const handleFollowUpQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      handleSendMessage();
    }, 100);
  };

  const handleExplainFurther = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex < 0) return;
    
    const assistantMessage = messages[messageIndex];
    if (assistantMessage.role !== 'assistant') return;
    
    setInput(`Could you explain this in more detail: "${assistantMessage.content.substring(0, 100)}..."`);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      handleSendMessage();
    }, 100);
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
    handleFollowUpQuestion,
    handleExplainFurther,
    scrollToBottom
  };
};
