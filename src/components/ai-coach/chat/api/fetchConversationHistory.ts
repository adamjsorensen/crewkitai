
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';

export const fetchConversationHistory = async (conversationId: string | null, userId: string | undefined) => {
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
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (messagesError) throw messagesError;

  const messagesReversed = messagesData?.reverse() || [];
  const allMessages = [rootData, ...messagesReversed];
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

  return chatMessages;
};
