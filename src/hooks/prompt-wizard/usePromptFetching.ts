
import { useState, useEffect, useCallback, useRef } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useToast } from "@/hooks/use-toast";

// Logging levels control
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set this to control logging verbosity
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN;

// Custom logger to control logging
const logger = {
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[usePromptFetching] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[usePromptFetching] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[usePromptFetching] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[usePromptFetching] ${message}`, ...args);
  }
};

// Cache for storing fetched prompts with a more robust structure
const promptCache = new Map<string, {
  data: Prompt,
  timestamp: number,
  version: number // Used to force refreshes when needed
}>();

// Cache expiration time
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
let globalCacheVersion = 1; // Used to force refresh all caches when needed

export function usePromptFetching(promptId: string | undefined, isOpen: boolean, retryCount: number = 0) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheVersion, setCacheVersion] = useState(globalCacheVersion);
  
  const { getPromptById } = useCrewkitPrompts();
  const { toast } = useToast();
  
  // Refs for tracking state and preventing memory leaks
  const errorToastShownRef = useRef<boolean>(false);
  const attemptCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const fetchingRef = useRef<boolean>(false);
  
  // Force a cache refresh when needed - useful for debugging
  const forceRefresh = useCallback(() => {
    if (promptId) {
      logger.debug(`Forcing cache refresh for promptId ${promptId}`);
      promptCache.delete(promptId);
      globalCacheVersion++;
      setCacheVersion(globalCacheVersion);
    }
  }, [promptId]);
  
  // Use cached data if available and not expired
  const useCachedData = useCallback((promptId: string | undefined) => {
    if (!promptId) return null;
    
    const cachedEntry = promptCache.get(promptId);
    if (cachedEntry) {
      const now = Date.now();
      if (now - cachedEntry.timestamp < CACHE_EXPIRY_TIME && cachedEntry.version === cacheVersion) {
        logger.debug(`Using cached prompt for ID: ${promptId} (v${cachedEntry.version})`);
        return cachedEntry.data;
      } else {
        // Cache expired or version mismatch, remove it
        logger.debug(`Cache expired or version changed for prompt ID: ${promptId}`);
        promptCache.delete(promptId);
      }
    }
    return null;
  }, [cacheVersion]);
  
  const fetchPrompt = useCallback(async () => {
    if (!promptId || !isOpen) return;
    
    // Check if we're already fetching
    if (fetchingRef.current) {
      logger.debug("Already fetching prompt, skipping redundant fetch");
      return;
    }
    
    // Check for cached data
    const cachedData = useCachedData(promptId);
    if (cachedData) {
      if (isMountedRef.current) {
        setPrompt(cachedData);
        setIsLoading(false);
        setError(null);
      }
      
      // Still fetch in the background to update cache but with lower priority
      setTimeout(() => {
        fetchPrompt().catch(err => {
          logger.warn("Background refresh failed:", err);
        });
      }, 2000);
      
      return;
    }
    
    // Set fetching flag to prevent duplicate requests
    fetchingRef.current = true;
    attemptCountRef.current += 1;
    
    logger.info(`Fetching prompt with ID: ${promptId} (attempt: ${attemptCountRef.current}, version: ${cacheVersion})`);
    
    try {
      const fetchedPrompt = await getPromptById(promptId);
      
      // Update cache with version control
      if (fetchedPrompt) {
        promptCache.set(promptId, {
          data: fetchedPrompt,
          timestamp: Date.now(),
          version: cacheVersion
        });
      }
      
      // Reset error toast flag on successful fetch
      errorToastShownRef.current = false;
      
      if (!isMountedRef.current) {
        logger.debug("Component unmounted during fetch, not updating state");
        fetchingRef.current = false;
        return;
      }
      
      if (fetchedPrompt) {
        logger.info("Successfully fetched prompt:", fetchedPrompt.title);
        setPrompt(fetchedPrompt);
        setError(null);
      } else {
        logger.error("No prompt returned from getPromptById for ID:", promptId);
        setError("Prompt not found. It may have been deleted or you may not have access.");
        setPrompt(null);
        
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
      logger.error(`Error fetching prompt: ${errorMessage}`, error);
      
      if (!isMountedRef.current) {
        logger.debug("Component unmounted during error handling, not updating state");
        fetchingRef.current = false;
        return;
      }
      
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
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [promptId, isOpen, getPromptById, toast, useCachedData, cacheVersion]);
  
  // Track component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Effect to fetch data when promptId/isOpen changes or retry is triggered
  useEffect(() => {
    if (!promptId || !isOpen) {
      return;
    }
    
    // Check for cached data first
    const cachedData = useCachedData(promptId);
    if (cachedData) {
      setPrompt(cachedData);
      setIsLoading(false);
      setError(null);
      
      // Still fetch in background to refresh cache with delay
      setTimeout(() => {
        fetchPrompt().catch(err => {
          logger.warn("Background refresh failed:", err);
        });
      }, 1000);
      
      return;
    }
    
    // If no cached data, show loading state and fetch
    setIsLoading(true);
    fetchPrompt();
    
  }, [promptId, isOpen, fetchPrompt, retryCount, useCachedData]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset error toast flag on unmount
      errorToastShownRef.current = false;
      attemptCountRef.current = 0;
    };
  }, []);
  
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
    forceRefresh,
    resetErrorFlag
  };
}
