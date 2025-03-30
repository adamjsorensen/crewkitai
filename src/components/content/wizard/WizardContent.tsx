
import React from "react";
import ParameterCustomization from "./ParameterCustomization";
import AdditionalContextStep from "./AdditionalContextStep";
import ReviewStep from "./ReviewStep";
import NoParametersAlert from "./NoParametersAlert";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
  if (!prompt) {
    return (
      <Alert className="mb-4 border-amber-500">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          No prompt data available. Please try selecting a different prompt.
        </AlertDescription>
      </Alert>
    );
  }

  // No parameters case - skip to the additional context step
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
