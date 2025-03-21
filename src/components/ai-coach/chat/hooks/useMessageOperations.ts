
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message, ConversationContext } from '../types';

interface UseMessageOperationsProps {
  user: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
  imageFile: File | null;
  isThinkMode: boolean;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useMessageOperations = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  uploadImage,
  removeImage,
  imageFile,
  isThinkMode,
  setIsThinkMode
}: UseMessageOperationsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      setIsThinkMode(false);

      try {
        if (!conversationId) {
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
          
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
          
          if (onConversationCreated && rootData?.id) {
            onConversationCreated(rootData.id);
          }
        } else {
          await supabase
            .from('ai_coach_conversations')
            .insert({
              user_id: user.id,
              user_message: userMessage,
              ai_response: response,
              conversation_id: conversationId,
              image_url: imageUrl
            });
          
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

  const regenerateMutation = useMutation({
    mutationFn: async ({ 
      messageId, 
      userMessageContent 
    }: { 
      messageId: string; 
      userMessageContent: string 
    }) => {
      if (!user) throw new Error("No user logged in");

      const assistantMessageIndex = messages.findIndex(msg => msg.id === messageId);
      if (assistantMessageIndex <= 0) throw new Error("Invalid message to regenerate");

      let userMessageIndex = assistantMessageIndex - 1;
      while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) throw new Error("No user message found to regenerate response");

      const conversationContext = messages
        .filter(msg => msg.id !== 'welcome')
        .slice(0, userMessageIndex)
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
        messageId,
        userMessageIndex,
        assistantMessageIndex 
      };
    },
    onSuccess: async ({ response, messageId, assistantMessageIndex }) => {
      if (!user) return;

      const aiResponse: Message = {
        id: `assistant-regenerated-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.splice(assistantMessageIndex, 1);
        newMessages.splice(assistantMessageIndex, 0, aiResponse);
        return newMessages;
      });
      
      if (conversationId) {
        try {
          const dbIdMatch = messageId.match(/assistant-(.+)/);
          if (dbIdMatch && dbIdMatch[1]) {
            const dbId = dbIdMatch[1];
            await supabase
              .from('ai_coach_conversations')
              .update({ ai_response: response })
              .eq('id', dbId);
            
            queryClient.invalidateQueries({ 
              queryKey: ['conversationHistory', conversationId] 
            });
          }
        } catch (error) {
          console.error('Error updating regenerated message in database:', error);
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
        description: error instanceof Error ? error.message : "Failed to regenerate the response. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleSendMessage = useCallback(async (input: string) => {
    if ((!input.trim() && !imageFile) || !user) return;
    
    let imageUrl: string | null = null;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);
    
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (imageUrl) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'user' && lastMsg.id === userMessage.id) {
              updated[updated.length - 1] = {
                ...lastMsg,
                imageUrl
              };
            }
          }
          return updated;
        });
      }
      removeImage();
    }
    
    sendMessageMutation.mutate({ 
      userMessage: input.trim(), 
      imageUrl 
    });
  }, [imageFile, user, uploadImage, removeImage, sendMessageMutation, setMessages, setIsLoading, setError]);

  const handleRetry = useCallback(() => {
    let lastUserMessage: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }
    if (lastUserMessage) {
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
      return lastUserMessage.content;
    }
    return '';
  }, [messages, setMessages]);

  const handleRegenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0 || messages[messageIndex].role !== 'assistant') {
      toast({
        title: "Error",
        description: "Invalid message to regenerate",
        variant: "destructive"
      });
      return;
    }
    
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) {
      toast({
        title: "Error",
        description: "No user message found to regenerate from",
        variant: "destructive"
      });
      return;
    }
    
    const userMessage = messages[userMessageIndex];
    
    setIsLoading(true);
    setError(null);
    
    regenerateMutation.mutate({ 
      messageId, 
      userMessageContent: userMessage.content 
    });
  };

  return {
    handleSendMessage,
    handleRetry,
    handleRegenerateMessage
  };
};
