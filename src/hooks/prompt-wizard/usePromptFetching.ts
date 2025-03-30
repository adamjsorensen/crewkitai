
import { useState, useEffect } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";

export function usePromptFetching(promptId: string | undefined, isOpen: boolean) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPromptById } = useCrewkitPrompts();
  
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        if (promptId && isOpen) {
          setIsLoading(true);
          setError(null);
          const fetchedPrompt = await getPromptById(promptId);
          setPrompt(fetchedPrompt);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
        setError("Failed to load prompt details.");
        setPrompt(null);
        setIsLoading(false);
      }
    };
    
    fetchPrompt();
  }, [promptId, isOpen, getPromptById]);
  
  return { prompt, isLoading, error };
}
