
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CompassTaskDisplay, CompassAnalyzeResponse, CompassPriority } from '@/types/compass';

export const useCompassTasks = () => {
  const [activeTasks, setActiveTasks] = useState<CompassTaskDisplay[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompassTaskDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setHasOnboarded(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('compass_user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding status:', error);
          toast({
            title: "Error",
            description: "Failed to check your profile status.",
            variant: "destructive",
          });
          return;
        }

        // If we got data back, the user has completed onboarding
        setHasOnboarded(!!data);
      } catch (err) {
        console.error('Error in onboarding check:', err);
      }
    };

    checkOnboardingStatus();
  }, [user, toast]);

  // Load tasks
  const loadTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get the most recent plan
      const { data: planData, error: planError } = await supabase
        .from('compass_plans')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error fetching recent plan:', planError);
        toast({
          title: "Error",
          description: "Failed to load your tasks.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!planData) {
        // No plans yet
        setActiveTasks([]);
        setCompletedTasks([]);
        setIsLoading(false);
        return;
      }

      setCurrentPlanId(planData.id);

      // Now fetch all tasks for this plan
      const { data: tasksData, error: tasksError } = await supabase
        .from('compass_tasks')
        .select(`
          *,
          clarification:compass_clarifications(*)
        `)
        .eq('plan_id', planData.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        toast({
          title: "Error",
          description: "Failed to load your tasks.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Split into active and completed tasks
      const activeTasksList: CompassTaskDisplay[] = [];
      const completedTasksList: CompassTaskDisplay[] = [];

      for (const task of tasksData) {
        // Validate and cast priority to ensure it matches our type
        const priority = task.priority as CompassPriority;
        if (!['High', 'Medium', 'Low'].includes(priority)) {
          console.error(`Invalid priority value: ${priority}`);
          continue;
        }

        // Process clarifications array into single object since we only expect one per task
        const taskWithSingleClarification: CompassTaskDisplay = {
          ...task,
          priority,  // Use the validated priority
          clarification: task.clarification && task.clarification.length > 0 
            ? task.clarification[0] 
            : undefined
        };

        if (task.completed_at) {
          completedTasksList.push(taskWithSingleClarification);
        } else {
          activeTasksList.push(taskWithSingleClarification);
        }
      }

      setActiveTasks(activeTasksList);
      setCompletedTasks(completedTasksList);
    } catch (err) {
      console.error('Error loading tasks:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading your tasks.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (hasOnboarded === true) {
      loadTasks();
    }
  }, [hasOnboarded]);

  // Handle new tasks from CompassInput
  const handleNewTasks = (response: CompassAnalyzeResponse) => {
    setCurrentPlanId(response.plan_id);
    // Reload tasks to get the newly created ones with proper IDs
    loadTasks();
    
    if (response.discarded_count > 0) {
      toast({
        title: "Tasks Prioritized",
        description: `${response.tasks.length} tasks created. ${response.discarded_count} additional tasks were filtered out.`,
      });
    } else {
      toast({
        title: "Tasks Created",
        description: `${response.tasks.length} tasks have been prioritized for you.`,
      });
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
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
  };
};
