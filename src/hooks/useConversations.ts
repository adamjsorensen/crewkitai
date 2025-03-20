
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations with improved caching
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user?.id),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    enabled: !!user, // Only run the query if we have a user
  });

  // Create a new conversation - optimized with useCallback
  const createNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    setIsNewChat(true);
  }, []);

  // Select a conversation - optimized with useCallback
  const selectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setIsNewChat(false);
  }, []);

  // Delete a conversation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_coach_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['conversations', user?.id] });

      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations', user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old) => old ? old.filter(conv => conv.id !== deletedId) : []
      );

      return { previousConversations };
    },
    onSuccess: (deletedId, _, context) => {
      // If the deleted conversation was selected, clear selection and set new chat state
      if (selectedConversationId === deletedId) {
        setSelectedConversationId(null);
        setIsNewChat(true);
      }

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been permanently removed',
      });
    },
    onError: (error, deletedId, context) => {
      console.error('Error deleting conversation:', error);
      // Rollback to the previous state
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', user?.id], context.previousConversations);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  });

  const deleteConversation = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  // Pin/unpin a conversation with optimistic updates
  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string, pinned: boolean }) => {
      const { error } = await supabase
        .from('ai_coach_conversations')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;
      return { id, pinned };
    },
    onMutate: async ({ id, pinned }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations', user?.id] });

      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData<Conversation[]>(['conversations', user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old) => old ? old.map(conv => 
          conv.id === id ? { ...conv, pinned } : conv
        ) : []
      );

      return { previousConversations };
    },
    onSuccess: ({ pinned }) => {
      toast({
        title: pinned ? 'Conversation pinned' : 'Conversation unpinned',
        description: pinned 
          ? 'The conversation has been pinned to the top' 
          : 'The conversation has been unpinned',
      });
    },
    onError: (error, variables, context) => {
      console.error('Error updating conversation:', error);
      // Rollback to the previous state
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations', user?.id], context.previousConversations);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive',
      });
    }
  });

  const togglePinConversation = useCallback((id: string, pinned: boolean) => {
    pinMutation.mutate({ id, pinned });
  }, [pinMutation]);

  return {
    conversations,
    selectedConversationId,
    isNewChat,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    togglePinConversation
  };
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
