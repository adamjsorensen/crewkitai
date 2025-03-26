
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Message } from "../components/ai-coach/chat/types";
import { User } from "@supabase/supabase-js";

export interface SendMessageResult {
  response: string;
  suggestedFollowUps: string[];
  assistantMessageId: string;
}

interface SendMessageMutationParams {
  userMessage: string;
  imageUrl?: string | null;
  isThinkMode: boolean;
  user: User;
  messages: Message[];
  conversationId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsThinkMode?: React.Dispatch<React.SetStateAction<boolean>>;
  onConversationCreated?: (id: string) => void;
}

export const useSendMessageMutation = () => {
  return useMutation({
    mutationFn: async (params: SendMessageMutationParams): Promise<SendMessageResult> => {
      const {
        userMessage,
        imageUrl,
        isThinkMode,
        user,
        messages,
        conversationId,
        setMessages,
        setIsThinkMode,
        onConversationCreated
      } = params;

      // Generate local IDs
      const userMessageId = uuidv4();
      const assistantMessageId = uuidv4();
      let actualConversationId = conversationId;

      // Create a new conversation if needed
      if (!actualConversationId) {
        try {
          const { data: newConversation, error } = await supabase
            .from('pg_conversations')
            .insert({
              user_id: user.id,
              title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          
          actualConversationId = newConversation.id;
          console.log('[useSendMessageMutation] Created new conversation:', actualConversationId);
          
          if (onConversationCreated) {
            onConversationCreated(actualConversationId);
          }
        } catch (error) {
          console.error('[useSendMessageMutation] Error creating conversation:', error);
          throw error;
        }
      }

      // Add user message to UI immediately
      console.log('[useSendMessageMutation] Adding user message to UI:', userMessageId);
      setMessages(prevMessages => [
        ...prevMessages.filter(m => !m.isPlaceholder),
        {
          id: userMessageId,
          content: userMessage,
          role: 'user',
          timestamp: new Date(), // Add timestamp for Message type compatibility
          created_at: new Date().toISOString(),
          conversation_id: actualConversationId || '',
          image_url: imageUrl
        } as Message
      ]);

      // Add placeholder for assistant message
      console.log('[useSendMessageMutation] Adding assistant placeholder message:', assistantMessageId);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: assistantMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date(), // Add timestamp for Message type compatibility
          created_at: new Date().toISOString(),
          conversation_id: actualConversationId || '',
          isPlaceholder: true
        } as Message
      ]);

      try {
        // Save user message to database
        const { error: messageError } = await supabase
          .from('pg_messages')
          .insert({
            id: userMessageId,
            conversation_id: actualConversationId,
            content: userMessage,
            role: 'user',
            user_id: user.id,
            image_url: imageUrl
          });

        if (messageError) throw messageError;

        // Call edge function to get AI response
        console.log('[useSendMessageMutation] Calling AI coach function with thinkMode:', isThinkMode);
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-coach', {
          body: {
            message: userMessage,
            imageUrl: imageUrl,
            isThinkMode: isThinkMode
          }
        });

        if (aiError) throw aiError;
        if (!aiResponse) throw new Error('Empty response from AI coach');

        // Extract the response and suggested follow-ups
        const { response, suggestedFollowUps = [] } = aiResponse;
        
        console.log('[useSendMessageMutation] AI response received, length:', response.length);
        console.log('[useSendMessageMutation] Follow-up suggestions:', suggestedFollowUps.length);

        // Update the placeholder message with the actual response
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === assistantMessageId ? 
              {
                ...message,
                content: response,
                suggestedFollowUps: suggestedFollowUps,
                isPlaceholder: false
              } : 
              message
          )
        );

        // Save assistant message to database
        const { error: assistantError } = await supabase
          .from('pg_messages')
          .insert({
            id: assistantMessageId,
            conversation_id: actualConversationId,
            content: response,
            role: 'assistant',
            user_id: user.id,
            metadata: { suggestedFollowUps }
          });

        if (assistantError) throw assistantError;

        // Update conversation last message and title if this is the first message
        const { error: updateError } = await supabase
          .from('pg_conversations')
          .update({
            title: messages.length <= 2 ? userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '') : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', actualConversationId);

        if (updateError) throw updateError;

        // Exit think mode after receiving response
        if (isThinkMode && setIsThinkMode) {
          setIsThinkMode(false);
        }

        return {
          response,
          suggestedFollowUps,
          assistantMessageId
        };
      } catch (error) {
        console.error('[useSendMessageMutation] Error in send message process:', error);
        
        // Remove the placeholder message on error
        setMessages(prevMessages => 
          prevMessages.filter(message => 
            message.id !== assistantMessageId || !message.isPlaceholder
          )
        );
        
        throw error;
      }
    }
  });
};
