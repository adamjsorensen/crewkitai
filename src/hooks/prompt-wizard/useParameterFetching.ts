
import { useState, useEffect } from "react";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";

export function useParameterFetching(promptId: string | undefined, isOpen: boolean) {
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch parameters for this prompt
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        if (promptId && isOpen) {
          setIsLoading(true);
          const params = await getParametersForPrompt(promptId);
          setParameters(params);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching parameters for prompt:", error);
        setIsLoading(false);
      }
    };
    
    fetchParameters();
  }, [promptId, isOpen, getParametersForPrompt]);

  return { parameters, isLoading };
}
