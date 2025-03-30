
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Prompt, CreatePromptInput, UpdatePromptInput } from './types';

export function usePromptMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create new prompt
  const createPrompt = useMutation({
    mutationFn: async (input: CreatePromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .insert(input)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating prompt:', error);
        throw new Error(`Failed to create prompt: ${error.message}`);
      }
      
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt created',
        description: 'The prompt was created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update prompt
  const updatePrompt = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdatePromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating prompt:', error);
        throw new Error(`Failed to update prompt: ${error.message}`);
      }
      
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt updated',
        description: 'The prompt was updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete prompt
  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting prompt:', error);
        throw new Error(`Failed to delete prompt: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt deleted',
        description: 'The prompt was deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createPrompt,
    updatePrompt,
    deletePrompt
  };
}
