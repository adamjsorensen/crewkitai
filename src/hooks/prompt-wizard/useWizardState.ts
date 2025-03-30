
import { useState, useEffect } from "react";

export function useWizardState(isOpen: boolean, promptId: string | undefined) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Reset state when wizard is opened with a new prompt
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setSelectedTweaks({});
      setAdditionalContext("");
    }
  }, [isOpen, promptId]);

  const handleNext = () => {
    setCurrentStepIndex(prevIndex => prevIndex + 1);
  };
  
  const handlePrevious = () => {
    setCurrentStepIndex(prevIndex => Math.max(0, prevIndex - 1));
  };
  
  const handleTweakChange = (parameterId: string, tweakId: string) => {
    setSelectedTweaks(prev => ({
      ...prev,
      [parameterId]: tweakId,
    }));
  };

  return {
    currentStepIndex,
    selectedTweaks,
    additionalContext,
    setCurrentStepIndex,
    handleNext,
    handlePrevious,
    handleTweakChange,
    setAdditionalContext
  };
}
