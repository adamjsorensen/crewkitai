
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ParameterTweak, 
  CreateTweakInput, 
  UpdateTweakInput,
  MutationContext 
} from './types';

export function useTweakMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create parameter tweak
  const createParameterTweak = useMutation<
    ParameterTweak, 
    Error, 
    CreateTweakInput, 
    MutationContext
  >({
    mutationFn: async (tweak: CreateTweakInput) => {
      const { data, error } = await supabase
        .from('parameter_tweaks')
        .insert(tweak)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating parameter tweak:', error);
        throw new Error(`Failed to create parameter tweak: ${error.message}`);
      }
      
      return data as ParameterTweak;
    },
    onSuccess: (data, _, context) => {
      // Invalidate and update both the general tweaks query and the parameter-specific query
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      if (data.parameter_id) {
        queryClient.invalidateQueries({ queryKey: ['parameter', data.parameter_id, 'tweaks'] });
      }
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter tweak created',
          description: 'The parameter tweak was created successfully',
        });
      }
    },
    onError: (error, _, context) => {
      if (!context?.silent) {
        toast({
          title: 'Error creating parameter tweak',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Update parameter tweak
  const updateParameterTweak = useMutation<
    ParameterTweak, 
    Error, 
    UpdateTweakInput, 
    MutationContext
  >({
    mutationFn: async ({ id, ...updates }: UpdateTweakInput) => {
      const { data, error } = await supabase
        .from('parameter_tweaks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating parameter tweak:', error);
        throw new Error(`Failed to update parameter tweak: ${error.message}`);
      }
      
      return data as ParameterTweak;
    },
    onSuccess: (data, _, context) => {
      // Invalidate and update both the general tweaks query and the parameter-specific query
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      if (data.parameter_id) {
        queryClient.invalidateQueries({ queryKey: ['parameter', data.parameter_id, 'tweaks'] });
      }
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter tweak updated',
          description: 'The parameter tweak was updated successfully',
        });
      }
    },
    onError: (error, _, context) => {
      if (!context?.silent) {
        toast({
          title: 'Error updating parameter tweak',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Delete parameter tweak
  const deleteParameterTweak = useMutation<
    { id: string; parameterId: string | null }, 
    Error, 
    string, 
    MutationContext
  >({
    mutationFn: async (id: string) => {
      // First get the parameter_id for cache invalidation
      const { data: tweakData, error: getTweakError } = await supabase
        .from('parameter_tweaks')
        .select('parameter_id')
        .eq('id', id)
        .single();
      
      if (getTweakError) {
        console.error('Error getting parameter tweak:', getTweakError);
        throw new Error(`Failed to get parameter tweak: ${getTweakError.message}`);
      }
      
      const parameterId = tweakData?.parameter_id;
      
      // Now delete the tweak
      const { error: deleteError } = await supabase
        .from('parameter_tweaks')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting parameter tweak:', deleteError);
        throw new Error(`Failed to delete parameter tweak: ${deleteError.message}`);
      }
      
      return { id, parameterId };
    },
    onSuccess: ({ id, parameterId }, _, context) => {
      // Invalidate and update both the general tweaks query and the parameter-specific query
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      if (parameterId) {
        queryClient.invalidateQueries({ queryKey: ['parameter', parameterId, 'tweaks'] });
      }
      
      // Only show toast if silent mode is not enabled
      if (!context?.silent) {
        toast({
          title: 'Parameter tweak deleted',
          description: 'The parameter tweak was deleted successfully',
        });
      }
    },
    onError: (error, _, context) => {
      if (!context?.silent) {
        toast({
          title: 'Error deleting parameter tweak',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  return {
    createParameterTweak,
    updateParameterTweak,
    deleteParameterTweak
  };
}
