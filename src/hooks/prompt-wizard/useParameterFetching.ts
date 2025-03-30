
import { useState, useEffect } from "react";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";

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
          const params = await getParametersForPrompt(promptId);
          setParameters(params);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching parameters for prompt:", error);
        setError("Failed to load parameters. The prompt may not have any parameter rules configured.");
        setParameters([]);
        setIsLoading(false);
      }
    };
    
    fetchParameters();
  }, [promptId, isOpen, getParametersForPrompt]);

  return { parameters, isLoading, error };
}
