
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PgConversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
};

// Function to fetch PG Coach conversations with pagination
const fetchPgConversations = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('pg_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Transform data to conversation format
  return data.map(conv => ({
    id: conv.id,
    title: conv.title || 'Untitled conversation',
    lastMessage: 'View conversation history...',
    timestamp: new Date(conv.created_at),
    pinned: conv.pinned || false
  }));
};

export const usePgConversations = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['pg-conversations', user?.id],
    queryFn: () => fetchPgConversations(user?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    setIsNewChat(true);
  }, []);

  // Select a conversation
  const selectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setIsNewChat(false);
  }, []);

  // Delete a conversation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pg_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['pg-conversations', user?.id] });
      const previousConversations = queryClient.getQueryData<PgConversation[]>(['pg-conversations', user?.id]);
      
      queryClient.setQueryData<PgConversation[]>(
        ['pg-conversations', user?.id],
        (old) => old ? old.filter(conv => conv.id !== deletedId) : []
      );

      return { previousConversations };
    },
    onSuccess: (deletedId) => {
      // If the deleted conversation was selected, clear selection
      if (selectedConversationId === deletedId) {
        setSelectedConversationId(null);
        setIsNewChat(true);
      }

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been permanently removed',
      });
    },
    onError: (error, _, context) => {
      console.error('Error deleting conversation:', error);
      if (context?.previousConversations) {
        queryClient.setQueryData(['pg-conversations', user?.id], context.previousConversations);
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

  // Pin/unpin a conversation
  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string, pinned: boolean }) => {
      const { error } = await supabase
        .from('pg_conversations')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;
      return { id, pinned };
    },
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['pg-conversations', user?.id] });
      const previousConversations = queryClient.getQueryData<PgConversation[]>(['pg-conversations', user?.id]);
      
      queryClient.setQueryData<PgConversation[]>(
        ['pg-conversations', user?.id],
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
    onError: (error, _, context) => {
      console.error('Error updating conversation:', error);
      if (context?.previousConversations) {
        queryClient.setQueryData(['pg-conversations', user?.id], context.previousConversations);
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

  // Effect to initialize selected conversation from URL or local storage
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId && !isNewChat) {
      // If there are conversations but none selected, select the most recent one
      setSelectedConversationId(conversations[0].id);
      setIsNewChat(false);
    }
  }, [conversations, selectedConversationId, isNewChat]);

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
