
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

  // Wrap the original functions to add logging
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

  const wrappedCreateParameterRule = async (data: any) => {
    console.log("createParameterRule called with data:", data);
    try {
      const result = await createParameterRule.mutateAsync(data);
      console.log("Parameter rule created successfully:", result);
      return result;
    } catch (err) {
      console.error("Error in createParameterRule:", err);
      throw err;
    }
  };

  const wrappedUpdateParameterRule = async (data: any) => {
    console.log("updateParameterRule called with data:", data);
    try {
      const result = await updateParameterRule.mutateAsync(data);
      console.log("Parameter rule updated successfully:", result);
      return result;
    } catch (err) {
      console.error("Error in updateParameterRule:", err);
      throw err;
    }
  };

  const wrappedDeleteParameterRule = async (ruleId: string) => {
    console.log("deleteParameterRule called for ruleId:", ruleId);
    try {
      const result = await deleteParameterRule.mutateAsync(ruleId);
      console.log("Parameter rule deleted successfully:", result);
      return result;
    } catch (err) {
      console.error("Error in deleteParameterRule:", err);
      throw err;
    }
  };

  return {
    getParametersForPrompt: wrappedGetParametersForPrompt,
    createParameterRule: wrappedCreateParameterRule,
    updateParameterRule: wrappedUpdateParameterRule,
    deleteParameterRule: wrappedDeleteParameterRule,
    error
  };
}
