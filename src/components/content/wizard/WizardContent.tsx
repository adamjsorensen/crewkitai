
import React, { useMemo } from "react";
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
  // Memoize log data to avoid unnecessary console logs
  const logData = useMemo(() => ({
    promptId: prompt?.id,
    parametersCount: parameters?.length || 0,
    currentStepIndex,
    hasSelectedTweaks: Object.keys(selectedTweaks || {}).length > 0
  }), [prompt?.id, parameters?.length, currentStepIndex, selectedTweaks]);
  
  // Log only when the data actually changes
  React.useEffect(() => {
    console.log("WizardContent rendering with:", logData);
  }, [logData]);
  
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

  // Safely access parameters and memoize this check
  const safeParameters = useMemo(() => 
    Array.isArray(parameters) ? parameters : [], 
    [parameters]
  );
  
  if (safeParameters.length === 0) {
    console.log("No parameters available for prompt:", prompt.id);
    return (
      <NoParametersAlert 
        additionalContext={additionalContext} 
        setAdditionalContext={setAdditionalContext} 
      />
    );
  }

  // Parameter customization steps
  if (currentStepIndex < safeParameters.length) {
    const param = safeParameters[currentStepIndex];
    
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
  if (currentStepIndex === safeParameters.length) {
    return (
      <AdditionalContextStep 
        additionalContext={additionalContext} 
        setAdditionalContext={setAdditionalContext}
      />
    );
  }

  // Review step
  if (currentStepIndex === safeParameters.length + 1) {
    return (
      <ReviewStep 
        prompt={prompt} 
        selectedTweaks={selectedTweaks}
        parameters={safeParameters}
        additionalContext={additionalContext}
      />
    );
  }

  return null;
};

export default React.memo(WizardContent);
