
import { useState, useCallback } from 'react';
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
  const wrappedGetParametersForPrompt = useCallback(async (promptId: string) => {
    console.log("getParametersForPrompt called for promptId:", promptId);
    try {
      if (!promptId) {
        console.error("Cannot fetch parameters: promptId is undefined or null");
        throw new Error("Invalid prompt ID provided");
      }
      
      const result = await getParametersForPrompt(promptId);
      
      if (!Array.isArray(result)) {
        console.error("getParametersForPrompt returned invalid data:", result);
        throw new Error("Unexpected data format returned when fetching parameters");
      }
      
      console.log("Parameters fetched successfully:", result);
      if (result.length === 0) {
        console.info("No parameter rules found for prompt", promptId);
      }
      
      return result;
    } catch (err: any) {
      console.error("Error in getParametersForPrompt:", err);
      // Ensure we're always returning an array even on error
      throw err;
    }
  }, [getParametersForPrompt]);

  return {
    getParametersForPrompt: wrappedGetParametersForPrompt,
    createParameterRule,   // Return the original mutation object
    updateParameterRule,   // Return the original mutation object
    deleteParameterRule,   // Return the original mutation object
    error
  };
}
