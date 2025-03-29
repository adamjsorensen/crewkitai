
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParameterTweak {
  id: string;
  name: string;
  sub_prompt: string;
  parameter_id: string;
  active: boolean;
  order: number;
}

export interface ParameterRule {
  is_required: boolean;
  is_active: boolean;
  order: number;
}

export interface ParameterWithTweaks {
  id: string;
  name: string;
  description: string | null;
  type: string;
  tweaks: ParameterTweak[];
  rule?: ParameterRule; // Adding rule property that was missing
}

export const useCrewkitPromptParameters = () => {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);

  const { data: allParameters, isLoading } = useQuery({
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

  return {
    parameters: allParameters || [],
    isLoading,
    getParametersForPrompt
  };
};
