
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePgConversations } from './usePgConversations';

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
};

// Function to fetch conversations with pagination
const fetchConversations = async (userId: string | undefined) => {
  if (!userId) return [];

  // Limit fetch to a reasonable number to improve performance
  const { data, error } = await supabase
    .from('ai_coach_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_root', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50); // More reasonable limit for mobile

  if (error) throw error;

  // Transform data to conversation format - more efficient
  return data.map(conv => ({
    id: conv.id,
    title: conv.title || 'Untitled conversation',
    lastMessage: conv.user_message.substring(0, 60) + (conv.user_message.length > 60 ? '...' : ''),
    timestamp: new Date(conv.created_at),
    pinned: conv.pinned || false
  }));
};

export const useConversations = () => {
  // Use PG Coach conversations by default
  return usePgConversations();
};

// Export for potential prefetching
export const prefetchConversations = async (queryClient: any, userId: string | undefined) => {
  if (userId) {
    await queryClient.prefetchQuery({
      queryKey: ['conversations', userId],
      queryFn: () => fetchConversations(userId),
      staleTime: 5 * 60 * 1000,
    });
  }
};
