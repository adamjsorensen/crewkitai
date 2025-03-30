
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

/**
 * A simplified hook for fetching prompt parameters and their tweaks in a single query
 */
export function usePromptParameters(promptId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchParameters = async () => {
      if (!promptId) {
        console.log("usePromptParameters: No promptId provided, skipping fetch");
        setParameters([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching parameters for prompt: ${promptId}`);
        
        // First, get the parameter rules for this prompt
        const { data: rules, error: rulesError } = await supabase
          .from('prompt_parameter_rules')
          .select('*')
          .eq('prompt_id', promptId)
          .eq('is_active', true)
          .order('order', { ascending: true });

        if (rulesError) {
          console.error("Error fetching parameter rules:", rulesError);
          setError(`Failed to load parameter rules: ${rulesError.message}`);
          setParameters([]);
          return;
        }

        console.log(`Found ${rules?.length || 0} parameter rules for prompt ${promptId}`);
        
        if (!rules || rules.length === 0) {
          console.log("No parameter rules found for prompt:", promptId);
          setParameters([]);
          setIsLoading(false);
          return;
        }

        // Get the parameter IDs from rules
        const parameterIds = rules.map(rule => rule.parameter_id);
        
        // Fetch the actual parameters
        const { data: parametersData, error: paramsError } = await supabase
          .from('prompt_parameters')
          .select('*')
          .in('id', parameterIds)
          .eq('active', true);
          
        if (paramsError) {
          console.error("Error fetching parameters:", paramsError);
          setError(`Failed to load parameters: ${paramsError.message}`);
          setParameters([]);
          return;
        }

        console.log(`Found ${parametersData?.length || 0} parameters`);
        
        if (!parametersData || parametersData.length === 0) {
          console.log("No active parameters found for the given parameter IDs");
          setParameters([]);
          setIsLoading(false);
          return;
        }

        // Fetch tweaks for these parameters
        const { data: tweaksData, error: tweaksError } = await supabase
          .from('parameter_tweaks')
          .select('*')
          .in('parameter_id', parameterIds)
          .eq('active', true)
          .order('order', { ascending: true });
          
        if (tweaksError) {
          console.error("Error fetching parameter tweaks:", tweaksError);
          setError(`Failed to load parameter tweaks: ${tweaksError.message}`);
          setParameters([]);
          return;
        }

        console.log(`Found ${tweaksData?.length || 0} tweaks for parameters`);

        // Combine parameters with their tweaks and rules
        const transformedParameters: ParameterWithTweaks[] = parametersData.map(parameter => {
          const parameterTweaks = tweaksData ? tweaksData.filter(tweak => tweak.parameter_id === parameter.id) : [];
          const rule = rules.find(rule => rule.parameter_id === parameter.id);
          
          // Convert the type string to a valid parameter type
          const paramType = parameter.type as 'tone_and_style' | 'audience' | 'length' | 'focus' | 'format' | 'custom';
          
          return {
            id: parameter.id,
            name: parameter.name,
            description: parameter.description,
            type: paramType,
            active: parameter.active,
            created_at: parameter.created_at,
            updated_at: parameter.updated_at,
            tweaks: parameterTweaks,
            rule: rule ? {
              id: rule.id,
              prompt_id: rule.prompt_id,
              parameter_id: rule.parameter_id,
              is_active: rule.is_active,
              is_required: rule.is_required,
              order: rule.order,
              created_at: rule.created_at,
              updated_at: rule.updated_at
            } : undefined
          };
        });

        // Sort by the order in rules
        transformedParameters.sort((a, b) => {
          const aRule = rules.find(rule => rule.parameter_id === a.id);
          const bRule = rules.find(rule => rule.parameter_id === b.id);
          
          return (aRule?.order || 0) - (bRule?.order || 0);
        });
        
        console.log(`Final transformed parameters (${transformedParameters.length}):`, transformedParameters);
        setParameters(transformedParameters);
      } catch (err: any) {
        console.error("Unexpected error in usePromptParameters:", err);
        setError(`An unexpected error occurred: ${err.message}`);
        setParameters([]);
        
        toast({
          title: "Error",
          description: "Failed to load prompt parameters. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParameters();
  }, [promptId, toast]);

  return { parameters, isLoading, error };
}
