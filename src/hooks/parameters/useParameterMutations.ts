
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  PromptParameter, 
  CreateParameterInput, 
  UpdateParameterInput,
  MutationContext
} from './types';

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
    
    // Delete related tweaks
    const { error: tweaksError } = await supabase
      .from('parameter_tweaks')
      .delete()
      .eq('parameter_id', parameterId);
      
    if (tweaksError) throw new Error(`Failed to delete related tweaks: ${tweaksError.message}`);
    
    // Delete related rules
    const { error: rulesError } = await supabase
      .from('prompt_parameter_rules')
      .delete()
      .eq('parameter_id', parameterId);
      
    if (rulesError) throw new Error(`Failed to delete related rules: ${rulesError.message}`);
    
    // Finally delete the parameter itself
    const { error: paramError } = await supabase
      .from('prompt_parameters')
      .delete()
      .eq('id', parameterId);
      
    if (paramError) throw new Error(`Failed to delete parameter: ${paramError.message}`);
    
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
  const createParameter = useMutation<
    PromptParameter, 
    Error, 
    CreateParameterInput, 
    MutationContext
  >({
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
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter created',
          description: 'The parameter was created successfully',
        });
      }
    },
    onError: (error, _, context) => {
      // Restore previous data if available
      if (context?.previousParameters) {
        queryClient.setQueryData(['prompt-parameters'], context.previousParameters);
      }
      
      if (!context?.silent) {
        toast({
          title: 'Error creating parameter',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Update parameter with optimistic updates
  const updateParameter = useMutation<
    PromptParameter, 
    Error, 
    UpdateParameterInput, 
    MutationContext
  >({
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
    onSuccess: (_, variables, context) => {
      // More granular cache invalidation
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter', variables.id] });
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter updated',
          description: 'The parameter was updated successfully',
        });
      }
    },
    onError: (error, _, context) => {
      // Restore previous data if available
      if (context?.previousParameters) {
        queryClient.setQueryData(['prompt-parameters'], context.previousParameters);
      }
      
      if (!context?.silent) {
        toast({
          title: 'Error updating parameter',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Delete parameter with optimized cascade deletion
  const deleteParameter = useMutation<
    { id: string; affectedPromptIds: string[] }, 
    Error, 
    string, 
    MutationContext
  >({
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
    onSuccess: ({ id, affectedPromptIds }, _, context) => {
      console.log(`Invalidating caches for parameter deletion...`);
      
      // Force all caches to refresh - cached version control
      if (typeof globalCacheVersion !== 'undefined') {
        globalCacheVersion++;
      }
      
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
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter deleted',
          description: 'The parameter and all related data were deleted successfully',
        });
      }
    },
    onError: (error, _, context) => {
      if (!context?.silent) {
        toast({
          title: 'Error deleting parameter',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  return {
    createParameter,
    updateParameter,
    deleteParameter
  };
}
