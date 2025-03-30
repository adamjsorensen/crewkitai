
import { usePromptsFetching } from './crewkit-prompts/usePromptsFetching';
import { usePromptMutations } from './crewkit-prompts/usePromptMutations';
import { usePromptOperations } from './crewkit-prompts/usePromptOperations';
import { HubAreaType, Prompt, CreatePromptInput, UpdatePromptInput } from './crewkit-prompts/types';

// Re-export the types for backward compatibility
export type { HubAreaType, Prompt, CreatePromptInput, UpdatePromptInput };

export function useCrewkitPrompts(parentId: string | null = null) {
  const { prompts, isLoading, isError, error: fetchError } = usePromptsFetching(parentId);
  const { createPrompt, updatePrompt, deletePrompt } = usePromptMutations();
  const { getAllPrompts, getPromptById, error: operationsError } = usePromptOperations();
  
  // Combine errors from different hooks
  const error = fetchError || operationsError;

  return {
    prompts,
    isLoading,
    isError,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    getAllPrompts,
    getPromptById,
  };
}
