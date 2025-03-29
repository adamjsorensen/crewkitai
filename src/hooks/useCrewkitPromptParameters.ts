
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ParameterTweak {
  id: string;
  name: string;
  sub_prompt: string;
  parameter_id: string;
  active: boolean;
  order: number;
}

export interface PromptParameter {
  id: string;
  name: string;
  description: string | null;
  type: "tone_and_style" | "audience" | "length" | "focus" | "format" | "custom";
  active: boolean;
  tweaks?: ParameterTweak[];
}

export interface ParameterRule {
  is_required: boolean;
  is_active: boolean;
  order: number;
}

export interface ParameterWithTweaks extends PromptParameter {
  tweaks: ParameterTweak[];
  rule?: ParameterRule;
}

// Parameter mutation types
interface CreateParameterData {
  name: string;
  description: string | null;
  type: PromptParameter['type'];
  active: boolean;
}

interface UpdateParameterData extends CreateParameterData {
  id: string;
}

// Tweak mutation types
interface CreateTweakData {
  name: string;
  parameter_id: string;
  sub_prompt: string;
  order: number;
  active: boolean;
}

interface UpdateTweakData extends CreateTweakData {
  id: string;
}

export const useCrewkitPromptParameters = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all parameters
  const { data: parameters, isLoading } = useQuery({
    queryKey: ['prompt-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_parameters')
        .select('*, parameter_tweaks(*)')
        .eq('active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Failed to fetch parameters: ${error.message}`);
      }
      
      return data.map((param) => ({
        ...param,
        tweaks: param.parameter_tweaks || []
      })) as ParameterWithTweaks[];
    }
  });

  // Fetch all parameter tweaks
  const { data: tweaks } = useQuery({
    queryKey: ['parameter-tweaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .order('order');
      
      if (error) {
        throw new Error(`Failed to fetch parameter tweaks: ${error.message}`);
      }
      
      return data as ParameterTweak[];
    }
  });

  // Get parameters for a specific prompt
  const getParametersForPrompt = async (promptId: string): Promise<ParameterWithTweaks[]> => {
    try {
      const { data, error } = await supabase
        .from('prompt_parameter_rules')
        .select(`
          parameter_id,
          is_required,
          is_active,
          order,
          parameters:parameter_id(
            id,
            name,
            description,
            type,
            active,
            tweaks:parameter_tweaks(*)
          )
        `)
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .order('order');
      
      if (error) {
        throw new Error(`Failed to fetch parameters for prompt: ${error.message}`);
      }
      
      const parametersWithRules = data.map(rule => ({
        ...rule.parameters,
        rule: {
          is_required: rule.is_required,
          is_active: rule.is_active,
          order: rule.order
        }
      })) as ParameterWithTweaks[];
      
      return parametersWithRules;
    } catch (error) {
      console.error('Error in getParametersForPrompt:', error);
      return [];
    }
  };

  // Create parameter mutation
  const createParameter = useMutation({
    mutationFn: async (data: CreateParameterData) => {
      const { error, data: newParameter } = await supabase
        .from('prompt_parameters')
        .insert(data)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create parameter: ${error.message}`);
      return newParameter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: "Parameter created",
        description: "New parameter has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating parameter",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update parameter mutation
  const updateParameter = useMutation({
    mutationFn: async (data: UpdateParameterData) => {
      const { id, ...updateData } = data;
      const { error, data: updatedParameter } = await supabase
        .from('prompt_parameters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update parameter: ${error.message}`);
      return updatedParameter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: "Parameter updated",
        description: "Parameter has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating parameter",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete parameter mutation
  const deleteParameter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompt_parameters')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete parameter: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      toast({
        title: "Parameter deleted",
        description: "Parameter has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting parameter",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create parameter tweak mutation
  const createParameterTweak = useMutation({
    mutationFn: async (data: CreateTweakData) => {
      const { error, data: newTweak } = await supabase
        .from('parameter_tweaks')
        .insert(data)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create parameter tweak: ${error.message}`);
      return newTweak;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: "Tweak created",
        description: "New parameter tweak has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating tweak",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update parameter tweak mutation
  const updateParameterTweak = useMutation({
    mutationFn: async (data: UpdateTweakData) => {
      const { id, ...updateData } = data;
      const { error, data: updatedTweak } = await supabase
        .from('parameter_tweaks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update parameter tweak: ${error.message}`);
      return updatedTweak;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: "Tweak updated",
        description: "Parameter tweak has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating tweak",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete parameter tweak mutation
  const deleteParameterTweak = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parameter_tweaks')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete parameter tweak: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-tweaks'] });
      toast({
        title: "Tweak deleted",
        description: "Parameter tweak has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting tweak",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    parameters: parameters || [],
    tweaks: tweaks || [],
    isLoading,
    getParametersForPrompt,
    createParameter,
    updateParameter,
    deleteParameter,
    createParameterTweak,
    updateParameterTweak,
    deleteParameterTweak
  };
};
