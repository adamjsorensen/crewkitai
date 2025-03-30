
import { useParametersFetching } from './parameters/useParametersFetching';
import { useParameterMutations } from './parameters/useParameterMutations';
import { useTweakMutations } from './parameters/useTweakMutations';
import { useParameterRules } from './parameters/useParameterRules';
import { PromptParameter, ParameterTweak, PromptParameterRule, ParameterWithTweaks } from '@/types/promptParameters';

// Re-export the types for backward compatibility
export type { PromptParameter, ParameterTweak, PromptParameterRule, ParameterWithTweaks };

export function useCrewkitPromptParameters() {
  const { parameters, tweaks, isLoading, isError, error: fetchError } = useParametersFetching();
  const { createParameter, updateParameter, deleteParameter } = useParameterMutations();
  const { createParameterTweak, updateParameterTweak, deleteParameterTweak } = useTweakMutations();
  const { 
    getParametersForPrompt, 
    createParameterRule, 
    updateParameterRule, 
    deleteParameterRule, 
    error: rulesError 
  } = useParameterRules();
  
  // Combine errors from different hooks
  const error = fetchError || rulesError;

  return {
    parameters,
    tweaks,
    isLoading,
    isError,
    error,
    createParameter,
    updateParameter,
    deleteParameter,
    createParameterTweak,
    updateParameterTweak,
    deleteParameterTweak,
    getParametersForPrompt,
    createParameterRule,
    updateParameterRule,
    deleteParameterRule
  };
}
