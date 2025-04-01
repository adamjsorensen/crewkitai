
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

/**
 * Improved hook for fetching prompt parameters and their tweaks
 * With better error handling and offline support
 */
export function usePromptParameters(promptId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const fetchParameters = useCallback(async () => {
    if (!promptId) {
      console.log("No promptId provided, skipping parameter fetch");
      setParameters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching parameters for prompt ID: ${promptId} (Attempt: ${retryCount + 1})`);
      
      // Step 1: Get parameter rules for this prompt
      const { data: ruleData, error: ruleError } = await supabase
        .from('prompt_parameter_rules')
        .select('id, parameter_id, is_required, is_active, order')
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .order('order');
      
      if (ruleError) {
        console.error("Error fetching parameter rules:", ruleError);
        throw new Error(`Error fetching parameter rules: ${ruleError.message}`);
      }
      
      if (!ruleData || ruleData.length === 0) {
        console.log(`No parameter rules found for prompt: ${promptId}`);
        setParameters([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${ruleData.length} parameter rules`);
      
      // Extract parameter IDs from rules
      const parameterIds = ruleData.map(rule => rule.parameter_id);
      
      // Step 2: Get parameters by their IDs
      const { data: paramData, error: paramError } = await supabase
        .from('prompt_parameters')
        .select('*')
        .in('id', parameterIds)
        .eq('active', true);
        
      if (paramError) {
        console.error("Error fetching parameters:", paramError);
        throw new Error(`Error fetching parameters: ${paramError.message}`);
      }
      
      if (!paramData || paramData.length === 0) {
        console.log("No active parameters found for the rules");
        setParameters([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${paramData.length} parameters`);
      
      // Step 3: Get tweaks for all these parameters
      const { data: tweakData, error: tweakError } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .in('parameter_id', parameterIds)
        .eq('active', true)
        .order('order');
        
      if (tweakError) {
        console.error("Error fetching parameter tweaks:", tweakError);
        throw new Error(`Error fetching parameter tweaks: ${tweakError.message}`);
      }
      
      console.log(`Found ${tweakData?.length || 0} tweaks for parameters`);
      
      // Group tweaks by parameter ID
      const tweaksByParameter: Record<string, any[]> = {};
      tweakData?.forEach(tweak => {
        const paramId = tweak.parameter_id;
        if (paramId) {
          if (!tweaksByParameter[paramId]) {
            tweaksByParameter[paramId] = [];
          }
          tweaksByParameter[paramId].push(tweak);
        }
      });
      
      // Step 4: Combine the data into the expected format
      const parametersWithTweaks: ParameterWithTweaks[] = paramData.map(param => {
        // Find the rule for this parameter
        const rule = ruleData.find(r => r.parameter_id === param.id);
        // Get tweaks for this parameter
        const tweaks = tweaksByParameter[param.id] || [];
        
        return {
          ...param,
          tweaks,
          rule: rule ? {
            id: rule.id,
            prompt_id: promptId,
            parameter_id: param.id,
            is_active: rule.is_active,
            is_required: rule.is_required,
            order: rule.order,
            created_at: param.created_at,
            updated_at: param.updated_at
          } : undefined
        };
      });
      
      console.log("Final processed parameters:", parametersWithTweaks);
      
      // Sort parameters by rule order
      parametersWithTweaks.sort((a, b) => {
        return (a.rule?.order || 0) - (b.rule?.order || 0);
      });
      
      setParameters(parametersWithTweaks);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error in usePromptParameters:", err);
      setError(`Failed to load parameters: ${err.message}`);
      setParameters([]);
      setIsLoading(false);
      
      if (retryCount < 2) { // Only show toast for first few retries
        toast({
          title: "Error Loading Parameters",
          description: "We're having trouble loading customization options. We'll try again.",
          variant: "destructive"
        });
      }
    }
  }, [promptId, toast, retryCount]);

  // Fetch parameters when promptId changes or when retry is triggered
  useEffect(() => {
    fetchParameters();
  }, [fetchParameters, promptId, retryCount]);

  // Provide a retry mechanism
  const retry = useCallback(() => {
    console.log("Manually retrying parameter fetch");
    setRetryCount(prev => prev + 1);
  }, []);

  return { parameters, isLoading, error, retry };
}
