
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptParameter, CreateParameterInput, UpdateParameterInput } from './types';

// Optimized batch operations for related entities
const deleteRelatedEntities = async (parameterId: string) => {
  console.log(`Starting batch deletion for parameter: ${parameterId}`);
  
  try {
    // Get all prompt IDs that have rules for this parameter (for cache invalidation)
    const { data: promptRules, error: promptRulesError } = await supabase
      .from('prompt_parameter_rules')
      .select('prompt_id')
      .eq('parameter_id', parameterId);
    
    if (promptRulesError) throw new Error(`Failed to get related prompt IDs: ${promptRulesError.message}`);
    
    const affectedPromptIds = promptRules ? promptRules.map(rule => rule.prompt_id) : [];
    console.log(`Found ${affectedPromptIds.length} affected prompts`);
    
    // Execute batch delete operation for all related entities in one transaction
    const { error: batchError } = await supabase.rpc('delete_parameter_cascade', { param_id: parameterId });
    
    if (batchError) throw new Error(`Batch deletion failed: ${batchError.message}`);
    
    console.log(`Successfully deleted parameter ID: ${parameterId} and all related entities`);
    return { id: parameterId, affectedPromptIds };
  } catch (error) {
    console.error('Error in deleteRelatedEntities:', error);
    throw error;
  }
};

export function useParameterMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create parameter with optimistic updates
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
    onMutate: async (newParameter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prompt-parameters'] });
      
      // Snapshot the previous value
      const previousParameters = queryClient.getQueryData(['prompt-parameters']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['prompt-parameters'], (old: PromptParameter[] | undefined) => {
        const optimisticParam = {
          ...newParameter,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return old ? [...old, optimisticParam] : [optimisticParam];
      });
      
      return { previousParameters };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: 'Parameter created',
        description: 'The parameter was created successfully',
      });
    },
    onError: (error, _, context) => {
      // Restore previous data if available
      if (context?.previousParameters) {
        queryClient.setQueryData(['prompt-parameters'], context.previousParameters);
      }
      
      toast({
        title: 'Error creating parameter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update parameter with optimistic updates
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
    onMutate: async (updatedParameter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prompt-parameters'] });
      
      // Snapshot the previous value
      const previousParameters = queryClient.getQueryData(['prompt-parameters']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['prompt-parameters'], (old: PromptParameter[] | undefined) => {
        if (!old) return [];
        return old.map(param => 
          param.id === updatedParameter.id 
            ? { ...param, ...updatedParameter, updated_at: new Date().toISOString() } 
            : param
        );
      });
      
      return { previousParameters };
    },
    onSuccess: (_, variables) => {
      // More granular cache invalidation
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter', variables.id] });
      
      toast({
        title: 'Parameter updated',
        description: 'The parameter was updated successfully',
      });
    },
    onError: (error, _, context) => {
      // Restore previous data if available
      if (context?.previousParameters) {
        queryClient.setQueryData(['prompt-parameters'], context.previousParameters);
      }
      
      toast({
        title: 'Error updating parameter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete parameter with optimized cascade deletion
  const deleteParameter = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Deleting parameter with ID: ${id}`);
      
      try {
        // Use optimized batch deletion function
        return await deleteRelatedEntities(id);
      } catch (error) {
        console.error('Error in deleteParameter transaction:', error);
        throw error;
      }
    },
    onSuccess: ({ id, affectedPromptIds }) => {
      console.log(`Invalidating caches for parameter deletion...`);
      
      // Force all caches to refresh - cached version control
      globalCacheVersion++;
      
      // Use more targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-parameter-rules'] });
      
      // Also invalidate any specific prompt parameters that might be cached
      if (affectedPromptIds && affectedPromptIds.length > 0) {
        console.log(`Invalidating caches for ${affectedPromptIds.length} affected prompts`);
        affectedPromptIds.forEach(promptId => {
          queryClient.invalidateQueries({ queryKey: ['prompt', promptId, 'parameters'] });
        });
      }
      
      toast({
        title: 'Parameter deleted',
        description: 'The parameter and all related data were deleted successfully',
      });
      
      // Force a page reload after a short delay
      // This ensures all components will re-fetch with the latest data
      setTimeout(() => {
        window.location.reload();
      }, 500);
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
