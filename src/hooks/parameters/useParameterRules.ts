
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptParameterRule, ParameterWithTweaks } from '@/types/promptParameters';

export function useParameterRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch parameters with their tweaks for a specific prompt
  const getParametersForPrompt = async (promptId: string) => {
    try {
      // First get all parameter rules for this prompt
      const { data: rules, error: rulesError } = await supabase
        .from('prompt_parameter_rules')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (rulesError) {
        console.error('Error fetching parameter rules:', rulesError);
        setError(rulesError.message);
        throw new Error(`Failed to fetch parameter rules: ${rulesError.message}`);
      }
      
      if (!rules || rules.length === 0) {
        console.log(`No parameter rules found for prompt ${promptId}`);
        return [];
      }
      
      // Get the parameter IDs from rules
      const parameterIds = rules.map(rule => rule.parameter_id);
      
      // Get the parameters
      const { data: parameters, error: parametersError } = await supabase
        .from('prompt_parameters')
        .select('*')
        .in('id', parameterIds)
        .eq('active', true);
      
      if (parametersError) {
        console.error('Error fetching parameters:', parametersError);
        setError(parametersError.message);
        throw new Error(`Failed to fetch parameters: ${parametersError.message}`);
      }
      
      if (!parameters || parameters.length === 0) {
        console.log(`No active parameters found for prompt ${promptId}`);
        return [];
      }
      
      // Get the tweaks for these parameters
      const { data: tweaks, error: tweaksError } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .in('parameter_id', parameterIds)
        .eq('active', true)
        .order('order', { ascending: true });
      
      if (tweaksError) {
        console.error('Error fetching parameter tweaks:', tweaksError);
        setError(tweaksError.message);
        throw new Error(`Failed to fetch parameter tweaks: ${tweaksError.message}`);
      }
      
      // Combine parameters with their tweaks and rules
      const parametersWithTweaks = parameters.map(parameter => {
        const parameterTweaks = tweaks ? tweaks.filter(tweak => tweak.parameter_id === parameter.id) : [];
        const rule = rules.find(rule => rule.parameter_id === parameter.id);
        
        return {
          ...parameter,
          tweaks: parameterTweaks,
          rule: rule
        };
      });
      
      // Sort by the order in rules
      parametersWithTweaks.sort((a, b) => {
        const aRule = rules.find(rule => rule.parameter_id === a.id);
        const bRule = rules.find(rule => rule.parameter_id === b.id);
        
        return (aRule?.order || 0) - (bRule?.order || 0);
      });
      
      return parametersWithTweaks;
    } catch (error: any) {
      console.error('Error in getParametersForPrompt:', error);
      if (!error.message.includes('Failed to fetch')) {
        // Only throw if it's not already a formatted error
        throw new Error(`Error loading parameters: ${error.message}`);
      }
      throw error;
    }
  };

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
    getParametersForPrompt,
    createParameterRule,
    updateParameterRule,
    deleteParameterRule,
    error
  };
}
