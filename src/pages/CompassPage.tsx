
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useCompassTasks } from '@/hooks/useCompassTasks';
import CompassOnboarding from '@/components/compass/CompassOnboarding';
import CompassInput from '@/components/compass/CompassInput';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskViewProvider, useTaskView } from '@/contexts/TaskViewContext';
import { CompassTaskDisplay } from '@/types/compass';
import TaskViewSwitcher from '@/components/compass/TaskViewSwitcher';
import TaskFilters from '@/components/compass/TaskFilters';
import ListView from '@/components/compass/ListView';
import KanbanView from '@/components/compass/KanbanView';
import CalendarView from '@/components/compass/CalendarView';
import CompletedTasksList from '@/components/compass/CompletedTasksList';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';

// This component handles task actions for all views
const TasksContainer = () => {
  const {
    activeTasks,
    completedTasks,
    isLoading,
    loadTasks
  } = useCompassTasks();
  
  const { viewType } = useTaskView();
  const { toast } = useToast();
  
  // Apply filters to the active tasks
  const filteredTasks = useFilteredTasks(activeTasks);

  // Handle task completion
  const markTaskComplete = async (task: CompassTaskDisplay) => {
    try {
      const { error } = await supabase
        .from('compass_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        console.error('Error completing task:', error);
        toast({
          title: "Error",
          description: "Failed to mark task as complete. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Task Completed",
        description: "The task has been marked as complete.",
      });
      
      // Refresh tasks list
      loadTasks();
    } catch (err) {
      console.error('Error in mark complete:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle set reminder
  const openReminderDialog = (task: CompassTaskDisplay) => {
    // This function will be passed to the view components
    // The implementation is already in TaskList.tsx and would be reused
  };

  // Handle calendar integration
  const openCalendarDialog = (task: CompassTaskDisplay) => {
    // This function will be passed to the view components
    // The implementation is already in TaskList.tsx and would be reused
  };

  // Handle clarification
  const openClarificationDialog = (task: CompassTaskDisplay) => {
    // This function will be passed to the view components
    // The implementation is already in TaskList.tsx and would be reused
  };

  // Handle category assignment
  const openCategoryDialog = (task: CompassTaskDisplay) => {
    // This function will be passed to the view components
    // The implementation is already in TaskList.tsx and would be reused
  };

  // Handle tag assignment
  const openTagDialog = (task: CompassTaskDisplay) => {
    // This function will be passed to the view components
    // The implementation is already in TaskList.tsx and would be reused
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  // Render the appropriate view based on viewType
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <TaskViewSwitcher />
        <TaskFilters />
      </div>
      
      {viewType === 'list' && (
        <ListView 
          tasks={filteredTasks}
          onTaskUpdate={loadTasks}
          onComplete={markTaskComplete}
          onReminder={openReminderDialog}
          onCalendar={openCalendarDialog}
          onCategory={openCategoryDialog}
          onTag={openTagDialog}
          onClarify={openClarificationDialog}
        />
      )}
      
      {viewType === 'kanban' && (
        <KanbanView 
          tasks={filteredTasks}
          onTaskUpdate={loadTasks}
          onComplete={markTaskComplete}
          onReminder={openReminderDialog}
          onCalendar={openCalendarDialog}
          onCategory={openCategoryDialog}
          onTag={openTagDialog}
          onClarify={openClarificationDialog}
        />
      )}
      
      {viewType === 'calendar' && (
        <CalendarView 
          tasks={filteredTasks}
          onTaskUpdate={loadTasks}
          onComplete={markTaskComplete}
          onReminder={openReminderDialog}
          onCalendar={openCalendarDialog}
          onCategory={openCategoryDialog}
          onTag={openTagDialog}
          onClarify={openClarificationDialog}
        />
      )}
      
      <CompletedTasksList tasks={completedTasks} />
    </div>
  );
};

const CompassPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    hasOnboarded,
    handleNewTasks,
    handleOnboardingComplete,
  } = useCompassTasks();

  // Redirect to auth page if not logged in
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the Strategic Compass",
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
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">Strategic Compass</h1>
        
        {hasOnboarded === null ? (
          // Loading state
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : hasOnboarded === false ? (
          // Onboarding
          <CompassOnboarding onComplete={handleOnboardingComplete} />
        ) : (
          // Main interface with TaskViewProvider
          <TaskViewProvider>
            <div className="space-y-4">
              <CompassInput onTasksGenerated={handleNewTasks} />
              <TasksContainer />
            </div>
          </TaskViewProvider>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompassPage;
