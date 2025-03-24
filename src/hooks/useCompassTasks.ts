
import { useEffect } from 'react';
import { useCompassTasksCore } from './tasks/useCompassTasksCore';
import { useTaskCategoryUpdates } from './tasks/useTaskCategoryUpdates';
import { useCompassOnboarding } from './tasks/useCompassOnboarding';
import { CompassAnalyzeResponse } from '@/types/compass';

export const useCompassTasks = () => {
  const {
    activeTasks,
    completedTasks,
    isLoading,
    currentPlanId,
    loadTasks,
    handleNewTasks: handleNewTasksInternal,
  } = useCompassTasksCore();

  const { updateTaskCategory } = useTaskCategoryUpdates();
  const { hasOnboarded, handleOnboardingComplete } = useCompassOnboarding();

  // Initial load
  useEffect(() => {
    if (hasOnboarded === true) {
      loadTasks();
    }
  }, [hasOnboarded, loadTasks]);

  // Create a wrapper that combines task creation with any additional logic
  const handleNewTasks = (response: CompassAnalyzeResponse) => {
    handleNewTasksInternal(response);
  };

  return {
    activeTasks,
    completedTasks,
    isLoading,
    hasOnboarded,
    currentPlanId,
    handleNewTasks,
    handleOnboardingComplete,
    loadTasks,
    updateTaskCategory
  };
};
