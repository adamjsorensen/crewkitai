import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { CompassTask, CompassPriority, CompassAnalyzeResponse } from '@/types/compass';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ListChecks, ArrowRight } from 'lucide-react';
import { useCompassOnboarding } from '@/hooks/tasks/useCompassOnboarding';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TabView from '@/components/compass/TabView';

const CompassPage = () => {
  const [tasks, setTasks] = useState<CompassTask[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasOnboarded } = useCompassOnboarding();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Show onboarding overlay for new users who have completed onboarding
    // but haven't used the Compass feature yet
    if (hasOnboarded === true && !localStorage.getItem('compassFeatureIntroSeen')) {
      setShowOnboardingOverlay(true);
    }
  }, [hasOnboarded]);
  
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
    
    // Mark feature intro as seen when user creates their first plan
    if (showOnboardingOverlay) {
      dismissOnboardingOverlay();
    }
  };
  
  const handleCompleteTask = async (taskId: string) => {
    try {
      // Find the task in the current list
      const taskToComplete = tasks.find(t => t.id === taskId);
      
      // Optimistically update UI
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed_at: new Date().toISOString() } 
          : task
      ));
      
      // Show success message with task details
      toast({
        title: "Task completed!",
        description: taskToComplete ? `Great job completing: ${taskToComplete.task_text.substring(0, 30)}...` : "Great job completing this task."
      });
      
      // Persist to database
      const { error } = await supabase
        .from('compass_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error completing task:', err);
      
      // Revert optimistic update if the server request failed
      setTasks(tasks.map(task => 
        task.id === taskId && task.completed_at 
          ? { ...task, completed_at: null } 
          : task
      ));
      
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
  
  const dismissOnboardingOverlay = () => {
    setShowOnboardingOverlay(false);
    localStorage.setItem('compassFeatureIntroSeen', 'true');
  };
  
  const OnboardingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="bg-primary/10 inline-flex rounded-full p-4 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Strategic Planner</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your personal AI assistant to help you prioritize tasks and stay focused on what matters most.
          </p>
        </div>
        
        <div className="grid gap-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="bg-primary/10 p-2 rounded-full">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Enter Your Tasks</h3>
              <p className="text-sm text-muted-foreground">Type in all your tasks, and the AI will analyze and prioritize them for you.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="bg-primary/10 p-2 rounded-full">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Get Prioritized Results</h3>
              <p className="text-sm text-muted-foreground">Focus on high-priority tasks first to maximize your productivity.</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button onClick={dismissOnboardingOverlay} size="lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-primary">
          Strategic Planner
        </h1>
        <p className="text-muted-foreground mb-6">
          Organize your tasks, prioritize your work, and focus on what matters most
        </p>
        
        {hasOnboarded === false && (
          <div className="mb-6 bg-primary/5 border border-primary/10 rounded-lg p-4">
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
        
        <TabView 
          tasks={tasks.filter(task => !task.completed_at)}
          isLoading={isLoading}
          onPlanCreated={handlePlanCreated}
          onCompleteTask={handleCompleteTask}
          onSetReminder={handleSetReminder}
          onAddToCalendar={handleAddToCalendar}
        />
      </div>
      
      {showOnboardingOverlay && <OnboardingOverlay />}
    </DashboardLayout>
  );
};

export default CompassPage;
