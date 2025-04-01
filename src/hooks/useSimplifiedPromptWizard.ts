
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { usePromptParameters } from "./usePromptParameters";
import { useToast } from "@/hooks/use-toast";
import { Prompt } from "./useCrewkitPrompts";

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
  const [debouncedLoading, setDebouncedLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Fetch prompt details
  const { 
    prompt, 
    isLoading: isPromptLoading, 
    error: promptError, 
    refetch: refetchPrompt 
  } = usePromptFetching(promptId, isOpen, retryCount);
  
  // Fetch parameters with the simplified hook
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parametersError 
  } = usePromptParameters(prompt?.id);
  
  // Combine loading states
  const isLoading = isPromptLoading || isParametersLoading;
  
  // Add debounce to loading state changes to prevent flickering
  useEffect(() => {
    if (isLoading) {
      // When loading starts, set debounced loading immediately
      setDebouncedLoading(true);
    } else {
      // When loading finishes, delay the state change to prevent flickering
      const timer = setTimeout(() => {
        setDebouncedLoading(false);
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Reset form state when wizard opens with a new prompt
  useEffect(() => {
    if (isOpen) {
      console.log("useSimplifiedPromptWizard - resetting form state");
      setSelectedTweaks({});
      setAdditionalContext("");
      setDebouncedLoading(true); // Ensure loading state is true when opening
    }
  }, [isOpen, promptId]);
  
  // Debug logging for parameters
  useEffect(() => {
    if (prompt && !isParametersLoading) {
      console.log("Parameters loaded for prompt:", prompt.id);
      console.log("Parameters count:", parameters?.length || 0);
      if (parameters?.length === 0) {
        console.log("Warning: No parameters found for prompt that should have parameters");
      }
    }
  }, [prompt, parameters, isParametersLoading]);
  
  // Debug logging for prompts
  useEffect(() => {
    if (!isPromptLoading) {
      if (prompt) {
        console.log("Prompt loaded successfully:", prompt.title);
      } else if (promptId) {
        console.log("Failed to load prompt for ID:", promptId);
      }
    }
  }, [prompt, promptId, isPromptLoading]);
  
  // Handle tweak selection
  const handleTweakChange = (parameterId: string, tweakId: string) => {
    console.log(`useSimplifiedPromptWizard - tweak selected: ${tweakId} for parameter: ${parameterId}`);
    setSelectedTweaks(prev => ({
      ...prev,
      [parameterId]: tweakId,
    }));
  };
  
  // Manual retry function
  const handleRetry = () => {
    console.log("Manually retrying prompt fetch");
    setRetryCount(prev => prev + 1);
    refetchPrompt();
  };
  
  // Validate the form
  const isFormValid = () => {
    // Check if all required parameters have a selection
    const requiredParameters = parameters?.filter(param => param.rule?.is_required) || [];
    const isValid = requiredParameters.every(param => selectedTweaks[param.id]);
    console.log("useSimplifiedPromptWizard - form validity check:", { 
      isValid, 
      requiredParameters: requiredParameters.length,
      selectedTweaks: Object.keys(selectedTweaks).length 
    });
    return isValid;
  };
  
  // Generate content
  const handleSave = async () => {
    if (!prompt || !user?.id) {
      console.error("useSimplifiedPromptWizard - Missing prompt or user data:", { 
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
      console.warn("useSimplifiedPromptWizard - Form validation failed");
      toast({
        title: "Required Selections Missing",
        description: "Please complete all required customization options",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // Collect all selected tweaks
      const tweakIds = Object.values(selectedTweaks);
      console.log("useSimplifiedPromptWizard - selected tweak IDs:", tweakIds);
      
      // Find the actual tweaks from the parameters
      const selectedTweakDetails = parameters
        .flatMap(param => param.tweaks)
        .filter(tweak => tweakIds.includes(tweak.id));
      
      console.log("useSimplifiedPromptWizard - selected tweak details:", selectedTweakDetails);
      
      const tweakPrompts = selectedTweakDetails.map(tweak => tweak.sub_prompt).join("\n");
      
      console.log("Generating content with:", {
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
      console.log("useSimplifiedPromptWizard - generation result:", result);
      
      toast({
        title: "Content Generated",
        description: "Your customized content has been generated successfully",
      });
      
      // Close the wizard
      onClose();
      
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error Generating Content",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Calculate loading and error states
  const error = promptError || parametersError;
  
  return {
    prompt,
    parameters,
    isLoading: debouncedLoading, // Use the debounced loading state instead
    error,
    generating,
    selectedTweaks,
    additionalContext,
    handleTweakChange,
    setAdditionalContext,
    handleSave,
    isFormValid,
    refetchPrompt,
    handleRetry
  };
}
