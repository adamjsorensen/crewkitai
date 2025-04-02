
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

  // Delete prompt - Updated to handle related parameter rules
  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log(`Starting deletion process for prompt: ${id}`);
        
        // Step 1: Find all parameter rules associated with this prompt
        const { data: rules, error: rulesError } = await supabase
          .from('prompt_parameter_rules')
          .select('id')
          .eq('prompt_id', id);
        
        if (rulesError) {
          console.error('Error fetching prompt parameter rules:', rulesError);
          throw new Error(`Failed to fetch parameter rules: ${rulesError.message}`);
        }
        
        console.log(`Found ${rules?.length || 0} parameter rules to delete`);
        
        // Step 2: Delete the associated parameter rules if any exist
        if (rules && rules.length > 0) {
          const ruleIds = rules.map(rule => rule.id);
          
          const { error: deleteRulesError } = await supabase
            .from('prompt_parameter_rules')
            .delete()
            .in('id', ruleIds);
          
          if (deleteRulesError) {
            console.error('Error deleting parameter rules:', deleteRulesError);
            throw new Error(`Failed to delete parameter rules: ${deleteRulesError.message}`);
          }
          
          console.log(`Successfully deleted ${rules.length} parameter rules`);
        }
        
        // Step 3: Delete the prompt
        const { error: deletePromptError } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);
        
        if (deletePromptError) {
          console.error('Error deleting prompt:', deletePromptError);
          throw new Error(`Failed to delete prompt: ${deletePromptError.message}`);
        }
        
        console.log(`Successfully deleted prompt with ID: ${id}`);
        
        return id;
      } catch (error: any) {
        console.error('Error in deletePrompt mutation:', error);
        throw error;
      }
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
