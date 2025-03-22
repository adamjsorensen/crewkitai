
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../types';

interface UseSendMessageProps {
  user: any;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
  removeImage: () => void;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSendMessage = ({
  user,
  messages,
  setMessages,
  setIsLoading,
  setError,
  conversationId,
  onConversationCreated,
  uploadImage,
  removeImage,
  setIsThinkMode
}: UseSendMessageProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      userMessage, 
      imageUrl,
      isThinkMode
    }: { 
      userMessage: string; 
      imageUrl: string | null;
      isThinkMode: boolean;
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

  const handleSendMessage = useCallback(async (input: string, imageFile: File | null, isThinkMode: boolean) => {
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
      imageUrl,
      isThinkMode
    });
  }, [user, uploadImage, removeImage, sendMessageMutation, setMessages, setIsLoading, setError]);

  return {
    handleSendMessage
  };
};
