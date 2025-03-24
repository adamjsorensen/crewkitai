import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CompassInput from '@/components/compass/CompassInput';
import TaskList from '@/components/compass/TaskList';
import { CompassTask, CompassPriority } from '@/types/compass';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCompassOnboarding } from '@/hooks/tasks/useCompassOnboarding';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CompassPage = () => {
  const [tasks, setTasks] = useState<CompassTask[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasOnboarded } = useCompassOnboarding();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && hasOnboarded !== null) {
      if (!hasOnboarded) {
        navigate('/onboarding');
      } else {
        loadLatestPlan();
      }
    }
  }, [user, hasOnboarded, navigate]);
  
  const loadLatestPlan = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: planData, error: planError } = await supabase
        .from('compass_plans')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (planError && planError.code !== 'PGRST116') {
        throw planError;
      }
      
      if (planData) {
        setCurrentPlanId(planData.id);
        await loadTasksForPlan(planData.id);
      } else {
        setTasks([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading plan:', err);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load your strategic plan. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };
  
  const loadTasksForPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('compass_tasks')
        .select('*')
        .eq('plan_id', planId)
        .order('priority', { ascending: false }) // High priority first
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      const typedTasks = data?.map(task => ({
        ...task,
        priority: task.priority as CompassPriority
      })) || [];
      
      setTasks(typedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      toast({
        title: "Error",
        description: "Failed to load your tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlanCreated = async (planId: string) => {
    setCurrentPlanId(planId);
    await loadTasksForPlan(planId);
  };
  
  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('compass_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed_at: new Date().toISOString() } 
          : task
      ));
      
      toast({
        title: "Task completed!",
        description: "Great job completing this task."
      });
    } catch (err) {
      console.error('Error completing task:', err);
      toast({
        title: "Error",
        description: "Failed to mark task as complete. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSetReminder = (taskId: string) => {
    toast({
      title: "Coming soon!",
      description: "Reminders will be available in a future update."
    });
  };
  
  const handleAddToCalendar = (taskId: string) => {
    toast({
      title: "Coming soon!",
      description: "Calendar integration will be available in a future update."
    });
  };
  
  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6">
          Strategic Planner (Compass)
        </h1>
        
        {hasOnboarded === false && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
            <p className="mb-3">
              To get the most out of the Strategic Planner, we need some information about your business.
            </p>
            <Button
              onClick={() => navigate('/onboarding')}
            >
              Complete Profile
            </Button>
          </div>
        )}
        
        <div className="space-y-8">
          <CompassInput onPlanCreated={handlePlanCreated} />
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading your plan...</span>
            </div>
          ) : (
            <TaskList 
              tasks={tasks.filter(task => !task.completed_at)} 
              onCompleteTask={handleCompleteTask}
              onSetReminder={handleSetReminder}
              onAddToCalendar={handleAddToCalendar}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompassPage;
