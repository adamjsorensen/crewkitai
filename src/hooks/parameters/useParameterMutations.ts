
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptParameter, CreateParameterInput, UpdateParameterInput } from './types';

export function useParameterMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create parameter
  const createParameter = useMutation({
    mutationFn: async (parameter: CreateParameterInput) => {
      const { data, error } = await supabase
        .from('prompt_parameters')
        .insert(parameter)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating parameter:', error);
        throw new Error(`Failed to create parameter: ${error.message}`);
      }
      
      return data as PromptParameter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: 'Parameter created',
        description: 'The parameter was created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating parameter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update parameter
  const updateParameter = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateParameterInput) => {
      const { data, error } = await supabase
        .from('prompt_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating parameter:', error);
        throw new Error(`Failed to update parameter: ${error.message}`);
      }
      
      return data as PromptParameter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: 'Parameter updated',
        description: 'The parameter was updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating parameter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete parameter
  const deleteParameter = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Deleting parameter with ID: ${id}`);
      
      // First, delete related parameter tweaks
      const { error: tweaksError } = await supabase
        .from('parameter_tweaks')
        .delete()
        .eq('parameter_id', id);
      
      if (tweaksError) {
        console.error('Error deleting parameter tweaks:', tweaksError);
        throw new Error(`Failed to delete parameter tweaks: ${tweaksError.message}`);
      }
      
      console.log(`Successfully deleted tweaks for parameter ID: ${id}`);
      
      // Next, delete related parameter rules
      const { error: rulesError } = await supabase
        .from('prompt_parameter_rules')
        .delete()
        .eq('parameter_id', id);
      
      if (rulesError) {
        console.error('Error deleting parameter rules:', rulesError);
        throw new Error(`Failed to delete parameter rules: ${rulesError.message}`);
      }
      
      console.log(`Successfully deleted rules for parameter ID: ${id}`);
      
      // Finally, delete the parameter itself
      const { error } = await supabase
        .from('prompt_parameters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting parameter:', error);
        throw new Error(`Failed to delete parameter: ${error.message}`);
      }
      
      console.log(`Successfully deleted parameter ID: ${id}`);
      
      return id;
    },
    onSuccess: (id) => {
      // Invalidate multiple queries to ensure all related data is refreshed
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-parameter-rules'] });
      
      toast({
        title: 'Parameter deleted',
        description: 'The parameter and all related data were deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting parameter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createParameter,
    updateParameter,
    deleteParameter
  };
}
