
import { useState, useEffect } from 'react';
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

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        // Fetch root conversations (is_root = true)
        const { data, error } = await supabase
          .from('ai_coach_conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_root', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to our conversation format
        const formattedConversations: Conversation[] = data.map(conv => ({
          id: conv.id,
          title: conv.title || 'Untitled conversation',
          lastMessage: conv.user_message.substring(0, 60) + (conv.user_message.length > 60 ? '...' : ''),
          timestamp: new Date(conv.created_at),
          pinned: conv.pinned || false
        }));

        setConversations(formattedConversations);
        
        // Select the first conversation if one exists and none is selected
        if (formattedConversations.length > 0 && !selectedConversationId) {
          setSelectedConversationId(formattedConversations[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, selectedConversationId, toast]);

  // Create a new conversation
  const createNewConversation = () => {
    setSelectedConversationId(null);
  };

  // Select a conversation
  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    try {
      // Delete the conversation
      const { error } = await supabase
        .from('ai_coach_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setConversations(prevConversations => 
        prevConversations.filter(conv => conv.id !== id)
      );

      // If the deleted conversation was selected, clear selection
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been permanently removed',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  };

  // Pin/unpin a conversation
  const togglePinConversation = async (id: string, pinned: boolean) => {
    try {
      // Update the conversation in the database
      const { error } = await supabase
        .from('ai_coach_conversations')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === id ? { ...conv, pinned } : conv
        )
      );

      toast({
        title: pinned ? 'Conversation pinned' : 'Conversation unpinned',
        description: pinned 
          ? 'The conversation has been pinned to the top' 
          : 'The conversation has been unpinned',
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive',
      });
    }
  };

  return {
    conversations,
    selectedConversationId,
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    togglePinConversation
  };
};
