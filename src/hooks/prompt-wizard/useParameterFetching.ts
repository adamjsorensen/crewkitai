
import { useState, useEffect } from "react";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { supabase } from "@/integrations/supabase/client";

export function useParameterFetching(promptId: string | undefined, isOpen: boolean) {
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch parameters for this prompt
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        if (promptId && isOpen) {
          setIsLoading(true);
          setError(null);
          
          // Verify the prompt exists before fetching parameters
          const { data: promptData, error: promptError } = await supabase
            .from('prompts')
            .select('id')
            .eq('id', promptId)
            .single();
            
          if (promptError || !promptData) {
            console.error("Error verifying prompt:", promptError);
            setError("Failed to verify the prompt exists.");
            setParameters([]);
            setIsLoading(false);
            return;
          }
          
          try {
            const params = await getParametersForPrompt(promptId);
            setParameters(params);
          } catch (paramError: any) {
            console.error("Error fetching parameters for prompt:", paramError);
            // Still set empty parameters instead of failing completely
            setParameters([]);
            setError("Failed to load parameters. The prompt may not have any parameter rules configured.");
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in useParameterFetching:", error);
        setError("Failed to load prompt configuration.");
        setParameters([]);
        setIsLoading(false);
      }
    };
    
    fetchParameters();
  }, [promptId, isOpen, getParametersForPrompt]);

  return { parameters, isLoading, error };
}
