
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useCompassTasks } from '@/hooks/useCompassTasks';
import CompassOnboarding from '@/components/compass/CompassOnboarding';
import CompassInput from '@/components/compass/CompassInput';
import TaskList from '@/components/compass/TaskList';
import CompletedTasksList from '@/components/compass/CompletedTasksList';
import { Skeleton } from '@/components/ui/skeleton';

const CompassPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    activeTasks,
    completedTasks,
    isLoading,
    hasOnboarded,
    handleNewTasks,
    handleOnboardingComplete,
    loadTasks,
  } = useCompassTasks();

  // Redirect to auth page if not logged in
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the Strategic Planner",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isAuthLoading, navigate, toast]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Strategic Planner</h1>
        
        {hasOnboarded === null ? (
          // Loading state
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : hasOnboarded === false ? (
          // Onboarding
          <CompassOnboarding onComplete={handleOnboardingComplete} />
        ) : (
          // Main interface
          <div className="space-y-4">
            <CompassInput onTasksGenerated={handleNewTasks} />
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <>
                <TaskList tasks={activeTasks} onTaskUpdate={loadTasks} />
                <CompletedTasksList tasks={completedTasks} />
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompassPage;
