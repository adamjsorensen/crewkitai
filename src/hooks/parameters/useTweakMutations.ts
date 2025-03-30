
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ParameterTweak, CreateTweakInput, UpdateTweakInput } from './types';

export function useTweakMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create parameter tweak
  const createParameterTweak = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: 'Parameter tweak created',
        description: 'The parameter tweak was created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating parameter tweak',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update parameter tweak
  const updateParameterTweak = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: 'Parameter tweak updated',
        description: 'The parameter tweak was updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating parameter tweak',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete parameter tweak
  const deleteParameterTweak = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parameter_tweaks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting parameter tweak:', error);
        throw new Error(`Failed to delete parameter tweak: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: 'Parameter tweak deleted',
        description: 'The parameter tweak was deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting parameter tweak',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createParameterTweak,
    updateParameterTweak,
    deleteParameterTweak
  };
}
