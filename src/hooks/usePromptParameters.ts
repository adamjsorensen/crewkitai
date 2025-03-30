
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

        console.log("Raw DB response:", JSON.stringify(data, null, 2));
        console.log("Fetch error:", fetchError);

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
          
          console.log(`Processing ${data.length} parameter rules`);
          
          for (const rule of data) {
            console.log(`Processing rule ${rule.id} for parameter_id ${rule.parameter_id}:`, rule);
            
            // First check if parameter exists and is valid
            if (!rule.parameter || typeof rule.parameter !== 'object' || 'code' in rule.parameter) {
              console.warn("Skipping rule with invalid parameter data:", rule.id);
              continue;
            }
            
            // Using non-null assertion after validation to inform TypeScript
            // We've already checked above that parameter exists and is valid
            const parameter = rule.parameter!;
            console.log(`Found parameter: ${parameter.name} (${parameter.id})`);
            
            // Make sure tweaks is an array before filtering
            let parameterTweaks: any[] = [];
            if (Array.isArray(parameter.tweaks)) {
              console.log(`Found ${parameter.tweaks.length} tweaks for parameter ${parameter.id}`);
              parameterTweaks = parameter.tweaks
                .filter(tweak => {
                  const isValid = tweak && typeof tweak === 'object' && tweak.active;
                  if (!isValid) {
                    console.log(`Skipping inactive or invalid tweak:`, tweak);
                  }
                  return isValid;
                })
                .sort((a, b) => a.order - b.order);
              
              console.log(`After filtering and sorting: ${parameterTweaks.length} active tweaks`);
            } else {
              console.warn(`Parameter ${parameter.id} has no tweaks array:`, parameter.tweaks);
            }
            
            // Convert the type string to a valid parameter type
            const paramType = parameter.type as 'tone_and_style' | 'audience' | 'length' | 'focus' | 'format' | 'custom';
            
            const transformedParam: ParameterWithTweaks = {
              id: parameter.id,
              name: parameter.name,
              description: parameter.description,
              type: paramType,
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
            };

            transformedParameters.push(transformedParam);
            console.log(`Added transformed parameter: ${transformedParam.name} with ${transformedParam.tweaks.length} tweaks`);
          }

          console.log(`Final transformed parameters (${transformedParameters.length}):`, transformedParameters);
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
