
import { useState, useEffect, useCallback, useRef } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useToast } from "@/hooks/use-toast";

export function usePromptFetching(promptId: string | undefined, isOpen: boolean, retryCount: number = 0) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPromptById } = useCrewkitPrompts();
  const { toast } = useToast();
  
  // Use a ref to track if error toast was already shown
  const errorToastShownRef = useRef<boolean>(false);
  const attemptCountRef = useRef<number>(0);
  
  const fetchPrompt = useCallback(async () => {
    if (!promptId || !isOpen) return;
    
    try {
      setIsLoading(true);
      setError(null);
      attemptCountRef.current += 1;
      console.log(`Fetching prompt with ID: ${promptId} (attempt: ${attemptCountRef.current})`);
      
      // Add a timeout to detect slow network issues
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 10000)
      );
      
      // Race the actual fetch with the timeout
      const fetchedPrompt = await Promise.race([
        getPromptById(promptId),
        timeoutPromise
      ]) as Prompt | null;
      
      // Reset error toast flag on successful fetch
      errorToastShownRef.current = false;
      
      if (fetchedPrompt) {
        console.log("Successfully fetched prompt:", fetchedPrompt.title, fetchedPrompt);
        setPrompt(fetchedPrompt);
      } else {
        console.error("No prompt returned from getPromptById for ID:", promptId);
        setError("Failed to load prompt details. Prompt may not exist.");
        
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          toast({
            title: "Error",
            description: "Could not load the prompt data. Please try again or select another prompt.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unknown error occurred";
      console.error(`Error fetching prompt: ${errorMessage}`, error);
      setError(`Failed to load prompt details. ${errorMessage}`);
      setPrompt(null);
      
      // Only show toast if not already shown for this error session
      if (!errorToastShownRef.current) {
        errorToastShownRef.current = true;
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please check your network connection.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [promptId, isOpen, getPromptById, toast]);
  
  useEffect(() => {
    let isMounted = true;
    
    if (promptId && isOpen) {
      fetchPrompt();
    }
    
    return () => {
      // Cleanup function
      isMounted = false;
      // Reset error toast flag on unmount
      errorToastShownRef.current = false;
      attemptCountRef.current = 0;
    };
  }, [promptId, isOpen, fetchPrompt, retryCount]);
  
  // Add a method to reset error toast flag
  const resetErrorFlag = useCallback(() => {
    errorToastShownRef.current = false;
    attemptCountRef.current = 0;
  }, []);
  
  return { 
    prompt, 
    isLoading, 
    error, 
    refetch: fetchPrompt,
    resetErrorFlag
  };
}
