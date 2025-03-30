
import React, { useEffect } from "react";
import { useCrewkitPromptParameters, ParameterWithTweaks } from "@/hooks/useCrewkitPromptParameters";
import ParameterSelection, { SelectedParameter } from "../shared/ParameterSelection";

interface ParameterRuleManagerProps {
  promptId: string | null;
  isCategory: boolean;
  selectedParameters: SelectedParameter[];
  setSelectedParameters: React.Dispatch<React.SetStateAction<SelectedParameter[]>>;
  selectedParameterIds: string[];
  setSelectedParameterIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const ParameterRuleManager: React.FC<ParameterRuleManagerProps> = ({
  promptId,
  isCategory,
  selectedParameters,
  setSelectedParameters,
  selectedParameterIds,
  setSelectedParameterIds
}) => {
  const { parameters, getParametersForPrompt } = useCrewkitPromptParameters();
  
  // Update selectedParameterIds when selectedParameters changes
  useEffect(() => {
    setSelectedParameterIds(selectedParameters.map(param => param.id));
  }, [selectedParameters, setSelectedParameterIds]);

  const handleParameterSelect = (parameterId: string) => {
    // Skip if already selected
    if (selectedParameterIds.includes(parameterId)) return;

    const parameterToAdd = parameters.find(p => p.id === parameterId);
    if (parameterToAdd) {
      const newParam: SelectedParameter = {
        id: parameterToAdd.id,
        name: parameterToAdd.name,
        isRequired: false,
        order: selectedParameters.length, // Add to the end
      };
      
      setSelectedParameters([...selectedParameters, newParam]);
    }
  };

  const handleRemoveParameter = (parameterId: string) => {
    const updatedParameters = selectedParameters.filter(p => p.id !== parameterId);
    // Update order after removal
    const reorderedParameters = updatedParameters.map((p, index) => ({
      ...p,
      order: index,
    }));
    
    setSelectedParameters(reorderedParameters);
  };

  const handleRequiredChange = (parameterId: string, isRequired: boolean) => {
    const updatedParameters = selectedParameters.map(p => 
      p.id === parameterId ? { ...p, isRequired } : p
    );
    
    setSelectedParameters(updatedParameters);
  };

  // Convert parameters to ParameterWithTweaks[] type to satisfy the component prop
  const parametersWithTweaks: ParameterWithTweaks[] = parameters.map(param => ({
    ...param,
    tweaks: [] // Add empty tweaks array
  }));

  // Only render parameter selection for non-category prompts
  if (isCategory) {
    return null;
  }

  return (
    <ParameterSelection
      parameters={parametersWithTweaks}
      selectedParameters={selectedParameters}
      selectedParameterIds={selectedParameterIds}
      onParameterSelect={handleParameterSelect}
      onRemoveParameter={handleRemoveParameter}
      onRequiredChange={handleRequiredChange}
    />
  );
};

export default ParameterRuleManager;
