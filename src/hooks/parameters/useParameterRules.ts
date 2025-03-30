
import { useState } from 'react';
import { useParameterRulesFetching } from './useParameterRulesFetching';
import { useParameterRuleMutations } from './useParameterRuleMutations';

export function useParameterRules() {
  const [error, setError] = useState<string | null>(null);
  const { getParametersForPrompt, error: fetchError } = useParameterRulesFetching();
  const { createParameterRule, updateParameterRule, deleteParameterRule } = useParameterRuleMutations();
  
  // Combine errors from both hooks
  if (fetchError && !error) {
    console.error("Parameter rules hook error:", fetchError);
    setError(fetchError);
  }

  // Wrap the original function to add logging
  const wrappedGetParametersForPrompt = async (promptId: string) => {
    console.log("getParametersForPrompt called for promptId:", promptId);
    try {
      const result = await getParametersForPrompt(promptId);
      console.log("Parameters fetched successfully:", result);
      if (result.length === 0) {
        console.info("No parameter rules found for prompt", promptId);
      }
      return result;
    } catch (err) {
      console.error("Error in getParametersForPrompt:", err);
      throw err;
    }
  };

  // Note: We're not wrapping the mutation objects anymore, just passing them through
  // This ensures they maintain their original interface, including mutateAsync

  return {
    getParametersForPrompt: wrappedGetParametersForPrompt,
    createParameterRule,   // Return the original mutation object
    updateParameterRule,   // Return the original mutation object
    deleteParameterRule,   // Return the original mutation object
    error
  };
}
