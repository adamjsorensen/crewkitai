
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { useToast } from "@/hooks/use-toast";

/**
 * Simplified hook for fetching prompt parameters and their tweaks
 * Uses direct queries rather than complex joins for better reliability
 */
export function usePromptParameters(promptId: string | undefined) {
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchParameters = async () => {
      if (!promptId) {
        console.log("No promptId provided, skipping parameter fetch");
        setParameters([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching parameters for prompt ID: ${promptId}`);
        
        // Check if we can connect to Supabase first
        try {
          const { error: connectionTest } = await supabase.from('prompts').select('id').limit(1);
          if (connectionTest) {
            console.error("Connection test failed:", connectionTest);
            throw new Error(`Database connection error: ${connectionTest.message}`);
          }
        } catch (connectionErr: any) {
          console.error("Supabase connection check failed:", connectionErr);
          throw new Error(`Database connection issue: ${connectionErr.message || connectionErr}`);
        }
        
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
      } catch (err: any) {
        console.error("Error in usePromptParameters:", err);
        setError(`Failed to load parameters: ${err.message}`);
        setParameters([]);
        
        toast({
          title: "Error Loading Parameters",
          description: "We couldn't load the customization options. Please try again.",
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
