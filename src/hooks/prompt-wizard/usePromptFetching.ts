
import { useState, useEffect } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";

export function usePromptFetching(promptId: string | undefined, isOpen: boolean, retryCount: number = 0) {
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
          console.log(`Fetching prompt with ID: ${promptId} (retry count: ${retryCount})`);
          const fetchedPrompt = await getPromptById(promptId);
          
          if (fetchedPrompt) {
            console.log("Successfully fetched prompt:", fetchedPrompt.title);
            setPrompt(fetchedPrompt);
          } else {
            console.error("No prompt returned from getPromptById");
            setError("Failed to load prompt details.");
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
        setError("Failed to load prompt details. Please try again later.");
        setPrompt(null);
        setIsLoading(false);
      }
    };
    
    fetchPrompt();
  }, [promptId, isOpen, getPromptById, retryCount]);
  
  return { prompt, isLoading, error };
}
