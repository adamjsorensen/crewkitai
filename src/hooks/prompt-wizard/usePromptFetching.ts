
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
      const timeoutId = setTimeout(() => {
        console.log("Fetch operation is taking longer than expected");
      }, 5000);
      
      const fetchedPrompt = await getPromptById(promptId);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Reset error toast flag on successful fetch
      errorToastShownRef.current = false;
      
      if (fetchedPrompt) {
        console.log("Successfully fetched prompt:", fetchedPrompt.title, fetchedPrompt);
        setPrompt(fetchedPrompt);
      } else {
        console.error("No prompt returned from getPromptById for ID:", promptId);
        setError("Prompt not found. It may have been deleted or you may not have access.");
        
        if (!errorToastShownRef.current) {
          errorToastShownRef.current = true;
          toast({
            title: "Prompt Not Found",
            description: "The requested prompt could not be found. Please try another one.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unknown error occurred";
      console.error(`Error fetching prompt: ${errorMessage}`, error);
      
      // Categorize error for better user messaging
      let userErrorMessage = "Failed to load prompt. ";
      if (errorMessage.includes("connection") || errorMessage.includes("network") || errorMessage.includes("ETIMEDOUT")) {
        userErrorMessage += "Please check your internet connection.";
      } else if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
        userErrorMessage += "The prompt could not be found.";
      } else {
        userErrorMessage += "An unexpected error occurred.";
      }
      
      setError(userErrorMessage);
      setPrompt(null);
      
      // Only show toast if not already shown for this error session
      if (!errorToastShownRef.current) {
        errorToastShownRef.current = true;
        toast({
          title: "Error Loading Prompt",
          description: userErrorMessage,
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
