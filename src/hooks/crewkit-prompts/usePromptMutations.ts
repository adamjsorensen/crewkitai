
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

  // Delete prompt - Updated to handle all related dependencies
  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log(`Starting comprehensive deletion process for prompt: ${id}`);
        
        // Step 1: Find all custom prompts that use this as a base prompt
        const { data: customPrompts, error: customPromptsError } = await supabase
          .from('custom_prompts')
          .select('id')
          .eq('base_prompt_id', id);
        
        if (customPromptsError) {
          console.error('Error fetching custom prompts:', customPromptsError);
          throw new Error(`Failed to fetch custom prompts: ${customPromptsError.message}`);
        }
        
        console.log(`Found ${customPrompts?.length || 0} custom prompts to delete`);
        
        // Step 2: For each custom prompt, delete related records
        if (customPrompts && customPrompts.length > 0) {
          const customPromptIds = customPrompts.map(cp => cp.id);
          
          // Step 2a: Delete prompt customizations
          const { error: deleteCustomizationsError } = await supabase
            .from('prompt_customizations')
            .delete()
            .in('custom_prompt_id', customPromptIds);
          
          if (deleteCustomizationsError) {
            console.error('Error deleting prompt customizations:', deleteCustomizationsError);
            throw new Error(`Failed to delete prompt customizations: ${deleteCustomizationsError.message}`);
          }
          
          // Step 2b: Delete additional context entries
          const { error: deleteContextError } = await supabase
            .from('prompt_additional_context')
            .delete()
            .in('custom_prompt_id', customPromptIds);
          
          if (deleteContextError) {
            console.error('Error deleting additional context:', deleteContextError);
            throw new Error(`Failed to delete additional context: ${deleteContextError.message}`);
          }
          
          // Step 2c: Delete generations
          const { error: deleteGenerationsError } = await supabase
            .from('prompt_generations')
            .delete()
            .in('custom_prompt_id', customPromptIds);
          
          if (deleteGenerationsError) {
            console.error('Error deleting prompt generations:', deleteGenerationsError);
            throw new Error(`Failed to delete prompt generations: ${deleteGenerationsError.message}`);
          }
          
          // Step 2d: Delete the custom prompts themselves
          const { error: deleteCustomPromptsError } = await supabase
            .from('custom_prompts')
            .delete()
            .in('id', customPromptIds);
          
          if (deleteCustomPromptsError) {
            console.error('Error deleting custom prompts:', deleteCustomPromptsError);
            throw new Error(`Failed to delete custom prompts: ${deleteCustomPromptsError.message}`);
          }
          
          console.log(`Successfully deleted ${customPrompts.length} custom prompts and related data`);
        }
        
        // Step 3: Delete parameter rules for this prompt
        const { data: rules, error: rulesError } = await supabase
          .from('prompt_parameter_rules')
          .select('id')
          .eq('prompt_id', id);
        
        if (rulesError) {
          console.error('Error fetching prompt parameter rules:', rulesError);
          throw new Error(`Failed to fetch parameter rules: ${rulesError.message}`);
        }
        
        console.log(`Found ${rules?.length || 0} parameter rules to delete`);
        
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
        
        // Step 4: Find any child prompts (for categories)
        const { data: childPrompts, error: childPromptsError } = await supabase
          .from('prompts')
          .select('id')
          .eq('parent_id', id);
          
        if (childPromptsError) {
          console.error('Error fetching child prompts:', childPromptsError);
          throw new Error(`Failed to fetch child prompts: ${childPromptsError.message}`);
        }
        
        console.log(`Found ${childPrompts?.length || 0} child prompts to update`);
        
        // Step 5: Update child prompts to remove parent reference
        if (childPrompts && childPrompts.length > 0) {
          const childPromptIds = childPrompts.map(cp => cp.id);
          
          const { error: updateChildPromptsError } = await supabase
            .from('prompts')
            .update({ parent_id: null })
            .in('id', childPromptIds);
          
          if (updateChildPromptsError) {
            console.error('Error updating child prompts:', updateChildPromptsError);
            throw new Error(`Failed to update child prompts: ${updateChildPromptsError.message}`);
          }
          
          console.log(`Successfully updated ${childPrompts.length} child prompts`);
        }
        
        // Step 6: Finally delete the prompt
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
