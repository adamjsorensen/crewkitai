
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { usePromptParameters } from "./usePromptParameters";
import { useToast } from "@/hooks/use-toast";

export function useSimplifiedPromptWizard(
  promptId: string | undefined, 
  isOpen: boolean, 
  onClose: () => void
) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for the form
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Use a ref to track loading state transitions for debugging
  const loadingTransitionsRef = useRef<string[]>([]);
  
  // Track number of parameter loads
  const parameterLoadCountRef = useRef(0);
  
  // Check network status
  useEffect(() => {
    const handleNetworkChange = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      console.log(`[useSimplifiedPromptWizard] Network status changed to: ${status}`);
      setNetworkStatus(status);
    };
    
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    // Initialize status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);
  
  // IMPROVED: Fetch prompt details with retry capability
  const { 
    prompt, 
    isLoading: isPromptLoading, 
    error: promptError, 
    refetch: refetchPrompt 
  } = usePromptFetching(promptId, isOpen);
  
  // Track when usePromptParameters is called
  useEffect(() => {
    if (promptId && isOpen) {
      console.log(`[usePromptParameters] Triggering parameter fetch for promptId: ${promptId}`);
      parameterLoadCountRef.current += 1;
      console.log(`[usePromptParameters] Parameter load attempt #${parameterLoadCountRef.current}`);
    }
  }, [promptId, isOpen]);
  
  // DIRECT PARAMETER FETCHING: Pass promptId directly to usePromptParameters
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parametersError,
    retry: retryParameters
  } = usePromptParameters(promptId);
  
  // Track specific parameter loading states with timestamps
  useEffect(() => {
    console.log(`[useSimplifiedPromptWizard] Parameter loading state changed: ${isParametersLoading} at ${new Date().toISOString()}`);
    console.log(`[useSimplifiedPromptWizard] Parameters array: ${parameters ? 'exists' : 'null'}, length: ${parameters?.length || 0}`);
    
    if (!isParametersLoading && parameters) {
      console.log(`[useSimplifiedPromptWizard] Parameters loaded successfully: ${parameters.length} items`);
      if (parameters.length > 0) {
        console.log(`[useSimplifiedPromptWizard] First parameter: ${parameters[0]?.name || 'unnamed'}, has tweaks: ${(parameters[0]?.tweaks?.length || 0) > 0}`);
      }
    }
  }, [isParametersLoading, parameters]);
  
  // Calculate the combined loading state - Simplified to avoid race conditions
  const isLoading = isPromptLoading || isParametersLoading;
  
  // Track loading state changes for debugging
  useEffect(() => {
    const loadingState = `prompt:${isPromptLoading},params:${isParametersLoading},timestamp:${Date.now()}`;
    loadingTransitionsRef.current.push(loadingState);
    
    console.log(`[useSimplifiedPromptWizard] Loading states - prompt: ${isPromptLoading}, parameters: ${isParametersLoading}, combined: ${isLoading}`);
    
    // Circuit breaker for loading state
    if (loadingTransitionsRef.current.length > 20) {
      console.warn("[useSimplifiedPromptWizard] Too many loading transitions, possible infinite loop");
      console.log("Loading transitions:", loadingTransitionsRef.current);
    }
  }, [isPromptLoading, isParametersLoading, isLoading]);
  
  // Reset form state when wizard opens with a new prompt
  useEffect(() => {
    if (isOpen) {
      console.log(`[useSimplifiedPromptWizard] Resetting form state for promptId: ${promptId}`);
      setSelectedTweaks({});
      setAdditionalContext("");
      loadingTransitionsRef.current = [];
      parameterLoadCountRef.current = 0;
    }
  }, [isOpen, promptId]);
  
  // VALIDATION: Debug logging for parameters with enhanced validation
  useEffect(() => {
    if (prompt && !isParametersLoading) {
      console.log(`[useSimplifiedPromptWizard] Parameters loaded for prompt: ${prompt.id}`);
      console.log(`[useSimplifiedPromptWizard] Parameters count: ${parameters?.length || 0}`);
      
      // Validate parameters data integrity
      if (parameters && parameters.length > 0) {
        const validParameters = parameters.every(p => p && p.id && p.name);
        if (!validParameters) {
          console.error("[useSimplifiedPromptWizard] Invalid parameters data detected:", 
            parameters.filter(p => !p || !p.id || !p.name));
        } else {
          console.log("[useSimplifiedPromptWizard] Valid parameters data confirmed");
          
          // Check tweaks for each parameter
          let tweakIssuesFound = false;
          parameters.forEach(param => {
            if (!param.tweaks || !Array.isArray(param.tweaks)) {
              console.error(`[useSimplifiedPromptWizard] Parameter ${param.name} has invalid tweaks property:`, param.tweaks);
              tweakIssuesFound = true;
            } else if (param.tweaks.length === 0) {
              console.warn(`[useSimplifiedPromptWizard] Parameter ${param.name} has no tweaks`);
            }
          });
          
          if (tweakIssuesFound) {
            console.warn("[useSimplifiedPromptWizard] Some parameters have tweak data issues");
          }
        }
      } else if (parameters?.length === 0 && !parametersError) {
        console.log("[useSimplifiedPromptWizard] No parameters found for prompt - this may be expected for some prompts");
      } else if (parametersError) {
        console.error("[useSimplifiedPromptWizard] Error loading parameters:", parametersError);
      }
    }
  }, [prompt, parameters, isParametersLoading, parametersError]);
  
  // Debug logging for prompts with data validation
  useEffect(() => {
    if (!isPromptLoading) {
      if (prompt) {
        console.log("[useSimplifiedPromptWizard] Prompt loaded successfully:", prompt.title);
        
        // Validate prompt data integrity
        if (!prompt.id || !prompt.title) {
          console.error("[useSimplifiedPromptWizard] Invalid prompt data:", prompt);
        }
      } else if (promptId) {
        console.warn("[useSimplifiedPromptWizard] Failed to load prompt for ID:", promptId);
      }
    }
  }, [prompt, promptId, isPromptLoading]);
  
  // Handle tweak selection
  const handleTweakChange = useCallback((parameterId: string, tweakId: string) => {
    console.log(`[useSimplifiedPromptWizard] Tweak selected: ${tweakId} for parameter: ${parameterId}`);
    setSelectedTweaks(prev => ({
      ...prev,
      [parameterId]: tweakId,
    }));
  }, []);
  
  // IMPROVED: Manual retry function for all data
  const handleRetry = useCallback(() => {
    console.log("[useSimplifiedPromptWizard] Manually retrying all data fetch");
    refetchPrompt();
    retryParameters();
    loadingTransitionsRef.current = [];
    parameterLoadCountRef.current = 0;
    
    toast({
      title: "Retrying",
      description: "Attempting to reload data...",
    });
  }, [refetchPrompt, retryParameters, toast]);
  
  // VALIDATION: Validate the form
  const isFormValid = useCallback(() => {
    // Add timestamps to trace performance
    console.log(`[useSimplifiedPromptWizard] Form validity check started at: ${new Date().toISOString()}`);
    
    // Validate that parameters are loaded correctly
    if (!parameters || !Array.isArray(parameters)) {
      console.error("[useSimplifiedPromptWizard] Parameters not available or not an array:", parameters);
      return false;
    }
    
    // Check if all required parameters have a selection
    const requiredParameters = parameters.filter(param => param && param.rule?.is_required) || [];
    const isValid = requiredParameters.every(param => selectedTweaks[param.id]);
    
    console.log("[useSimplifiedPromptWizard] Form validity check:", { 
      isValid, 
      requiredParameters: requiredParameters.length,
      selectedTweaks: Object.keys(selectedTweaks).length,
      parametersLoaded: parameters?.length
    });
    
    return isValid;
  }, [parameters, selectedTweaks]);
  
  // Generate content with improved error handling
  const handleSave = useCallback(async () => {
    if (!prompt || !user?.id) {
      console.error("[useSimplifiedPromptWizard] Missing prompt or user data:", { 
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
      console.warn("[useSimplifiedPromptWizard] Form validation failed");
      toast({
        title: "Required Selections Missing",
        description: "Please complete all required customization options",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // VALIDATION: Collect all selected tweaks with validation
      const tweakIds = Object.values(selectedTweaks).filter(Boolean);
      console.log("[useSimplifiedPromptWizard] Selected tweak IDs:", tweakIds);
      
      if (tweakIds.length === 0 && parameters.some(p => p.rule?.is_required)) {
        throw new Error("Required selections are missing");
      }
      
      // Find the actual tweaks from the parameters
      const selectedTweakDetails = parameters
        .flatMap(param => param.tweaks || [])
        .filter(tweak => tweakIds.includes(tweak.id));
      
      console.log("[useSimplifiedPromptWizard] Selected tweak details:", selectedTweakDetails);
      
      if (tweakIds.length > 0 && selectedTweakDetails.length === 0) {
        console.error("[useSimplifiedPromptWizard] No tweak details found for selected IDs");
        throw new Error("Selected options could not be found");
      }
      
      const tweakPrompts = selectedTweakDetails.map(tweak => tweak.sub_prompt).join("\n");
      
      console.log("[useSimplifiedPromptWizard] Generating content with:", {
        basePrompt: prompt.prompt,
        selectedTweaks: selectedTweakDetails.map(t => t.name),
        additionalContext
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
      console.log("[useSimplifiedPromptWizard] Generation result:", result);
      
      toast({
        title: "Content Generated",
        description: "Your customized content has been generated successfully",
      });
      
      // Close the wizard
      onClose();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[useSimplifiedPromptWizard] Error generating content:", error);
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
  
  // Log error state changes
  useEffect(() => {
    if (error) {
      console.error("[useSimplifiedPromptWizard] Error state:", { promptError, parametersError, combinedError: error });
    }
  }, [error, promptError, parametersError]);

  return {
    prompt,
    parameters,
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
