
import React from "react";
import ParameterCustomization from "./ParameterCustomization";
import AdditionalContextStep from "./AdditionalContextStep";
import ReviewStep from "./ReviewStep";
import NoParametersAlert from "./NoParametersAlert";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface WizardContentProps {
  prompt: Prompt | null;
  parameters: any[];
  currentStepIndex: number;
  selectedTweaks: Record<string, string>;
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
  handleTweakChange: (parameterId: string, tweakId: string) => void;
}

const WizardContent: React.FC<WizardContentProps> = ({
  prompt,
  parameters,
  currentStepIndex,
  selectedTweaks,
  additionalContext,
  setAdditionalContext,
  handleTweakChange
}) => {
  if (!prompt) return null;

  // No parameters case
  if (parameters.length === 0) {
    return (
      <NoParametersAlert 
        additionalContext={additionalContext} 
        setAdditionalContext={setAdditionalContext} 
      />
    );
  }

  // Parameter customization steps
  if (currentStepIndex < parameters.length) {
    const param = parameters[currentStepIndex];
    return (
      <ParameterCustomization 
        parameter={param} 
        selectedTweakId={selectedTweaks[param.id]} 
        onTweakChange={handleTweakChange}
      />
    );
  }

  // Additional context step
  if (currentStepIndex === parameters.length) {
    return (
      <AdditionalContextStep 
        additionalContext={additionalContext} 
        setAdditionalContext={setAdditionalContext}
      />
    );
  }

  // Review step
  if (currentStepIndex === parameters.length + 1) {
    return (
      <ReviewStep 
        prompt={prompt} 
        selectedTweaks={selectedTweaks}
        parameters={parameters}
        additionalContext={additionalContext}
      />
    );
  }

  return null;
};

export default WizardContent;
