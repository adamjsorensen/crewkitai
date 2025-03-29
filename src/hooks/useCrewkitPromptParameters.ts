
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PromptParameter = {
  id: string;
  name: string;
  description: string | null;
  type: 'tone_and_style' | 'audience' | 'length' | 'focus' | 'format' | 'custom';
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ParameterTweak = {
  id: string;
  parameter_id: string | null;
  name: string;
  sub_prompt: string;
  active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type PromptParameterRule = {
  id: string;
  prompt_id: string;
  parameter_id: string;
  is_active: boolean;
  is_required: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type ParameterWithTweaks = PromptParameter & {
  tweaks: ParameterTweak[];
};

export function useCrewkitPromptParameters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch all parameters
  const { data: parameters, isLoading: isLoadingParameters, isError: isErrorParameters } = useQuery({
    queryKey: ['prompt-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_parameters')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching parameters:', error);
        setError(error.message);
        throw new Error(`Failed to fetch parameters: ${error.message}`);
      }
      
      return data as PromptParameter[];
    },
  });

  // Fetch all parameter tweaks
  const { data: tweaks, isLoading: isLoadingTweaks, isError: isErrorTweaks } = useQuery({
    queryKey: ['parameter-tweaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('Error fetching parameter tweaks:', error);
        setError(error.message);
        throw new Error(`Failed to fetch parameter tweaks: ${error.message}`);
      }
      
      return data as ParameterTweak[];
    },
  });

  // Create parameter
  const createParameter = useMutation({
    mutationFn: async (parameter: Omit<PromptParameter, 'id' | 'created_at' | 'updated_at'>) => {
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<PromptParameter, 'id' | 'created_at' | 'updated_at'>>) => {
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
      const { error } = await supabase
        .from('prompt_parameters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting parameter:', error);
        throw new Error(`Failed to delete parameter: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: 'Parameter deleted',
        description: 'The parameter was deleted successfully',
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

  // Create parameter tweak
  const createParameterTweak = useMutation({
    mutationFn: async (tweak: Omit<ParameterTweak, 'id' | 'created_at' | 'updated_at'>) => {
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
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<ParameterTweak, 'id' | 'created_at' | 'updated_at'>>) => {
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

  // Fetch parameters with their tweaks for a specific prompt
  const getParametersForPrompt = async (promptId: string) => {
    // First get all parameter rules for this prompt
    const { data: rules, error: rulesError } = await supabase
      .from('prompt_parameter_rules')
      .select('*')
      .eq('prompt_id', promptId)
      .order('order', { ascending: true });
    
    if (rulesError) {
      console.error('Error fetching parameter rules:', rulesError);
      setError(rulesError.message);
      throw new Error(`Failed to fetch parameter rules: ${rulesError.message}`);
    }
    
    if (!rules || rules.length === 0) {
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
      const parameterTweaks = tweaks.filter(tweak => tweak.parameter_id === parameter.id);
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
  };

  // Manage parameter rules for a prompt
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

  return {
    parameters: parameters || [],
    tweaks: tweaks || [],
    isLoading: isLoadingParameters || isLoadingTweaks,
    isError: isErrorParameters || isErrorTweaks,
    error,
    createParameter,
    updateParameter,
    deleteParameter,
    createParameterTweak,
    updateParameterTweak,
    deleteParameterTweak,
    getParametersForPrompt,
    createParameterRule
  };
}
