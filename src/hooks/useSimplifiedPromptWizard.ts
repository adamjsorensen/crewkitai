
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { usePromptParameters } from "./usePromptParameters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Logging levels control
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set this to control logging verbosity
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.DEBUG;

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
  onClose: () => void,
  forceRefreshTrigger: number = 0
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
    refetch: refetchPrompt,
    forceRefresh: forceRefreshPrompt
  } = usePromptFetching(promptId, isOpen);
  
  // IMPROVED: Parameter fetching with optimized caching
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parametersError,
    retry: retryParameters,
    forceRefresh: forceRefreshParameters,
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
  
  // React to the force refresh trigger
  useEffect(() => {
    if (forceRefreshTrigger > 0 && promptId) {
      logger.info(`Force refresh triggered (${forceRefreshTrigger})`);
      if (typeof forceRefreshPrompt === 'function') {
        forceRefreshPrompt();
      }
      if (typeof forceRefreshParameters === 'function') {
        forceRefreshParameters();
      }
    }
  }, [forceRefreshTrigger, promptId, forceRefreshPrompt, forceRefreshParameters]);
  
  // Function to force refresh all data
  const forceRefreshData = useCallback(() => {
    logger.info("Force refreshing all data");
    if (typeof forceRefreshPrompt === 'function') {
      forceRefreshPrompt();
    }
    if (typeof forceRefreshParameters === 'function') {
      forceRefreshParameters();
    }
    toast({
      title: "Refreshing Data",
      description: "Forced refresh of all prompt data"
    });
  }, [forceRefreshPrompt, forceRefreshParameters, toast]);
  
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
      logger.info("Starting content generation process...");
      
      // 1. Create a custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: prompt.id,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (customPromptError) {
        logger.error("Error creating custom prompt:", customPromptError);
        throw new Error(`Failed to create custom prompt: ${customPromptError.message}`);
      }
      
      logger.debug("Created custom prompt:", customPrompt.id);
      
      // 2. Save selected tweaks
      const tweakIds = Object.values(selectedTweaks).filter(Boolean);
      logger.debug("Selected tweak IDs:", tweakIds);
      
      if (tweakIds.length > 0) {
        const customizations = tweakIds.map(tweakId => ({
          custom_prompt_id: customPrompt.id,
          parameter_tweak_id: tweakId,
        }));
        
        logger.debug("Saving customizations:", customizations.length);
        const { error: customizationsError } = await supabase
          .from('prompt_customizations')
          .insert(customizations);
        
        if (customizationsError) {
          logger.error("Error saving customizations:", customizationsError);
          throw new Error(`Failed to save customizations: ${customizationsError.message}`);
        }
      }
      
      // 3. Save additional context if provided
      if (additionalContext.trim()) {
        logger.debug("Saving additional context");
        const { error: contextError } = await supabase
          .from('prompt_additional_context')
          .insert({
            custom_prompt_id: customPrompt.id,
            context_text: additionalContext,
          });
        
        if (contextError) {
          logger.error("Error saving additional context:", contextError);
          throw new Error(`Failed to save additional context: ${contextError.message}`);
        }
      }
      
      // 4. Call the edge function to generate content
      logger.debug("Calling Supabase edge function to generate content");
      const { data: generationResult, error: generationError } = await supabase.functions.invoke(
        'crewkit-generate-content',
        {
          body: { customPromptId: customPrompt.id },
        }
      );
      
      if (generationError) {
        logger.error("Edge function error:", generationError);
        throw new Error(`Content generation failed: ${generationError.message}`);
      }
      
      if (!generationResult) {
        throw new Error("No content was generated");
      }
      
      logger.debug("Content generated successfully:", generationResult);
      
      // If successful, navigate to the generated content page
      toast({
        title: "Content Generated",
        description: "Your content was successfully generated",
      });
      
      onClose();
      navigate(`/dashboard/generated/${generationResult.generationId}`);
      
    } catch (error: any) {
      logger.error("Error in content generation process:", error);
      
      // More descriptive error message based on the error
      let errorMessage = "An unexpected error occurred";
      
      if (error.message.includes("OPENAI_API_KEY")) {
        errorMessage = "OpenAI API key is missing or invalid. Please contact the administrator.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.message.includes("customPromptId")) {
        errorMessage = "Invalid prompt configuration. Please try a different prompt.";
      } else {
        errorMessage = error.message || "Content generation failed";
      }
      
      toast({
        title: "Error generating content",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  }, [prompt, user, selectedTweaks, additionalContext, isFormValid, toast, onClose, navigate]);
  
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
    handleRetry,
    forceRefreshData
  };
}
