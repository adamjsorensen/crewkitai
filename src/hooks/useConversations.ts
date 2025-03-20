
import { useState } from 'react';
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

// Function to fetch conversations - separated for reusability
const fetchConversations = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('ai_coach_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_root', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform data to conversation format
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

  // Fetch conversations with caching
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user?.id),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    enabled: !!user, // Only run the query if we have a user
  });

  // Create a new conversation
  const createNewConversation = () => {
    setSelectedConversationId(null);
    setIsNewChat(true);
  };

  // Select a conversation
  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
    setIsNewChat(false);
  };

  // Delete a conversation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_coach_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the cache by removing the deleted conversation
      queryClient.setQueryData(
        ['conversations', user?.id],
        (oldData: Conversation[] | undefined) => 
          oldData ? oldData.filter(conv => conv.id !== deletedId) : []
      );

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
    onError: (error) => {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  });

  const deleteConversation = (id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate(id);
    }
  };

  // Pin/unpin a conversation
  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string, pinned: boolean }) => {
      const { error } = await supabase
        .from('ai_coach_conversations')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;
      return { id, pinned };
    },
    onSuccess: ({ id, pinned }) => {
      // Update the cache by modifying the pinned status of the conversation
      queryClient.setQueryData(
        ['conversations', user?.id],
        (oldData: Conversation[] | undefined) => 
          oldData ? oldData.map(conv => 
            conv.id === id ? { ...conv, pinned } : conv
          ) : []
      );

      toast({
        title: pinned ? 'Conversation pinned' : 'Conversation unpinned',
        description: pinned 
          ? 'The conversation has been pinned to the top' 
          : 'The conversation has been unpinned',
      });
    },
    onError: (error) => {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive',
      });
    }
  });

  const togglePinConversation = (id: string, pinned: boolean) => {
    pinMutation.mutate({ id, pinned });
  };

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
      queryFn: () => fetchConversations(userId)
    });
  }
};
