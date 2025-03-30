
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
    let isMounted = true;
    const fetchParameters = async () => {
      try {
        if (!promptId || !isOpen) {
          console.log("Not fetching parameters - prompt ID missing or wizard closed");
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        console.log(`Started fetching parameters for promptId: ${promptId}`);
        
        // Verify the prompt exists before fetching parameters
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('id, title')
          .eq('id', promptId)
          .maybeSingle();
          
        if (promptError) {
          console.error("Error verifying prompt:", promptError);
          if (isMounted) {
            setError("Failed to verify the prompt exists.");
            setParameters([]);
            setIsLoading(false);
          }
          return;
        }
        
        if (!promptData) {
          console.error("Prompt not found:", promptId);
          if (isMounted) {
            setError("Prompt not found.");
            setParameters([]);
            setIsLoading(false);
          }
          return;
        }
        
        console.log("Found prompt:", promptData.title);
        
        try {
          console.log("Fetching parameters for prompt:", promptId);
          const params = await getParametersForPrompt(promptId);
          console.log("Parameters retrieved:", params);
          
          if (isMounted) {
            if (Array.isArray(params)) {
              console.log(`Setting ${params.length} parameters for prompt`);
              setParameters(params);
            } else {
              console.error("Invalid parameters data returned:", params);
              setParameters([]);
              setError("Invalid parameters data format returned");
            }
          }
        } catch (paramError: any) {
          console.error("Error fetching parameters for prompt:", paramError);
          // Still set empty parameters instead of failing completely
          if (isMounted) {
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
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Error in useParameterFetching:", error);
        if (isMounted) {
          setError("Failed to load prompt configuration.");
          setParameters([]);
          setIsLoading(false);
          toast({
            title: "Error",
            description: "Problem loading prompt customization options. Please try again.",
            variant: "destructive"
          });
        }
      }
    };
    
    fetchParameters();
    
    return () => {
      isMounted = false;
    };
  }, [promptId, isOpen, getParametersForPrompt, toast]);

  // Debug the current state
  useEffect(() => {
    console.log("useParameterFetching state:", { 
      promptId, 
      parametersCount: parameters.length, 
      isLoading, 
      error 
    });
  }, [promptId, parameters, isLoading, error]);

  return { parameters, isLoading, error };
}
