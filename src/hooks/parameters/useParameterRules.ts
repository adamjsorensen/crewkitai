
import { useState } from 'react';
import { useParameterRulesFetching } from './useParameterRulesFetching';
import { useParameterRuleMutations } from './useParameterRuleMutations';

export function useParameterRules() {
  const [error, setError] = useState<string | null>(null);
  const { getParametersForPrompt, error: fetchError } = useParameterRulesFetching();
  const { createParameterRule, updateParameterRule, deleteParameterRule } = useParameterRuleMutations();
  
  // Combine errors from both hooks
  if (fetchError && !error) {
    setError(fetchError);
  }

  return {
    getParametersForPrompt,
    createParameterRule,
    updateParameterRule,
    deleteParameterRule,
    error
  };
}
