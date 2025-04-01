
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

    console.log(`[usePromptParameters] Fetching parameters for prompt ID: ${promptId} (Attempt: ${retryCount + 1})`);
    
    try {
      // First, verify database connection
      console.log("Connection test started...");
      const { data: testData, error: testError } = await supabase.from('prompts').select('count').limit(1);
      
      if (testError) {
        console.error("Database connection test failed:", testError);
        throw new Error(`Database connection test failed: ${testError.message}`);
      }
      console.log("Connection test successful, database is accessible");
      
      // SINGLE OPERATION: Fetch everything in a single operation with joins
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
        .order('order');
      
      if (queryError) {
        console.error("[usePromptParameters] Error in joined parameter query:", queryError);
        throw new Error(`Database query failed: ${queryError.message}`);
      }
      
      if (!parametersWithRules || parametersWithRules.length === 0) {
        console.log(`[usePromptParameters] No parameter rules found for prompt: ${promptId}`);
        setParameters([]);
        setIsLoading(false);
        setError(null);
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
      
      // Debug the actual data structure
      console.log("[usePromptParameters] Parameter data structure:", 
        transformedParameters.map(p => ({
          id: p.id,
          name: p.name,
          tweaksCount: p.tweaks?.length || 0,
          ruleId: p.rule?.id
        }))
      );
      
      // Directly verify parameters and tweaks structure
      transformedParameters.forEach(param => {
        if (!param.id) console.error(`[usePromptParameters] Parameter missing ID`);
        if (!param.name) console.error(`[usePromptParameters] Parameter missing name`);
        if (!param.tweaks) console.error(`[usePromptParameters] Parameter ${param.name} missing tweaks array`);
      });
      
      setParameters(transformedParameters);
      setError(null);
      setIsLoading(false);
    } catch (err: unknown) {
      // Fixed TypeScript error with proper error handling
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[usePromptParameters] Error in usePromptParameters:", err);
      setError(`Failed to load parameters: ${errorMessage}`);
      setParameters([]);
      setIsLoading(false);
      
      // Only show toast for network or critical errors
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        toast({
          title: "Connection Error",
          description: "There was a problem with your network connection. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [promptId, toast, retryCount]);

  // Fetch parameters when promptId changes or when retry is triggered
  useEffect(() => {
    let isMounted = true;
    
    const fetchAndSetParams = async () => {
      if (!promptId) return;
      
      try {
        setIsLoading(true);
        await fetchParameters();
      } catch (err) {
        console.error("[usePromptParameters] Error in fetch effect:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchAndSetParams();
    
    return () => {
      isMounted = false;
    };
  }, [fetchParameters, promptId, retryCount]);

  // Provide a retry mechanism
  const retry = useCallback(() => {
    console.log("[usePromptParameters] Manually retrying parameter fetch");
    setRetryCount(prev => prev + 1);
  }, []);

  return { parameters, isLoading, error, retry };
}
