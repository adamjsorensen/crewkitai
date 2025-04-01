
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

/**
 * A simplified hook for fetching prompt parameters and their tweaks
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
        
        // Simplified approach: single query with joins to get parameters with their tweaks
        const { data, error: fetchError } = await supabase
          .from('prompt_parameter_rules')
          .select(`
            id,
            is_active,
            is_required, 
            order,
            parameter:parameter_id(
              id, 
              name, 
              description, 
              type, 
              active,
              created_at,
              updated_at,
              tweaks:parameter_tweaks(
                id, 
                parameter_id, 
                name, 
                sub_prompt, 
                active, 
                order, 
                created_at, 
                updated_at
              )
            )
          `)
          .eq('prompt_id', promptId)
          .eq('is_active', true)
          .order('order', { ascending: true });

        if (fetchError) {
          console.error("Error fetching parameters:", fetchError);
          setError(`Failed to load parameters: ${fetchError.message}`);
          setParameters([]);
          setIsLoading(false);
          return;
        }

        console.log(`Raw data from query:`, data);
        
        if (!data || data.length === 0) {
          console.log("No parameter rules found for prompt:", promptId);
          setParameters([]);
          setIsLoading(false);
          return;
        }

        // Transform the nested data into the expected format
        const transformedParameters: ParameterWithTweaks[] = data
          .filter(rule => rule.parameter && rule.parameter.active)
          .map(rule => {
            const param = rule.parameter;
            
            if (!param) {
              console.warn(`Parameter is null for rule ${rule.id}`);
              return null;
            }
            
            // Convert the type string to a valid parameter type with runtime check
            const validTypes = ['tone_and_style', 'audience', 'length', 'focus', 'format', 'custom'];
            const paramType = validTypes.includes(param.type) 
              ? param.type as 'tone_and_style' | 'audience' | 'length' | 'focus' | 'format' | 'custom'
              : 'custom';
            
            // Filter active tweaks
            const activeTweaks = Array.isArray(param.tweaks) 
              ? param.tweaks.filter(tweak => tweak.active)
              : [];
              
            console.log(`Parameter ${param.name} has ${activeTweaks.length} active tweaks`);
            
            return {
              id: param.id,
              name: param.name,
              description: param.description,
              type: paramType,
              active: param.active,
              created_at: param.created_at,
              updated_at: param.updated_at,
              tweaks: activeTweaks,
              rule: {
                id: rule.id,
                prompt_id: promptId,
                parameter_id: param.id,
                is_active: rule.is_active,
                is_required: rule.is_required,
                order: rule.order,
                created_at: param.created_at, // Fallback to parameter dates
                updated_at: param.updated_at
              }
            };
          })
          .filter(Boolean) as ParameterWithTweaks[]; // Filter out null items
        
        console.log(`Transformed parameters:`, transformedParameters);
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
