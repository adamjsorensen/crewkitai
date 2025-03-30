
import { useState, useEffect } from "react";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useParameterFetching(promptId: string | undefined, isOpen: boolean) {
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
            .select('id, title')
            .eq('id', promptId)
            .single();
            
          if (promptError) {
            console.error("Error verifying prompt:", promptError);
            setError("Failed to verify the prompt exists.");
            setParameters([]);
            setIsLoading(false);
            return;
          }
          
          if (!promptData) {
            console.error("Prompt not found:", promptId);
            setError("Prompt not found.");
            setParameters([]);
            setIsLoading(false);
            return;
          }
          
          console.log("Found prompt:", promptData.title);
          
          try {
            console.log("Fetching parameters for prompt:", promptId);
            const params = await getParametersForPrompt(promptId);
            console.log("Parameters retrieved:", params);
            setParameters(params);
          } catch (paramError: any) {
            console.error("Error fetching parameters for prompt:", paramError);
            // Still set empty parameters instead of failing completely
            setParameters([]);
            
            // Only set error if it's not just an empty parameter case
            if (paramError.message && !paramError.message.includes("No parameter rules found")) {
              setError("Failed to load parameters. The prompt may not have any parameter rules configured.");
              toast({
                title: "Warning",
                description: "Could not load customization options for this prompt."
              });
            } else {
              console.log("No parameters found for prompt - this is normal for some prompts");
            }
          }
          
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Error in useParameterFetching:", error);
        setError("Failed to load prompt configuration.");
        setParameters([]);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Problem loading prompt customization options. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchParameters();
  }, [promptId, isOpen, getParametersForPrompt, toast]);

  return { parameters, isLoading, error };
}
