
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { useParameterFetching } from "./prompt-wizard/useParameterFetching";
import { useWizardState } from "./prompt-wizard/useWizardState";
import { usePromptGeneration } from "./prompt-wizard/usePromptGeneration";
import { useWizardSteps } from "./prompt-wizard/useWizardSteps";

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
    steps,
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
