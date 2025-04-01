
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
  
  // State for the form with stable references
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Maintain cache of parameters to prevent unnecessary re-renders
  const parametersCache = useRef<any[]>([]);
  
  // Set up data consistency checking
  const promptIdRef = useRef<string | undefined>(promptId);
  const stableIsOpenRef = useRef(isOpen);
  
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
  
  // Update refs when props change 
  useEffect(() => {
    promptIdRef.current = promptId;
    stableIsOpenRef.current = isOpen;
  }, [promptId, isOpen]);
  
  // IMPROVED: Fetch prompt details with retry capability
  const { 
    prompt, 
    isLoading: isPromptLoading, 
    error: promptError, 
    refetch: refetchPrompt 
  } = usePromptFetching(promptId, isOpen);
  
  // DIRECT PARAMETER FETCHING: Use stable references to prevent re-fetching
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parametersError,
    retry: retryParameters
  } = usePromptParameters(promptId);
  
  // Update parameters cache when new parameters are loaded - ONLY if they've changed
  useEffect(() => {
    if (parameters && 
        parameters.length > 0 && 
        JSON.stringify(parameters) !== JSON.stringify(parametersCache.current)) {
      console.log(`[useSimplifiedPromptWizard] Updating parameters cache with ${parameters.length} items`);
      parametersCache.current = [...parameters];
    }
  }, [parameters]);
  
  // Calculate the combined loading state - Simplified to avoid race conditions
  const isLoading = isPromptLoading || isParametersLoading;
  
  // Reset form state when wizard opens with a new prompt - using stable references
  useEffect(() => {
    if (isOpen) {
      console.log(`[useSimplifiedPromptWizard] Resetting form state for promptId: ${promptId}`);
      setSelectedTweaks({});
      setAdditionalContext("");
    }
  }, [isOpen, promptId]);
  
  // Handle tweak selection with stable callback
  const handleTweakChange = useCallback((parameterId: string, tweakId: string) => {
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
    
    toast({
      title: "Retrying",
      description: "Attempting to reload data...",
    });
  }, [refetchPrompt, retryParameters, toast]);
  
  // VALIDATION: Validate the form with stable data references
  const isFormValid = useCallback(() => {
    // Use cached parameters to validate
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
      
      // Use cached parameters for consistency
      const paramsToUse = parameters && parameters.length > 0 ? parameters : parametersCache.current;
      
      // Collect all selected tweaks with validation
      const tweakIds = Object.values(selectedTweaks).filter(Boolean);
      console.log("[useSimplifiedPromptWizard] Selected tweak IDs:", tweakIds);
      
      if (tweakIds.length === 0 && paramsToUse.some(p => p.rule?.is_required)) {
        throw new Error("Required selections are missing");
      }
      
      // Find the actual tweaks from the parameters
      const selectedTweakDetails = paramsToUse
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
