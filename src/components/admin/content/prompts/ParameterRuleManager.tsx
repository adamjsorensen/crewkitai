
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
  const { parameters, isLoading } = useCrewkitPromptParameters();

  console.log("ParameterRuleManager render:", { 
    promptId, 
    parametersCount: parameters.length,
    selectedCount: selectedParameters.length,
    isLoading 
  });
  
  // Update selectedParameterIds when selectedParameters changes
  useEffect(() => {
    const paramIds = selectedParameters.map(param => param.id);
    if (JSON.stringify(paramIds) !== JSON.stringify(selectedParameterIds)) {
      console.log("ParameterRuleManager: Updating selectedParameterIds:", paramIds);
      setSelectedParameterIds(paramIds);
    }
  }, [selectedParameters, setSelectedParameterIds, selectedParameterIds]);

  const handleParameterSelect = (parameterId: string) => {
    console.log("ParameterRuleManager: Parameter selected:", parameterId);
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
      
      setSelectedParameters(prev => [...prev, newParam]);
    }
  };

  const handleRemoveParameter = (parameterId: string) => {
    console.log("ParameterRuleManager: Parameter removed:", parameterId);
    const updatedParameters = selectedParameters.filter(p => p.id !== parameterId);
    // Update order after removal
    const reorderedParameters = updatedParameters.map((p, index) => ({
      ...p,
      order: index,
    }));
    
    setSelectedParameters(reorderedParameters);
  };

  const handleRequiredChange = (parameterId: string, isRequired: boolean) => {
    console.log("ParameterRuleManager: Parameter required changed:", parameterId, isRequired);
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

export default React.memo(ParameterRuleManager);
