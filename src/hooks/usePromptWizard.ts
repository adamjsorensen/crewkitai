
import { useAuth } from "@/contexts/AuthContext";
import { usePromptFetching } from "./prompt-wizard/usePromptFetching";
import { useParameterFetching } from "./prompt-wizard/useParameterFetching";
import { useWizardState } from "./prompt-wizard/useWizardState";
import { usePromptGeneration } from "./prompt-wizard/usePromptGeneration";
import { useWizardSteps } from "./prompt-wizard/useWizardSteps";

export function usePromptWizard(promptId: string | undefined, isOpen: boolean, onClose: () => void) {
  const { user } = useAuth();
  
  // Fetch prompt and parameters
  const { prompt, isLoading: isPromptLoading, error: promptError } = usePromptFetching(promptId, isOpen);
  const { parameters, isLoading: isParametersLoading, error: parameterError } = useParameterFetching(prompt?.id, isOpen);
  
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
    progress,
    canProceed: canProceed(currentStepIndex),
    isLastStep: isLastStep(currentStepIndex),
    handleNext,
    handlePrevious,
    handleTweakChange,
    handleSave,
    setAdditionalContext
  };
}
