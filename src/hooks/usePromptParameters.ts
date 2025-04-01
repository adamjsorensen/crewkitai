
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

/**
 * Direct hook for fetching prompt parameters with their tweaks in a single operation
 */
export function usePromptParameters(promptId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const fetchParameters = useCallback(async () => {
    if (!promptId) {
      console.log("[usePromptParameters] No promptId provided, skipping parameter fetch");
      setParameters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[usePromptParameters] Fetching parameters for prompt ID: ${promptId} (Attempt: ${retryCount + 1})`);
      
      // SINGLE OPERATION: Fetch everything in a single operation with joins
      // Step 1: Query the rules, parameters and tweaks in one go
      const { data: parametersWithRules, error: queryError } = await supabase
        .from('prompt_parameter_rules')
        .select(`
          id,
          is_required,
          is_active,
          order,
          prompt_id,
          parameter_id,
          parameter:prompt_parameters(
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
        .order('order')
        .throwOnError();
      
      if (queryError) {
        console.error("[usePromptParameters] Error in joined parameter query:", queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }
      
      if (!parametersWithRules || parametersWithRules.length === 0) {
        console.log(`[usePromptParameters] No parameter rules found for prompt: ${promptId}`);
        setParameters([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`[usePromptParameters] Found ${parametersWithRules.length} parameter rules with joined data`);
      
      // Transform the nested data into our expected format
      const transformedParameters = parametersWithRules
        .filter(rule => rule.parameter?.active && rule.parameter?.id)
        .map(rule => {
          const parameter = rule.parameter;
          
          if (!parameter) {
            console.warn(`[usePromptParameters] Rule ${rule.id} has no valid parameter data`);
            return null;
          }
          
          // Filter out inactive tweaks
          const activeTweaks = (parameter.tweaks || []).filter(tweak => tweak.active);
          
          return {
            ...parameter,
            tweaks: activeTweaks || [],
            rule: {
              id: rule.id,
              prompt_id: rule.prompt_id,
              parameter_id: rule.parameter_id,
              is_active: rule.is_active,
              is_required: rule.is_required,
              order: rule.order,
              created_at: parameter.created_at,
              updated_at: parameter.updated_at
            }
          } as ParameterWithTweaks;
        })
        .filter(Boolean) as ParameterWithTweaks[];
      
      console.log(`[usePromptParameters] Transformed data into ${transformedParameters.length} parameters with tweaks`);
      
      // Debug the actual data we're setting for parameters
      console.log("[usePromptParameters] Parameter data structure:", 
        transformedParameters.map(p => ({
          id: p.id,
          name: p.name,
          tweaksCount: p.tweaks?.length || 0,
          ruleId: p.rule?.id
        }))
      );
      
      setParameters(transformedParameters);
      setIsLoading(false);
    } catch (err: any) {
      console.error("[usePromptParameters] Error in usePromptParameters:", err);
      setError(`Failed to load parameters: ${err.message}`);
      setParameters([]);
      setIsLoading(false);
      
      toast({
        title: "Error Loading Parameters",
        description: "There was a problem loading the customization options. We'll try again.",
        variant: "destructive"
      });
    }
  }, [promptId, toast, retryCount]);

  // Fetch parameters when promptId changes or when retry is triggered
  useEffect(() => {
    if (promptId) {
      console.log(`[usePromptParameters] Triggering parameter fetch for promptId: ${promptId}`);
      fetchParameters();
    } else {
      console.log("[usePromptParameters] No promptId available, resetting parameters state");
      setParameters([]);
      setIsLoading(false);
      setError(null);
    }
  }, [fetchParameters, promptId, retryCount]);

  // Provide a retry mechanism
  const retry = useCallback(() => {
    console.log("[usePromptParameters] Manually retrying parameter fetch");
    setRetryCount(prev => prev + 1);
  }, []);

  return { parameters, isLoading, error, retry };
}
