
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '../types';
import { User } from '@supabase/supabase-js';

interface SendMessageParams {
  userMessage: string;
  imageUrl: string | null;
  isThinkMode: boolean;
  user: User;
  messages: Message[];
  conversationId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsThinkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onConversationCreated?: (id: string) => void;
}

export const useSendMessageMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userMessage,
      imageUrl,
      isThinkMode,
      user,
      messages,
      conversationId,
      setMessages,
      setIsThinkMode,
      onConversationCreated
    }: SendMessageParams) => {
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

      console.log("[useSendMessageMutation] Response from edge function:", {
        responseLength: data.response?.length,
        hasSuggestedFollowUps: !!data.suggestedFollowUps,
        followUpsCount: data.suggestedFollowUps?.length || 0,
        followUps: data.suggestedFollowUps
      });

      // Replace placeholder with actual response, now including suggested follow-ups
      setMessages(prev => prev.map(msg => {
        if (msg.id === placeholderId) {
          return {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            suggestedFollowUps: data.suggestedFollowUps || []
          };
        }
        return msg;
      }));
      
      setIsThinkMode(false);

      // Handle conversation persistence
      if (!conversationId) {
        const title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
        const { data: rootData, error: rootError } = await supabase
          .from('ai_coach_conversations')
          .insert({
            user_id: user.id,
            user_message: userMessage,
            ai_response: data.response,
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

        return { 
          response: data.response, 
          newConversationId: rootData?.id,
          suggestedFollowUps: data.suggestedFollowUps || []
        };
      } else {
        await supabase
          .from('ai_coach_conversations')
          .insert({
            user_id: user.id,
            user_message: userMessage,
            ai_response: data.response,
            conversation_id: conversationId,
            image_url: imageUrl
          });
        
        queryClient.invalidateQueries({ queryKey: ['conversationHistory', conversationId] });
        
        return { 
          response: data.response,
          suggestedFollowUps: data.suggestedFollowUps || []
        };
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    }
  });
};
