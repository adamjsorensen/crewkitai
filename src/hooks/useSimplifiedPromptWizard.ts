
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { usePromptParameters } from "./usePromptParameters";
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
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[useSimplifiedPromptWizard] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[useSimplifiedPromptWizard] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[useSimplifiedPromptWizard] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[useSimplifiedPromptWizard] ${message}`, ...args);
  }
};

export function useSimplifiedPromptWizard(
  promptId: string | undefined, 
  isOpen: boolean, 
  onClose: () => void
) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for the form with stable references
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Track if this is the first load
  const isFirstLoadRef = useRef(true);
  const lastPromptIdRef = useRef<string | undefined>(promptId);
  
  // Maintain cache of parameters to prevent unnecessary re-renders
  const parametersCache = useRef<any[]>([]);
  
  // Track rendering cycles
  const renderCountRef = useRef(0);
  
  // Log rendering but only on development and limited frequency
  useEffect(() => {
    renderCountRef.current += 1;
    
    if (process.env.NODE_ENV !== 'production' && renderCountRef.current % 5 === 0) {
      logger.debug(`Hook rendered ${renderCountRef.current} times`);
    }
  });
  
  // Check network status - optimized with cleanup
  useEffect(() => {
    const handleNetworkChange = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      if (status !== networkStatus) {
        logger.info(`Network status changed to: ${status}`);
        setNetworkStatus(status);
      }
    };
    
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    // Initialize status only once
    if (networkStatus !== (navigator.onLine ? 'online' : 'offline')) {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    }
    
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [networkStatus]);
  
  // Effect to reset state when prompt changes - only run when necessary
  useEffect(() => {
    if (promptId !== lastPromptIdRef.current) {
      logger.info(`Prompt ID changed from ${lastPromptIdRef.current} to ${promptId}`);
      lastPromptIdRef.current = promptId;
      isFirstLoadRef.current = true;
      
      // Reset state when prompt changes
      if (isOpen) {
        setSelectedTweaks({});
        setAdditionalContext("");
      }
    }
  }, [promptId, isOpen]);
  
  // IMPROVED: Fetch prompt details with optimized dependency array
  const { 
    prompt, 
    isLoading: isPromptLoading, 
    error: promptError, 
    refetch: refetchPrompt 
  } = usePromptFetching(promptId, isOpen);
  
  // IMPROVED: Parameter fetching with optimized caching
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parametersError,
    retry: retryParameters,
    lastSuccessfulFetch
  } = usePromptParameters(promptId);
  
  // Update parameters cache only when parameters change - with deep comparison
  useEffect(() => {
    if (parameters && 
        parameters.length > 0 && 
        JSON.stringify(parameters) !== JSON.stringify(parametersCache.current)) {
      logger.info(`Updating parameters cache with ${parameters.length} items`);
      parametersCache.current = [...parameters];
      
      // Log parameter structure only in development
      if (process.env.NODE_ENV !== 'production' && parameters.length > 0) {
        logger.debug('First parameter structure:', {
          id: parameters[0].id,
          name: parameters[0].name,
          hasTweaks: Array.isArray(parameters[0].tweaks) && parameters[0].tweaks.length > 0,
          tweaksCount: parameters[0].tweaks?.length || 0
        });
      }
    }
  }, [parameters]);
  
  // Optimize loading state to prevent flickering
  const isLoading = useMemo(() => {
    // If we've completed an initial successful load, prioritize cached data
    if (lastSuccessfulFetch && !isFirstLoadRef.current) {
      return false;
    }
    
    return isPromptLoading || isParametersLoading;
  }, [isPromptLoading, isParametersLoading, lastSuccessfulFetch]);
  
  // Update first load state once we have completed a load
  useEffect(() => {
    if (!isLoading && isFirstLoadRef.current) {
      logger.debug('First load complete, marking as not first load anymore');
      isFirstLoadRef.current = false;
    }
  }, [isLoading]);
  
  // Handle tweak selection with stable callback and reference equality
  const handleTweakChange = useCallback((parameterId: string, tweakId: string) => {
    logger.debug(`Selecting tweak ${tweakId} for parameter ${parameterId}`);
    setSelectedTweaks(prev => {
      // Only update if value actually changes
      if (prev[parameterId] === tweakId) {
        return prev;
      }
      return {
        ...prev,
        [parameterId]: tweakId,
      };
    });
  }, []);
  
  // Manual retry function with debouncing
  const handleRetryTimeoutRef = useRef<number | null>(null);
  const handleRetry = useCallback(() => {
    // Clear any pending retry
    if (handleRetryTimeoutRef.current) {
      window.clearTimeout(handleRetryTimeoutRef.current);
    }
    
    // Debounce retries to prevent multiple rapid retries
    handleRetryTimeoutRef.current = window.setTimeout(() => {
      logger.info("Manually retrying all data fetch");
      refetchPrompt();
      retryParameters();
      
      toast({
        title: "Retrying",
        description: "Attempting to reload data...",
      });
      handleRetryTimeoutRef.current = null;
    }, 300);
  }, [refetchPrompt, retryParameters, toast]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (handleRetryTimeoutRef.current) {
        window.clearTimeout(handleRetryTimeoutRef.current);
      }
    };
  }, []);
  
  // VALIDATION: Validate the form with stable data references
  const isFormValid = useCallback(() => {
    // Use cached parameters to validate if available
    const paramsToCheck = parameters && parameters.length > 0 ? parameters : parametersCache.current;
    
    // Validate that parameters are loaded correctly
    if (!paramsToCheck || !Array.isArray(paramsToCheck) || paramsToCheck.length === 0) {
      return true; // If no parameters, form is valid
    }
    
    // Check if all required parameters have a selection
    const requiredParameters = paramsToCheck.filter(param => param && param.rule?.is_required) || [];
    const isValid = requiredParameters.every(param => selectedTweaks[param.id]);
    
    return isValid;
  }, [parameters, selectedTweaks]);
  
  // Generate content with improved error handling and stability
  const handleSave = useCallback(async () => {
    if (!prompt || !user?.id) {
      logger.error("Missing prompt or user data:", { 
        promptExists: !!prompt, 
        userIdExists: !!user?.id 
      });
      toast({
        title: "Error",
        description: "Missing prompt data or user information",
        variant: "destructive"
      });
      return;
    }
    
    if (!isFormValid()) {
      logger.warn("Form validation failed");
      toast({
        title: "Required Selections Missing",
        description: "Please complete all required customization options",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // Use cached parameters for consistency
      const paramsToUse = parameters && parameters.length > 0 ? parameters : parametersCache.current;
      
      // Collect all selected tweaks with validation
      const tweakIds = Object.values(selectedTweaks).filter(Boolean);
      logger.debug("Selected tweak IDs:", tweakIds);
      
      if (tweakIds.length === 0 && paramsToUse.some(p => p.rule?.is_required)) {
        throw new Error("Required selections are missing");
      }
      
      // Find the actual tweaks from the parameters
      const selectedTweakDetails = paramsToUse
        .flatMap(param => param.tweaks || [])
        .filter(tweak => tweakIds.includes(tweak.id));
      
      logger.debug("Selected tweak details:", selectedTweakDetails);
      
      if (tweakIds.length > 0 && selectedTweakDetails.length === 0) {
        logger.error("No tweak details found for selected IDs");
        throw new Error("Selected options could not be found");
      }
      
      const tweakPrompts = selectedTweakDetails.map(tweak => tweak.sub_prompt).join("\n");
      
      logger.info("Generating content with:", {
        basePrompt: prompt.prompt,
        selectedTweaks: selectedTweakDetails.map(t => t.name),
        additionalContext: additionalContext ? "Provided" : "None"
      });
      
      // Call the Supabase Edge Function to generate content
      const response = await fetch('/api/crewkit-generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basePromptId: prompt.id,
          basePrompt: prompt.prompt,
          tweakPrompts,
          additionalContext,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      logger.info("Generation successful");
      
      toast({
        title: "Content Generated",
        description: "Your customized content has been generated successfully",
      });
      
      // Close the wizard
      onClose();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error generating content:", error);
      toast({
        title: "Error Generating Content",
        description: errorMessage || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  }, [prompt, user, parameters, selectedTweaks, additionalContext, isFormValid, toast, onClose]);
  
  // Calculate loading and error states with combined error messages
  const error = promptError || parametersError;

  return {
    prompt,
    // Return cached parameters if current parameters are empty
    parameters: parameters && parameters.length > 0 ? parameters : parametersCache.current,
    isLoading, 
    error,
    generating,
    selectedTweaks,
    additionalContext,
    networkStatus,
    handleTweakChange,
    setAdditionalContext,
    handleSave,
    isFormValid,
    refetchPrompt,
    handleRetry
  };
}
