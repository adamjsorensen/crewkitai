
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptParameterRule } from '@/types/promptParameters';

export function useParameterRuleMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create parameter rule
  const createParameterRule = useMutation({
    mutationFn: async (rule: Omit<PromptParameterRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('prompt_parameter_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating parameter rule:', error);
        throw new Error(`Failed to create parameter rule: ${error.message}`);
      }
      
      return data as PromptParameterRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameter-rules'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating parameter rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update parameter rule
  const updateParameterRule = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<PromptParameterRule, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('prompt_parameter_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating parameter rule:', error);
        throw new Error(`Failed to update parameter rule: ${error.message}`);
      }
      
      return data as PromptParameterRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameter-rules'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating parameter rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete parameter rule
  const deleteParameterRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompt_parameter_rules')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting parameter rule:', error);
        throw new Error(`Failed to delete parameter rule: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameter-rules'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting parameter rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createParameterRule,
    updateParameterRule,
    deleteParameterRule
  };
}
