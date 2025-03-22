
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

      // Add placeholder assistant message to UI immediately for better UX
      const placeholderId = `assistant-placeholder-${Date.now()}`;
      const placeholderMessage: Message = {
        id: placeholderId,
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
        isPlaceholder: true
      };
      
      setMessages(prev => [...prev, placeholderMessage]);

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
        imageUrl,
        placeholderId
      };
    },
    onSuccess: async ({ response, userMessage, imageUrl, placeholderId }) => {
      if (!user) return;

      // Replace placeholder with actual response
      setMessages(prev => prev.map(msg => {
        if (msg.id === placeholderId) {
          return {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
        }
        return msg;
      }));
      
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
    
    // We don't add the user message here because it should be done in the calling component
    // for better UI responsiveness
    
    setIsLoading(true);
    setError(null);
    
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (imageUrl) {
        // Update the user message with the image
        setMessages(prev => {
          const updated = [...prev];
          // Find the last user message
          const lastUserMsgIndex = updated.length - 1;
          if (lastUserMsgIndex >= 0 && updated[lastUserMsgIndex].role === 'user') {
            updated[lastUserMsgIndex] = {
              ...updated[lastUserMsgIndex],
              imageUrl
            };
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
