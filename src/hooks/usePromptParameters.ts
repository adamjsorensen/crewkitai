
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
        setParameters([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching parameters for prompt: ${promptId}`);
        
        // Single query to fetch everything we need
        const { data, error: fetchError } = await supabase
          .from('prompt_parameter_rules')
          .select(`
            id,
            prompt_id,
            parameter_id,
            is_required,
            is_active,
            order,
            parameter:parameters!parameter_id(
              id,
              name,
              description,
              type,
              active,
              tweaks:parameter_tweaks!parameter_id(
                id,
                name,
                sub_prompt,
                active,
                order
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
          
          toast({
            title: "Error loading parameters",
            description: "Unable to load customization options. Please try again.",
            variant: "destructive"
          });
        } else if (!data || data.length === 0) {
          console.log("No parameters found for prompt:", promptId);
          setParameters([]);
        } else {
          // Transform the data to match our ParameterWithTweaks type
          const transformedParameters: ParameterWithTweaks[] = [];
          
          for (const rule of data) {
            // Ensure parameter exists and is not an error object
            if (!rule.parameter || typeof rule.parameter !== 'object' || 'code' in rule.parameter) {
              console.warn("Skipping rule with invalid parameter data:", rule.id);
              continue;
            }
            
            const parameter = rule.parameter;
            
            // Make sure tweaks is an array before filtering
            let parameterTweaks: any[] = [];
            if (Array.isArray(parameter.tweaks)) {
              parameterTweaks = parameter.tweaks
                .filter(tweak => tweak && typeof tweak === 'object' && tweak.active)
                .sort((a, b) => a.order - b.order);
            }
            
            transformedParameters.push({
              id: parameter.id,
              name: parameter.name,
              description: parameter.description,
              type: parameter.type,
              active: parameter.active,
              created_at: '', // These fields are required by the type but not needed for UI
              updated_at: '',
              tweaks: parameterTweaks,
              rule: {
                id: rule.id,
                prompt_id: rule.prompt_id,
                parameter_id: rule.parameter_id,
                is_active: rule.is_active,
                is_required: rule.is_required,
                order: rule.order,
                created_at: '',
                updated_at: ''
              }
            });
          }

          console.log(`Loaded ${transformedParameters.length} parameters with their tweaks`);
          setParameters(transformedParameters);
        }
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
