
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { useParameterFetching } from "./prompt-wizard/useParameterFetching";
import { useWizardState } from "./prompt-wizard/useWizardState";
import { usePromptGeneration } from "./prompt-wizard/usePromptGeneration";
import { useWizardSteps } from "./prompt-wizard/useWizardSteps";
import { useEffect } from "react";

export function usePromptWizard(
  promptId: string | undefined, 
  isOpen: boolean, 
  onClose: () => void,
  retryCount: number = 0
) {
  const { user } = useAuth();
  
  // Fetch prompt and parameters
  const { 
    prompt, 
    isLoading: isPromptLoading, 
    error: promptError, 
    refetch: refetchPrompt 
  } = usePromptFetching(promptId, isOpen, retryCount);
  
  const { 
    parameters, 
    isLoading: isParametersLoading, 
    error: parameterError 
  } = useParameterFetching(prompt?.id, isOpen);
  
  // Log important state changes for debugging
  useEffect(() => {
    if (prompt) {
      console.log(`Prompt loaded: ${prompt.title} (ID: ${prompt.id})`);
    } else if (promptId && !isPromptLoading && !promptError) {
      console.error("Prompt is undefined after loading completed without errors");
    }
  }, [prompt, promptId, isPromptLoading, promptError]);
  
  useEffect(() => {
    console.log(`Parameters loading state: ${isParametersLoading ? "loading" : "completed"}`);
    if (!isParametersLoading) {
      console.log(`Parameters count: ${parameters?.length || 0}`);
      if (parameters?.length === 0 && prompt?.id) {
        console.log("No parameters found for prompt:", prompt.id);
      }
    }
  }, [parameters, isParametersLoading, prompt?.id]);
  
  // Manage wizard state
  const { 
    currentStepIndex, 
    selectedTweaks, 
    additionalContext, 
    handleNext, 
    handlePrevious, 
    handleTweakChange, 
    setAdditionalContext 
  } = useWizardState(isOpen, promptId);
  
  // Generate content
  const { generating, handleSave } = usePromptGeneration({
    prompt,
    selectedTweaks,
    additionalContext,
    userId: user?.id,
    onClose
  });
  
  // Manage wizard steps
  const { steps, progress, canProceed, isLastStep } = useWizardSteps(
    prompt, 
    parameters,
    selectedTweaks
  );
  
  // Calculate the progress value as a number
  const progressValue = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const isLoading = isPromptLoading || isParametersLoading;
  const error = promptError || parameterError;

  return {
    prompt,
    parameters,
    isLoading,
    error,
    generating,
    selectedTweaks,
    additionalContext,
    currentStepIndex,
    steps, // Make sure we're returning the steps
    progressValue,
    canProceed: canProceed(currentStepIndex),
    isLastStep: isLastStep(currentStepIndex),
    handleNext,
    handlePrevious,
    handleTweakChange,
    handleSave,
    setAdditionalContext,
    refetchPrompt
  };
}
