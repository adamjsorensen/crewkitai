
import { useState, useEffect, useCallback } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useToast } from "@/hooks/use-toast";

export function usePromptFetching(promptId: string | undefined, isOpen: boolean, retryCount: number = 0) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPromptById } = useCrewkitPrompts();
  const { toast } = useToast();
  
  const fetchPrompt = useCallback(async () => {
    try {
      if (promptId && isOpen) {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching prompt with ID: ${promptId} (retry count: ${retryCount})`);
        
        // Add a timeout to detect slow network issues
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out")), 10000)
        );
        
        // Race the actual fetch with the timeout
        const fetchedPrompt = await Promise.race([
          getPromptById(promptId),
          timeoutPromise
        ]) as Prompt | null;
        
        if (fetchedPrompt) {
          console.log("Successfully fetched prompt:", fetchedPrompt.title);
          setPrompt(fetchedPrompt);
        } else {
          console.error("No prompt returned from getPromptById");
          setError("Failed to load prompt details.");
          toast({
            title: "Error",
            description: "Could not load the prompt data. Please try again.",
            variant: "destructive"
          });
        }
        
        setIsLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unknown error occurred";
      console.error(`Error fetching prompt: ${errorMessage}`, error);
      setError(`Failed to load prompt details. ${errorMessage}`);
      setPrompt(null);
      setIsLoading(false);
      
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please check your network connection.",
        variant: "destructive"
      });
    }
  }, [promptId, isOpen, getPromptById, retryCount, toast]);
  
  useEffect(() => {
    if (promptId && isOpen) {
      fetchPrompt();
    }
    
    return () => {
      // Cleanup function
      setPrompt(null);
      setIsLoading(false);
      setError(null);
    };
  }, [promptId, isOpen, fetchPrompt]);
  
  return { prompt, isLoading, error, refetch: fetchPrompt };
}
