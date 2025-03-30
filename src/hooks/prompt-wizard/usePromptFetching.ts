
import { useState, useEffect } from "react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";

export function usePromptFetching(promptId: string | undefined, isOpen: boolean) {
  const { getPromptById } = useCrewkitPrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch prompt when promptId changes
  useEffect(() => {
    const fetchPrompt = async () => {
      if (promptId && isOpen) {
        try {
          setIsLoading(true);
          const promptData = await getPromptById(promptId);
          setPrompt(promptData);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching prompt:", error);
          setIsLoading(false);
        }
      }
    };
    
    fetchPrompt();
  }, [promptId, isOpen, getPromptById]);

  return { prompt, isLoading };
}
