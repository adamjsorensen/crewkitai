
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

  // This is kept for backward compatibility but should now redirect to PG conversations
  console.warn('Legacy useConversations hook used - redirecting to PG conversations');
  
  // In the migration phase, we might want to fetch both and combine
  // For now, just use the pg_conversations directly
  const { data, error } = await supabase
    .from('pg_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Transform data to conversation format
  return data.map(conv => ({
    id: conv.id,
    title: conv.title || 'Untitled conversation',
    lastMessage: '', // We don't have this in pg_conversations directly
    timestamp: new Date(conv.created_at),
    pinned: conv.pinned || false
  }));
};

// This hook now acts as a redirect to usePgConversations
export const useConversations = () => {
  // Use PgCoach conversations instead
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
