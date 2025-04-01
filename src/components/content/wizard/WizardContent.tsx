
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

const WizardContent = React.memo(({
  prompt,
  parameters,
  currentStepIndex,
  selectedTweaks,
  additionalContext,
  setAdditionalContext,
  handleTweakChange
}: WizardContentProps) => {
  // Add more detailed logging to debug parameter rendering
  console.log("WizardContent rendering with:", { 
    promptId: prompt?.id,
    parametersCount: parameters?.length || 0,
    currentStepIndex,
    hasSelectedTweaks: Object.keys(selectedTweaks || {}).length > 0
  });
  
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

  // Debug parameters availability
  if (!parameters || parameters.length === 0) {
    console.log("No parameters available for prompt:", prompt.id);
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
    console.log("Rendering parameter customization for:", param?.name || "unknown");
    
    if (!param) {
      console.error("Parameter at index", currentStepIndex, "is undefined");
      return (
        <Alert className="mb-4 border-red-500">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            Error loading parameter options. Please try again.
          </AlertDescription>
        </Alert>
      );
    }
    
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
});

WizardContent.displayName = "WizardContent";

export default WizardContent;
